import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { SearchSuggestion } from "../models/searchSuggestion.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

// --- UPDATED IMPORTS ---
// We now only need createEmbeddingForText (which uses Xenova) and cosineSimilarity.
import {
  cosineSimilarity,
  createEmbeddingForText,
} from "../utils/embedding.js";




// ✅ CLEANED UP AND SIMPLIFIED
export const createCourse = async (req, res) => {
  try {
    const {
      title,
      category,
      price,
      // ... other fields from body
      language,
      level,
      subtitle,
      description,
      learnings,
    } = req.body;

    if (!title || !category || !price || !price.original || !price.current) {
      return res.status(400).json({
        message:
          "Title, category, and a full price object (original, current) are required.",
      });
    }

    // --- REMOVED MANUAL EMBEDDING ---
    // The Mongoose 'pre-save' hook in your Course model now handles
    // embedding generation automatically. This block is no longer needed.

    const course = await Course.create({
      title,
      category,
      language: language || "English",
      level: level || "All Levels",
      price,
      subtitle,
      description,
      learnings,
      creator: req.id, // ensure your auth middleware sets req.id
      // The 'embedding' field is also removed from here.
    });

    return res.status(201).json({
      course,
      message: "Course created successfully. Embedding will be generated automatically.",
    });
  } catch (error) {
    console.error("Failed to create course:", error);
    return res.status(500).json({ message: "Failed to create course" });
  }
};

// --- UPDATED FOR XENOVA/LOCAL MODEL ---
export const getSearchResults = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(200).json({ suggestions: [], courses: [] });
    }

    // 1. Generate query embedding using our local Xenova model via the utility function
    const queryEmbedding = await createEmbeddingForText(q.trim());

    if (!queryEmbedding) {
      throw new Error("Failed to generate embedding for query");
    }

    // 2. Fetch all published courses with embeddings (limit or paginate in real use)
    // For production, you should use MongoDB's $vectorSearch for this query.
    // This manual approach is fine for smaller datasets.
    const allCourses = await Course.find({
      isPublished: true,
      embedding: { $exists: true, $ne: [] },
    }).select("_id title subtitle category thumbnail creator embedding");

    // 3. Calculate similarity for each course
    const coursesWithSimilarity = allCourses
      .map((course) => ({
        ...course.toObject(),
        similarity: cosineSimilarity(queryEmbedding, course.embedding),
      }))
      // 4. Sort descending by similarity and filter out low-similarity results
      .sort((a, b) => b.similarity - a.similarity)
      .filter((course) => course.similarity > 0.3) // Optional: set a threshold
      // 5. Limit to top results
      .slice(0, 10);

    // 6. Fetch suggestions (no changes here)
    const sanitizedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(sanitizedQuery, "i");
    const suggestionDocs = await SearchSuggestion.find({ term: searchRegex })
      .limit(8)
      .lean();
    const suggestions = suggestionDocs.map((s) => s.term);

    res.status(200).json({ suggestions, courses: coursesWithSimilarity });
  } catch (error) {
    console.error("Search controller error:", error);
    res.status(500).json({ message: "Server error during search." });
  }
};


// ✅ CLEANED UP AND SIMPLIFIED
export const editCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      title,
      subtitle,
      description,
      category,
      language,
      level,
      price,
      learnings,
      requirements,
      includes,
    } = req.body;
    const thumbnailFile = req.file;

    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    // --- Handle Thumbnail Upload ---
    if (thumbnailFile) {
      if (course.thumbnail) {
        const publicId = course.thumbnail.split("/").pop().split(".")[0];
        await deleteFromCloudinary(publicId);
      }
      const newThumbnail = await uploadMedia(thumbnailFile.path);
      course.thumbnail = newThumbnail.secure_url;
    }

    // --- Update Fields ---
    // Using a loop to avoid repetitive `|| course.title` lines
    const fieldsToUpdate = { title, subtitle, description, category, language, level, learnings, requirements, includes };
    for (const key in fieldsToUpdate) {
      if (fieldsToUpdate[key] !== undefined) {
        course[key] = fieldsToUpdate[key];
      }
    }
    if (price) {
      course.price.original = price.original || course.price.original;
      course.price.current = price.current || course.price.current;
    }

    // --- REMOVED MANUAL EMBEDDING ---
    // The Mongoose 'pre-save' hook will automatically detect the changes
    // above and regenerate the embedding when we call `course.save()`.

    const updatedCourse = await course.save();

    return res.status(200).json({
      course: updatedCourse,
      message: "Course updated successfully.",
    });
  } catch (error) {
    console.error("Failed to update course:", error);
    return res.status(500).json({ message: "Failed to update course" });
  }
};


// ===================================================================================
// NO CHANGES NEEDED FOR THE FOLLOWING CONTROLLERS as they don't handle embedding logic
// ===================================================================================

