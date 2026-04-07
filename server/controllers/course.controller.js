import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { SearchSuggestion } from "../models/searchSuggestion.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadMedia } from "../utils/cloudinary.js";


// We now only need createEmbeddingForText (which uses Xenova) and cosineSimilarity.
import {
  cosineSimilarity,
  createEmbeddingForText,
} from "../utils/embedding.js";




export const createCourse = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: You must be logged in to create a course."
      });
    }
    const {
      title,
      category,
      price,
      language,
      level,
      subtitle,
      description,
      learnings,
    } = req.body;

    if (!title || !category || !price?.original || !price?.current) {
      return res.status(400).json({
        success: false,
        message:
          "Title, category, and a full price object (original, current) are required.",
      });
    }
    const courseData = {
      title,
      category,
      language: language || "English",
      level: level || "All Levels",
      price,
      subtitle,
      description,
      learnings,
      creator: req.user._id,
    };
    const course = await Course.create(courseData);
    return res.status(201).json({
      success: true,
      course,
      message: "Course created successfully. Embedding will be generated automatically.",
    });

  } catch (error) {
    console.error("Failed to create course:", error);
    return res.status(500).json({ success: false, message: "Server error during course creation." });
  }
};




export const getSearchResults = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user?._id; // Get the user ID from your auth middleware

    if (!q || q.trim() === "") {
      // Return empty results if the query is empty
      return res.status(200).json({ suggestions: [], courses: [] });
    }

    // 1. Generate query embedding
    const queryEmbedding = await createEmbeddingForText(q.trim());

    if (!queryEmbedding) {
      throw new Error("Failed to generate embedding for query");
    }

    // --- ⭐ NEW LOGIC: Build a dynamic query to exclude purchased courses ---
    const findCriteria = {
      isPublished: true,
      embedding: { $exists: true, $ne: [] }, // Ensure the course has an embedding
    };

    if (userId) {
      // If a user is logged in, find their enrolled courses
      const user = await User.findById(userId).select('enrolledCourses').lean();
      const purchasedCourseIds = user?.enrolledCourses || [];

      // If they have purchased courses, add a filter to the database query
      if (purchasedCourseIds.length > 0) {
        // Use the $nin ("not in") operator to exclude these course IDs
        findCriteria._id = { $nin: purchasedCourseIds };
      }
    }
    // --- End of new logic ---

    // 2. Fetch all relevant courses using the new, smarter criteria
    const allCourses = await Course.find(findCriteria).select(
      "_id title subtitle category thumbnail creator embedding"
    ).lean(); // Use lean() for better performance

    // 3. Calculate similarity ONLY for the filtered courses
    const coursesWithSimilarity = allCourses
      .map((course) => ({
        ...course,
        // The cosineSimilarity function is called on a smaller, pre-filtered dataset
        similarity: cosineSimilarity(queryEmbedding, course.embedding),
      }))
      // 4. Sort descending by similarity and filter out low-similarity results
      .sort((a, b) => b.similarity - a.similarity)
      .filter((course) => course.similarity > 0.3) // Optional threshold
      // 5. Limit to top results
      .slice(0, 10);

    // 6. Fetch suggestions (no changes to this logic)
    const sanitizedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(sanitizedQuery, "i");
    const suggestionDocs = await SearchSuggestion.find({ term: searchRegex })
      .limit(8)
      .lean();
    const suggestions = suggestionDocs.map((s) => s.term);

    // 7. Send the final response
    res.status(200).json({ suggestions, courses: coursesWithSimilarity });
  } catch (error) {
    console.error("Search controller error:", error);
    res.status(500).json({ success: false, message: "Server error during search." });
  }
};


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

    const thumbnailFile = req.file; let course = await Course.findById(courseId);
    if (!course) { return res.status(404).json({ message: "Course not found!" }); }
    if (thumbnailFile) {if (course.thumbnail) { const publicId = course.thumbnail.split("/").pop().split(".")[0]; await deleteFromCloudinary(publicId);}
      const newThumbnail = await uploadMedia(thumbnailFile.path);
      course.thumbnail = newThumbnail.secure_url;
    }
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
    const userId = req.user?._id; // Get the user ID from your authentication middleware (e.g., req.user)

    const searchCriteria = {
      isPublished: true, // Only search for published courses
      // Search in title, subtitle, or category for the query string, case-insensitive
      $or: [
        { title: { $regex: query, $options: "i" } },
        { subtitle: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    };

    // --- Filter by Category ---
    // If categories are provided, add them to the search criteria
    if (categories.length > 0) {
      searchCriteria.category = { $in: categories };
    }

    // --- ⭐ NEW LOGIC: Exclude purchased courses for logged-in users ---
    if (userId) {
      // Find the user to get their list of enrolled courses
      const user = await User.findById(userId).select('enrolledCourses').lean();

      const purchasedCourseIds = user?.enrolledCourses || [];

      // If the user has purchased any courses, add a condition to exclude them from the search
      if (purchasedCourseIds.length > 0) {
        // Add the $nin ("not in") operator to the criteria on the course's _id field
        searchCriteria._id = { $nin: purchasedCourseIds };
      }
    }
    // --- End of new logic ---

    // --- Sort by Price ---
    const sortOptions = {};
    if (sortByPrice === "low") {
      sortOptions["price.current"] = 1; // Sort from Low to High
    } else if (sortByPrice === "high") {
      sortOptions["price.current"] = -1; // Sort from High to Low
    }
    // You could add a default sort here if needed, e.g., sortOptions.createdAt = -1;

    // --- Execute the final query ---
    const courses = await Course.find(searchCriteria)
      .populate({ path: "creator", select: "name photoUrl" })
      .sort(sortOptions)
      .lean(); // Use .lean() for faster, read-only operations

    return res.status(200).json({
      success: true,
      courses: courses, // It's safe to return `courses` directly now
    });

  } catch (error) {
    console.error("Search Course error:", error);
    res.status(500).json({ success: false, message: "Failed to search courses." });
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
    let courses = await Course.find({ isPublished: true })
      .populate({ path: "creator", select: "name photoUrl" })
      .lean();

    // The 'loadUserIfAuthenticated' middleware might have attached a user.
    // We check if it exists before trying to use it.
    if (req.user && req.user._id) {
      const userId = req.user._id;

      // ---- This is your previous logic, now safely wrapped in a check ----
      const user = await User.findById(userId).select("enrolledCourses").lean();
      const enrolledCourseIds = new Set(
        user?.enrolledCourses?.map((id) => id.toString()) || []
      );

      for (let course of courses) {
        course.isPurchased = enrolledCourseIds.has(course._id.toString());
        // For performance, only calculate progress if the course is purchased
        course.progress = course.isPurchased
          ? await getCourseProgressPercent(course._id, userId)
          : 0;
      }
      // -----------------------------------------------------------------

    } else {
      // ---- This runs for GUEST users ----
      // Explicitly set purchase and progress info for a consistent API response.
      for (let course of courses) {
        course.isPurchased = false;
        course.progress = 0;
      }
    }

    // Return the full, decorated list of courses for everyone.
    return res.status(200).json({ success: true, courses });

  } catch (error) {
    console.error("Error fetching published courses:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get published courses",
    });
  }
};

