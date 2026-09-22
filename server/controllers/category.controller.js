import Category from '../models/category.model.js';
import Topic from '../models/topic.model.js';
import { Course } from '../models/course.model.js';
import { slugify } from '../utils/slugify.js';
import { upsertSearchSuggestion } from '../helpers/searchSuggestion.helper.js';

const buildCategoryTree = (categories) => {
  const byParent = new Map();

  categories.forEach((category) => {
    const parentId = category.parent?._id?.toString() || category.parent?.toString() || 'root';
    if (!byParent.has(parentId)) byParent.set(parentId, []);
    byParent.get(parentId).push(category);
  });

  const attachChildren = (category) => ({
    ...category,
    children: (byParent.get(category._id.toString()) || []).map(attachChildren),
  });

  return (byParent.get('root') || []).map(attachChildren);
};

const getPopulatedCategories = async () => {
  const [categories, courseCounts] = await Promise.all([
    Category.find({})
      .populate('parent', 'name slug parent')
      .sort({ name: 1 })
      .lean(),
    Course.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: { $toLower: "$category" }, count: { $sum: 1 } } }
    ])
  ]);

  const countMap = new Map();
  courseCounts.forEach((c) => {
    if (c._id) {
      countMap.set(c._id.toLowerCase(), c.count);
    }
  });

  // Direct counts
  const categoriesWithCount = categories.map((cat) => {
    const nameCount = cat.name ? countMap.get(cat.name.toLowerCase()) || 0 : 0;
    const slugCount = cat.slug ? countMap.get(cat.slug.toLowerCase()) || 0 : 0;
    return {
      ...cat,
      isParent: !cat.parent,
      directCount: Math.max(nameCount, slugCount),
      courseCount: Math.max(nameCount, slugCount),
    };
  });

  // Roll up children counts into parent categories
  const catMap = new Map(categoriesWithCount.map((c) => [c._id.toString(), c]));
  categoriesWithCount.forEach((cat) => {
    if (cat.parent) {
      let currentParentId = cat.parent?._id?.toString() || cat.parent?.toString();
      let depth = 0;
      while (currentParentId && depth < 5) {
        const parentCat = catMap.get(currentParentId);
        if (parentCat) {
          parentCat.courseCount += cat.directCount;
          currentParentId = parentCat.parent?._id?.toString() || parentCat.parent?.toString();
          depth++;
        } else {
          break;
        }
      }
    }
  });

  return {
    categories: categoriesWithCount,
    categoryTree: buildCategoryTree(categoriesWithCount),
  };
};

export const createCategory = async (req, res) => {
  try {
    const { name, parent = null } = req.body;
    const trimmedName = name?.trim();

    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    let parentCategory = null;
    let isSubChild = false;
    if (parent) {
      parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({ success: false, message: 'Parent category not found.' });
      }
      if (parentCategory.parent) {
        const grandparent = await Category.findById(parentCategory.parent);
        if (grandparent && grandparent.parent) {
          return res.status(400).json({ success: false, message: 'Maximum category depth of 3 levels exceeded. You can only create up to a sub-child category.' });
        }
        // parentCategory has a parent, which means parentCategory is a child category (level 1)
        // and this new category is a sub-child category (level 2)
        isSubChild = true;
      }
    }

    const slug = slugify(trimmedName);
    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      return res.status(409).json({ success: false, message: 'A category with this name already exists.' });
    }

    const newCategory = await Category.create({
      name: trimmedName,
      slug,
      parent: parentCategory?._id || null,
    });

    // Automatically create corresponding Topic for sub-child categories
    if (isSubChild && parentCategory) {
      const existingTopic = await Topic.findOne({ slug });
      if (!existingTopic) {
        await Topic.create({
          name: trimmedName,
          slug,
          type: 'topic',
          parentCategory: parentCategory.name,
          bannerTitle: `${trimmedName} Courses`,
          description: `Explore top-rated online courses in ${trimmedName}. Master new skills with curated paths and hands-on practice.`,
          relatedTopics: [],
        });
      }
    }

    await upsertSearchSuggestion(trimmedName);

    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const payload = await getPopulatedCategories();
    res.status(200).json({ success: true, ...payload });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const previousSlug = category.slug;
    let newSlug = previousSlug;

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Category name cannot be empty.' });
      }

      newSlug = slugify(trimmedName);
      const duplicate = await Category.findOne({ slug: newSlug, _id: { $ne: category._id } });
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'A category with this name already exists.' });
      }

      category.name = trimmedName;
      category.slug = newSlug;
    }

    if (parent !== undefined) {
      if (!parent) {
        category.parent = null;
      } else {
        if (parent === category._id.toString()) {
          return res.status(400).json({ success: false, message: 'A category cannot be its own parent.' });
        }

        const childCount = await Category.countDocuments({ parent: category._id });
        if (childCount > 0) {
          return res.status(400).json({ success: false, message: 'A parent category with children cannot be moved under another parent.' });
        }

        const parentCategory = await Category.findById(parent);
        if (!parentCategory) {
          return res.status(404).json({ success: false, message: 'Parent category not found.' });
        }
        if (parentCategory.parent) {
          const grandparent = await Category.findById(parentCategory.parent);
          if (grandparent && grandparent.parent) {
            return res.status(400).json({ success: false, message: 'Maximum category depth of 3 levels exceeded. You can only create up to a sub-child category.' });
          }
        }

        category.parent = parentCategory._id;
      }
    }

    await category.save();

    if (name !== undefined) {
      await upsertSearchSuggestion(category.name);

      // Sync existing topic if one exists
      await Topic.findOneAndUpdate(
        { slug: previousSlug },
        {
          name: category.name,
          slug: newSlug,
          bannerTitle: `${category.name} Courses`,
        }
      );
    }

    const updatedCategory = await Category.findById(category._id).populate('parent', 'name slug parent');
    res.status(200).json({ success: true, category: updatedCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const childCount = await Category.countDocuments({ parent: req.params.id });
    if (childCount > 0) {
      return res.status(400).json({ success: false, message: 'Delete child categories before deleting this parent category.' });
    }

    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    // Also delete any associated topic for this category
    await Topic.findOneAndDelete({ slug: deletedCategory.slug });

    res.status(200).json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Synchronize any existing sub-child categories in the database to ensure
 * they have matching Topic records in MongoDB.
 */
export const syncSubChildTopics = async () => {
  try {
    const categories = await Category.find({}).lean();
    const catMap = new Map(categories.map((c) => [c._id.toString(), c]));

    for (const cat of categories) {
      if (cat.parent) {
        const parentCat = catMap.get(cat.parent.toString());
        // If parentCat exists and parentCat has a parent, cat is level 2 (sub-child category)
        if (parentCat && parentCat.parent) {
          const topicExists = await Topic.findOne({ slug: cat.slug });
          if (!topicExists) {
            await Topic.create({
              name: cat.name,
              slug: cat.slug,
              type: 'topic',
              parentCategory: parentCat.name,
              bannerTitle: `${cat.name} Courses`,
              description: `Explore top-rated online courses in ${cat.name}. Master new skills with curated paths and hands-on practice.`,
              relatedTopics: [],
            });
            console.log(`[TopicSync] Auto-created topic for sub-child category: ${cat.name} (${cat.slug})`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[TopicSync] Error syncing sub-child topics:', err);
  }
};