export const searchCourse = async (req, res) => {
  try {
    const { query = "", categories = [], sortByPrice = "" } = req.query;

    const searchCriteria = {
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { subtitle: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    };

    if (categories.length > 0) {
      searchCriteria.category = { $in: categories };
    }

    const sortOptions = {};
    if (sortByPrice === "low") {
      sortOptions["price.current"] = 1;
    } else if (sortByPrice === "high") {
      sortOptions["price.current"] = -1;
    }

    let courses = await Course.find(searchCriteria)
      .populate({ path: "creator", select: "name photoUrl" })
      .sort(sortOptions);

    return res.status(200).json({
      success: true,
      courses: courses || [],
    });
  } catch (error) {
    console.error("Search Course error:", error);
    res.status(500).json({ message: "Failed to search courses." });
  }
};


async function getCourseProgressPercent(courseId, userId) {
    // --- EXAMPLE LOGIC ---
    // 1. Find the course and count its total lectures.
    // const course = await Course.findById(courseId).select('sections');
    // const totalLectures = await Lecture.countDocuments({ section: { $in: course.sections } });
    // if (totalLectures === 0) return 0;
    //
    // 2. Find the user's progress for that course.
    // const userProgress = await UserProgress.findOne({ userId, courseId });
    // const completedLectures = userProgress?.completedLectures?.length || 0;
    //
    // 3. Calculate percentage.
    // return Math.round((completedLectures / totalLectures) * 100);

    // For now, returning a placeholder value:
    return 0; // Replace with your actual progress calculation logic.
}


export const getPublishedCourse = async (req, res) => {
  try {
    const userId = req.id; // From your auth middleware

    let courses = await Course.find({ isPublished: true })
      .populate({ path: "creator", select: "name photoUrl" })
      .lean();

    // ✅ CORE LOGIC CHANGE:
    // We will now loop through all courses and add information, not filter them.
    if (userId) {
      const user = await User.findById(userId).select("enrolledCourses").lean();
      const enrolledCourseIds = new Set(
        user?.enrolledCourses?.map((id) => id.toString()) || []
      );

      // Decorate each course with purchase status and progress.
      for (let course of courses) {
        if (enrolledCourseIds.has(course._id.toString())) {
          // If the course is purchased:
          course.isPurchased = true;
          // Fetch and add the user's progress for this specific course.
          course.progress = await getCourseProgressPercent(course._id, userId);
        } else {
          // If not purchased, explicitly set to false.
          course.isPurchased = false;
          course.progress = 0;
        }
      }
    }

    // Return the full, decorated list of courses.
    return res.status(200).json({ courses });
    
  } catch (error) {
    console.error("Error fetching published courses:", error);
    return res.status(500).json({
      message: "Failed to get published courses",
    });
  }
};

export const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.id;
    const courses = await Course.find({ creator: userId });
    if (!courses) {
      return res.status(404).json({
        courses: [],
        message: "Course not found",
      });
    }
    return res.status(200).json({
      courses,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to create course",
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const course = await Course.findById(courseId)
      .populate({
        path: "sections",
        populate: { path: "lectures" },
      })
      .populate("creator", "name headline photoUrl")
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          select: "name photoUrl",
        },
      });

    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    let purchaseStatus = "not_purchased";
    let allowReview = false;
    let progress = 0;

    if (userId) {
      const purchase = await CoursePurchase.findOne({
        userId,
        "courses.courseId": courseId,
        status: "completed",
      });

      if (purchase) {
        purchaseStatus = "completed";
        allowReview = true;
      }
      // progress = await getCourseProgressPercent(courseId, userId);
    }

    return res.status(200).json({
      success: true,
      course,
      purchaseStatus,
      allowReview,
      progress,
    });
  } catch (error) {
    console.error("Error in getCourseById:", error);
    return res.status(500).json({ message: "Failed to get course by id" });
  }
};

export const togglePublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { publish } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    course.isPublished = publish === "true";
    await course.save();

    const statusMessage = course.isPublished ? "Published" : "Unpublished";
    return res.status(200).json({ message: `Course is ${statusMessage}` });
  } catch (error) {
    console.error("Toggle publish error:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

export const removeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    if (course.thumbnail) {
      try {
        const urlParts = course.thumbnail.split("/");
        const filenameWithExt = urlParts[urlParts.length - 1].split("?")[0];
        const publicId = filenameWithExt.split(".")[0];
        await deleteFromCloudinary(publicId);
      } catch (err) {
        console.warn("Failed to delete thumbnail from Cloudinary:", err);
      }
    }

    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({ message: "Course removed successfully." });
  } catch (error) {
    console.error("Failed to remove course:", error);
    return res.status(500).json({ message: "Failed to remove course" });
  }
};


export const getCoursesWithEnrolledStudents = async (req, res) => {
  try {
    // Fetch all courses with enrolled students populated (select limited fields)
    const courses = await Course.find()
      .populate("enrolledStudents", "name email photoUrl")
      .lean();

    // Format the response
    const result = courses.map((course) => ({
      courseId: course._id,
      courseTitle: course.title,
      enrolledCount: course.enrolledStudents?.length || 0,
      students: course.enrolledStudents || [],
      price: course.price, // { original, current }
      ratings: course.ratings,
      numOfReviews: course.numOfReviews,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level,
      creator: course.creator,
    }));

    return res.status(200).json({ courses: result });
  } catch (error) {
    console.error("Failed to fetch courses and students:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch courses and students" });
  }
};