export const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.user._id;
    // console.log(userId);
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

    // First, find the course. This should happen for everyone.
    const course = await Course.findById(courseId)
      .populate({ path: "sections", populate: { path: "lectures" } })
      .populate("creator", "name headline photoUrl")
      .populate({ path: "reviews", populate: { path: "user", select: "name photoUrl" } })
      .lean(); // Use .lean() for better performance as we will be modifying the object

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found!" });
    }


    let purchaseStatus = "not_purchased";
    let allowReview = false;
    let progress = 0;


    if (req.user && req.user._id) {
      const userId = req.user._id; // Safely get the user's ID


      const purchase = await CoursePurchase.findOne({
        userId,
        "courses.courseId": courseId,
        status: "completed",
      });

      if (purchase) {
        purchaseStatus = "completed";
        allowReview = true; // User can review if they have purchased.
      }

      // Calculate progress if purchased (or if they are enrolled).
      if (purchaseStatus === "completed") {
        // progress = await getCourseProgressPercent(courseId, userId);
      }
    }


    course.purchaseStatus = purchaseStatus;
    course.allowReview = allowReview;
    course.progress = progress;


    return res.status(200).json({
      success: true,
      course, // The entire enriched course object is sent back.
    });

  } catch (error) {
    console.error("Error in getCourseById:", error);
    return res.status(500).json({ success: false, message: "Failed to get course by id" });
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


// This is the updated getCoursesWithEnrolledStudents function

export const getCoursesWithEnrolledStudents = async (req, res) => {
  try {



    if (!req.user || !req.user._id) {
      console.log("2. FAILED: req.user or req.user._id is missing.");
      return res.status(401).json({ message: "Unauthorized: You must be logged in to view this data." });
    }

    const instructorId = req.user._id;
    console.log("2. SUCCESS: Logged-in instructor ID is:", instructorId);


    const courses = await Course.find({ creator: instructorId })
      .populate("enrolledStudents", "name email photoUrl")
      .lean();

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
    }));

    return res.status(200).json({ courses: result });
  } catch (error) {
    console.error("Failed to fetch courses and enrolled students:", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching courses and students" });
  }
};

