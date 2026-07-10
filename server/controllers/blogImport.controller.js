// server/controllers/blogImport.controller.js
//
// Admin-only endpoint that accepts the same JSON shape as blogSeedData.js
// and upserts categories, authors, and articles — identical logic to the
// seed script, just triggered over HTTP instead of the CLI.
//
// POST /api/v1/admin/blog-import
// Body: { categories: string[], authors: [...], articles: [...] }
// Auth: isAuthenticated + authorizeRoles("admin")

import Category from "../models/category.model.js";
import Author from "../models/author.model.js";
import Article from "../models/article.model.js";
import { slugify } from "../utils/slugify.js";

export const importBlogData = async (req, res) => {
  const { categories = [], authors = [], articles = [] } = req.body;

  // ── Basic validation ────────────────────────────────────────────────────────
  if (!Array.isArray(categories) || !Array.isArray(authors) || !Array.isArray(articles)) {
    return res.status(400).json({
      success: false,
      message: "Body must contain 'categories' (string[]), 'authors' (object[]), and 'articles' (object[]).",
    });
  }

  const results = { categories: 0, authors: 0, articlesCreated: 0, articlesUpdated: 0, skipped: [] };

  try {
    // ── 1. Upsert categories ──────────────────────────────────────────────────
    const categoryNameToId = new Map();

    for (const name of categories) {
      if (typeof name !== "string" || !name.trim()) continue;
      const slug = slugify(name.trim());
      const doc = await Category.findOneAndUpdate(
        { slug },
        { name: name.trim(), slug },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      categoryNameToId.set(name.trim(), doc._id);
      results.categories += 1;
    }

    // ── 2. Upsert authors ────────────────────────────────────────────────────
    const authorNameToId = new Map();

    for (const author of authors) {
      if (!author?.name?.trim() || !author?.avatar?.trim()) {
        results.skipped.push(`Author missing name or avatar: ${JSON.stringify(author)}`);
        continue;
      }
      const slug = slugify(author.name.trim());
      const doc = await Author.findOneAndUpdate(
        { slug },
        { name: author.name.trim(), slug, avatar: author.avatar.trim(), bio: author.bio || "" },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      authorNameToId.set(author.name.trim(), doc._id);
      results.authors += 1;
    }

    // ── 3. Upsert articles ───────────────────────────────────────────────────
    for (const article of articles) {
      if (!article?.title?.trim()) {
        results.skipped.push(`Article missing title: ${JSON.stringify(article)}`);
        continue;
      }

      const categoryId = categoryNameToId.get(article.category);
      const authorId = authorNameToId.get(article.author);

      if (!categoryId) {
        results.skipped.push(`"${article.title}" — unknown category "${article.category}"`);
        continue;
      }
      if (!authorId) {
        results.skipped.push(`"${article.title}" — unknown author "${article.author}"`);
        continue;
      }
      if (!Array.isArray(article.content) || article.content.length === 0) {
        results.skipped.push(`"${article.title}" — content array is empty or missing`);
        continue;
      }

      const slug = slugify(article.title.trim());
      const payload = {
        title: article.title.trim(),
        featuredImage: article.featuredImage || "",
        content: article.content,
        author: authorId,
        category: categoryId,
        popular: article.popular ?? false,
      };

      const existing = await Article.findOne({ slug });
      if (existing) {
        Object.assign(existing, payload);
        await existing.save();
        results.articlesUpdated += 1;
      } else {
        const doc = new Article(payload);
        await doc.save(); // pre-save hook generates slug
        results.articlesCreated += 1;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Import complete. ${results.categories} categories, ${results.authors} authors, ${results.articlesCreated} articles created, ${results.articlesUpdated} updated.`,
      results,
    });
  } catch (error) {
    console.error("blogImport error:", error.message);
    return res.status(500).json({
      success: false,
      message: `Import failed: ${error.message}`,
      results,
    });
  }
};