export const getCoursesWithEnrolledStudentsAndReviews = async (req, res) => {
  try {
    // Fetch courses with enrolled students and nested reviews populated with user info
    const courses = await Course.find()
      .populate("enrolledStudents", "name email photoUrl")
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          select: "name email photoUrl",
        },
      })
      .lean();

    // Format the response
    const result = courses.map((course) => ({
      courseId: course._id,
      courseTitle: course.title,
      enrolledCount: course.enrolledStudents?.length || 0,
      students: course.enrolledStudents || [],
      price: course.price,
      ratings: course.ratings,
      numOfReviews: course.numOfReviews,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level,
      creator: course.creator,
      reviews: (course.reviews || []).map((review) => ({
        reviewId: review._id,
        rating: review.rating,
        comment: review.comment,
        user: review.user, // { name, email, photoUrl }
      })),
    }));

    return res.status(200).json({ courses: result });
  } catch (error) {
    console.error("Failed to fetch courses, students, and reviews:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch courses, students, and reviews" });
  }
};

export const getPaidCoursesWithEnrolledStudentsAndPayments = async (
  req,
  res
) => {
  try {
    // Find paid courses where current price is greater than 0
    const courses = await Course.find({ "price.current": { $gt: 0 } })
      .populate("enrolledStudents", "name email photoUrl")
      .lean();

    // For each course, fetch related payments and course purchases
    const result = await Promise.all(
      courses.map(async (course) => {


        const coursePurchases = await CoursePurchase.find({
          "courses.courseId": course._id,
        })
          .populate("userId", "name email photoUrl")
          .populate("courses.courseId", "title")
          .lean();

        return {
          courseId: course._id,
          courseTitle: course.title,
          price: course.price,
          enrolledCount: course.enrolledStudents?.length || 0,
          students: course.enrolledStudents || [],
          ratings: course.ratings,
          numOfReviews: course.numOfReviews,
          thumbnail: course.thumbnail,
          category: course.category,
          level: course.level,
          creator: course.creator,
          coursePurchases: coursePurchases.map((purchase) => ({
            purchaseId: purchase._id,
            user: purchase.userId,
            status: purchase.status,
            purchasedAt: purchase.createdAt,
            courses: purchase.courses, // Array of { courseId, ... }
          })),
        };
      })
    );

    return res.status(200).json({ courses: result });
  } catch (error) {
    console.error(
      "Error in getPaidCoursesWithEnrolledStudentsAndPayments:",
      error
    );
    return res
      .status(500)
      .json({ message: "Failed to fetch paid courses and payments" });
  }
};

export const getCourseAnalytics = async (req, res) => {
  try {
    // Fetch courses and populate all necessary data in one go
    const courses = await Course.find()
      .populate("enrolledStudents", "name email photoUrl")
      .populate({
        path: "reviews", // Populate the 'reviews' array in the Course model
        populate: {
          path: "user", // Inside each review, populate the 'user' field
          select: "name photoUrl", // Only get the user's name and photo
        },
      })
      .lean();

    // For each course, fetch related purchases and compute analytics
    const result = await Promise.all(
      courses.map(async (course) => {
        const coursePurchases = await CoursePurchase.find({
          "courses.courseId": course._id,
        })
          .populate("userId", "name email photoUrl")
          .populate("courses.courseId", "title")
          .lean();

        // Calculate total revenue and purchase count
        const totalRevenue = coursePurchases.reduce((sum, purchase) => {
          if (!Array.isArray(purchase.courses)) return sum;
          return (
            sum +
            purchase.courses
              .filter((c) => c.courseId && c.courseId._id && c.courseId._id.toString() === course._id.toString())
              // ✅ FIXED LINE: Changed 'c.amount' to 'c.priceAtPurchase' to match your data model
              .reduce((s, c) => s + (c.priceAtPurchase || 0), 0)
          );
        }, 0);

        const purchaseCount = coursePurchases.length;

        // Calculate average rating from reviews. This still works perfectly
        const ratings = (course.reviews || [])
          .map((r) => r.rating)
          .filter((r) => typeof r === "number");

        const avgRating =
          ratings.length > 0
            ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(
                2
              )
            : null;

        return {
          courseId: course._id,
          courseTitle: course.title,
          enrolledCount: course.enrolledStudents?.length || 0,
          totalRevenue,
          purchaseCount,
          avgRating,
          ratings: course.ratings,
          numOfReviews: course.numOfReviews,
          price: course.price,
          thumbnail: course.thumbnail,
          category: course.category,
          level: course.level,
          creator: course.creator,
          reviews: course.reviews || [],
          coursePurchases: coursePurchases.map((purchase) => ({
            purchaseId: purchase._id,
            user: purchase.userId,
            status: purchase.status,
            purchasedAt: purchase.createdAt,
            courses: purchase.courses,
          })),
        };
      })
    );

    return res.status(200).json({ analytics: result });
  } catch (error) {
    console.error("Error in getCourseAnalytics:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch course analytics" });
  }
};