export const getCoursesWithEnrolledStudentsAndReviews = async (req, res) => {
  try {

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: You must be logged in to view this data." });
    }


    const instructorId = req.user._id;


    const courses = await Course.find({ creator: instructorId })
      .populate("enrolledStudents", "name email photoUrl")
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          select: "name email photoUrl",
        },
      })
      .lean();

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
        user: review.user,
      })),
    }));

    return res.status(200).json({ courses: result });
  } catch (error) {
    console.error("Failed to fetch courses, students, and reviews:", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching courses, students, and reviews" });
  }
};
export const getPaidCoursesWithEnrolledStudentsAndPayments = async (
  req,
  res
) => {
  try {

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: You must be logged in to view this data." });
    }


    const instructorId = req.user._id;


    const courses = await Course.find({
      "price.current": { $gt: 0 },
      creator: instructorId,
    })
      .populate("enrolledStudents", "name email photoUrl")
      .lean();

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
            courses: purchase.courses,
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
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    const instructorId = req.user._id;

    const courses = await Course.find({ creator: instructorId })
      .populate("enrolledStudents", "name email photoUrl")
      .populate({
        path: "reviews",
        populate: { path: "user", select: "name photoUrl" },
      })
      .lean();

    if (!courses || courses.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No course analytics to display yet.",
        analytics: [],
      });
    }

    const analytics = await Promise.all(
      courses.map(async (course) => {
        const coursePurchases = await CoursePurchase.find({
          "courses.courseId": course._id,
          status: "completed",
        })
          .populate("userId", "name email photoUrl")
          .populate("courses.courseId", "title") // This populate causes the change in data structure
          .lean();

        // --- CORRECTED REVENUE CALCULATION ---
        const totalRevenue = coursePurchases.reduce((sum, purchase) => {

          // The fix is here: we now look for `c.courseId._id` because courseId is a populated object.
          const courseInPurchase = purchase.courses.find(
            (c) => c.courseId?._id?.toString() === course._id.toString()
          );

          // If the matching course is found in the purchase record, add its price to the total sum.
          if (courseInPurchase) {
            return sum + (courseInPurchase.priceAtPurchase || 0);
          }

          // Otherwise, continue with the current sum.
          return sum;
        }, 0); // Initial value for the sum is 0.

        const purchaseCount = coursePurchases.length;

        const ratings = (course.reviews || []).map(r => r.rating).filter(r => typeof r === 'number');
        const avgRating = ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
          : null;

        return {
          courseId: course._id,
          courseTitle: course.title,
          enrolledCount: course.enrolledStudents?.length || 0,
          totalRevenue, // This will now have the correct value
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

    return res.status(200).json({ success: true, analytics });
  } catch (error) {
    console.error("Error in getCourseAnalytics:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching course analytics." });
  }
};