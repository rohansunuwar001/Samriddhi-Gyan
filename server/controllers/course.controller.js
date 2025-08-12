import { Course } from "../models/course.model.js";
import { Section } from "../models/section.model.js";
import { Lecture } from "../models/lecture.model.js";
import { SearchSuggestion } from "../models/searchSuggestion.js";
import { User } from "../models/user.model.js";
import { Payment } from "../models/payment.model.js"; // Import your Payment model
import { CoursePurchase } from "../models/coursePurchase.model.js"; // Add this import
import { deleteFromCloudinary, uploadMedia } from "../utils/cloudinary.js";
import { CourseProgress } from "../models/courseProgress.model.js";

export const createCourse = async (req, res) => {
  try {
    // UPDATED: Destructuring new fields from the model
    const { title, category, language, level, price } = req.body;

    if (!title || !category || !price || !price.original || !price.current) {
      return res.status(400).json({
        message:
          "Title, category, and a full price object (original, current) are required.",
      });
    }

    const course = await Course.create({
      title,
      category,
      language: language || "English",
      level: level || "All Levels",
      price, // Pass the entire price object
      creator: req.id,
    });

    return res.status(201).json({
      course,
      message: "Course created successfully.",
    });
  } catch (error) {
    console.error("Failed to create course:", error);
    return res.status(500).json({ message: "Failed to create course" });
  }
};
/**
 * @desc    Search for courses with filters and sorting
 * @route   GET /api/v1/search/courses
 * @access  Public
 */
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

export const getSearchResults = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(200).json({ suggestions: [], courses: [] });
    }
    const sanitizedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(sanitizedQuery, "i");
    const [courses, suggestionDocs] = await Promise.all([
      Course.aggregate([
        {
          $match: { isPublished: true },
        },
        {
          $lookup: {
            from: "users",
            localField: "creator",
            foreignField: "_id",
            as: "creatorInfo",
          },
        },
        {
          $unwind: {
            path: "$creatorInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { title: searchRegex },
              { subtitle: searchRegex },
              { category: searchRegex },
              { "creatorInfo.name": searchRegex },
            ],
          },
        },
        {
          $limit: 5,
        },
        {
          $project: {
            _id: 1,
            title: 1,
            thumbnail: 1,
            creatorName: "$creatorInfo.name",
          },
        },
      ]),

      SearchSuggestion.find({ term: searchRegex }).limit(8).lean(),
    ]);

    const suggestions = suggestionDocs.map((s) => s.term);

    res.status(200).json({ suggestions, courses });
  } catch (error) {
    console.error("Search controller error:", error);
    res.status(500).json({ message: "Server error during search." });
  }
};

export const getPublishedCourse = async (req, res) => {
  try {
    const userId = req.id; // If using auth middleware
    let courses = await Course.find({ isPublished: true })
      .populate({ path: "creator", select: "name photoUrl" })
      .lean();

    if (userId) {
      // Get user's enrolled courses
      const user = await User.findById(userId).select("enrolledCourses");
      const enrolledCourseIds =
        user?.enrolledCourses?.map((id) => id.toString()) || [];
      for (let course of courses) {
        course.progress = await getCourseProgressPercent(course._id, userId);
        course.isPurchased = enrolledCourseIds.includes(course._id.toString());
      }
    }

    return res.status(200).json({ courses });
  } catch (error) {
    console.log(error);
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

export const editCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    // UPDATED: Destructure all the new updatable fields
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
        // Delete old thumbnail if it exists
        const publicId = course.thumbnail.split("/").pop().split(".")[0];
        await deleteFromCloudinary(publicId);
      }
      const newThumbnail = await uploadMedia(thumbnailFile.path);
      course.thumbnail = newThumbnail.secure_url;
    }

    // --- Update All Fields ---
    course.title = title || course.title;
    course.subtitle = subtitle || course.subtitle;
    course.description = description || course.description;
    course.category = category || course.category;
    course.language = language || course.language;
    course.level = level || course.level;
    if (price) {
      // Update nested price object
      course.price.original = price.original || course.price.original;
      course.price.current = price.current || course.price.current;
    }
    if (learnings) course.learnings = learnings; // Directly replace array
    if (requirements) course.requirements = requirements;
    if (includes) course.includes = includes;

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

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id; // Make sure your auth middleware sets req.id

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

    // Default values
    let purchaseStatus = "not_purchased";
    let allowReview = false;

    // Only check purchase status if user is logged in
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
    }

    return res.status(200).json({
      success: true,
      course,
      purchaseStatus,
      allowReview,
    });
  } catch (error) {
    console.error("Error in getCourseById:", error);
    return res.status(500).json({ message: "Failed to get course by id" });
  }
};

//

// publich unpublish course logic

export const togglePublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { publish } = req.query; // true, false
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found!",
      });
    }
    // publish status based on the query paramter
    course.isPublished = publish === "true";
    await course.save();

    const statusMessage = course.isPublished ? "Published" : "Unpublished";
    return res.status(200).json({
      message: `Course is ${statusMessage}`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to update status",
    });
  }
};

export const getRecommendedCourses = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    let userId = null;

    if (token) {
      try {
        const decode = jwt.verify(token, process.env.SECRET_KEY);
        userId = decode?.userId;
      } catch (err) {
        console.warn("Invalid or expired token. Proceeding as guest.");
      }
    }
    if (userId) {
      const user = await User.findById(userId).populate("enrolledCourses");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const enrolledCourses = user.enrolledCourses;

      if (enrolledCourses.length === 0) {
        const popularCourses = await Course.find({ isPublished: true })
          .sort({ enrolledStudents: -1 })
          .limit(5);

        return res.json({
          message:
            "You haven't enrolled in any courses yet. Here are some popular ones.",
          recommendedCourses: popularCourses,
        });
      }
      const categories = [...new Set(enrolledCourses.map((c) => c.category))];
      const enrolledCourseIds = enrolledCourses.map((course) =>
        course._id.toString()
      );

      let recommendedCourses = await Course.find({
        isPublished: true,
        category: { $in: categories },
        _id: { $nin: enrolledCourseIds },
      })
        .sort({ enrolledStudents: -1 })
        .limit(5)
        .lean();

      // Attach progress for each course
      for (let course of recommendedCourses) {
        course.progress = await getCourseProgressPercent(course._id, userId);
        // Optionally, mark if purchased/enrolled
        course.isPurchased = enrolledCourseIds.includes(course._id.toString());
      }

      if (recommendedCourses.length === 0) {
        recommendedCourses = await Course.find({
          isPublished: true,
          _id: { $nin: enrolledCourseIds },
        })
          .sort({ enrolledStudents: -1 })
          .limit(5);

        return res.json({
          message:
            "No similar category courses found. Here are some other popular ones.",
          recommendedCourses,
        });
      }

      return res.json({
        message: "Recommended based on your interests",
        recommendedCourses,
      });
    }

    const popularCourses = await Course.find({ isPublished: true })
      .sort({ enrolledStudents: -1 })
      .limit(5);

    return res.json({
      message: "Here are some popular courses you may like.",
      recommendedCourses: popularCourses,
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found!" });
    }

    // Delete thumbnail from Cloudinary if exists
    if (course.thumbnail) {
      const publicId = course.thumbnail.split("/").pop().split(".")[0];
      await deleteFromCloudinary(publicId);
    }

    // Delete course
    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({ message: "Course removed successfully." });
  } catch (error) {
    console.error("Failed to remove course:", error);
    return res.status(500).json({ message: "Failed to remove course" });
  }
};

export const getCoursesWithEnrolledStudents = async (req, res) => {
  try {
    // 1. Fetch all courses with enrolled students
    const courses = await Course.find().populate(
      "enrolledStudents",
      "name email photoUrl"
    );

    // 2. Format the response
    const result = courses.map((course) => ({
      courseId: course._id,
      courseTitle: course.title,
      enrolledCount: course.enrolledStudents.length,
      students: course.enrolledStudents,
      price: course.price, // { original, current }
      ratings: course.ratings,
      numOfReviews: course.numOfReviews,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level,
      creator: course.creator,
    }));

    // 3. Send the response
    res.status(200).json({ courses: result });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses and students" });
  }
};

export const getCoursesWithEnrolledStudentsAndReviews = async (req, res) => {
  try {
    // Fetch all courses, populate enrolled students and reviews (with user info)
    const courses = await Course.find()
      .populate("enrolledStudents", "name email photoUrl")
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          select: "name email photoUrl",
        },
      });

    // Format the response
    const result = courses.map((course) => ({
      courseId: course._id,
      courseTitle: course.title,
      enrolledCount: course.enrolledStudents.length,
      students: course.enrolledStudents,
      price: course.price,
      ratings: course.ratings,
      numOfReviews: course.numOfReviews,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level,
      creator: course.creator,
      reviews: course.reviews.map((review) => ({
        reviewId: review._id,
        rating: review.rating,
        comment: review.comment,
        user: review.user, // { name, email, photoUrl }
      })),
    }));

    res.status(200).json({ courses: result });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch courses, students, and reviews" });
  }
};

export const getPaidCoursesWithEnrolledStudentsAndPayments = async (
  req,
  res
) => {
  try {
    // Find paid courses
    const courses = await Course.find({ "price.current": { $gt: 0 } }).populate(
      "enrolledStudents",
      "name email photoUrl"
    );

    // For each course, get payments and course purchases (populate user and course)
    const result = await Promise.all(
      courses.map(async (course) => {
        const payments = await Payment.find({ course: course._id })
          .populate("user", "name email photoUrl")
          .populate("course");

        // Populate coursePurchase for this course
        const coursePurchases = await CoursePurchase.find({
          "courses.courseId": course._id,
        })
          .populate("userId", "name email photoUrl")
          .populate("courses.courseId", "title");

        return {
          courseId: course._id,
          courseTitle: course.title,
          price: course.price,
          enrolledCount: course.enrolledStudents.length,
          students: course.enrolledStudents,
          ratings: course.ratings,
          numOfReviews: course.numOfReviews,
          thumbnail: course.thumbnail,
          category: course.category,
          level: course.level,
          creator: course.creator,
          payments: payments.map((payment) => ({
            user: payment.user,
            amount: payment.amount,
            date: payment.date,
            course: payment.course,
          })),
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

    res.status(200).json({ courses: result });
  } catch (error) {
    console.error(
      "Error in getPaidCoursesWithEnrolledStudentsAndPayments:",
      error
    );
    res
      .status(500)
      .json({ message: "Failed to fetch paid courses and payments" });
  }
};

export const getCourseAnalytics = async (req, res) => {
  try {
    // Fetch all courses, populate enrolled students and reviews (for ratings)
    const courses = await Course.find()
      .populate("enrolledStudents", "name email photoUrl")
      .populate({
        path: "reviews",
        select: "rating",
        populate: {
          path: "course", // Populate course in each review for more context if needed
          select: "title",
        },
      });

    // For each course, get course purchases (populate user and course)
    const result = await Promise.all(
      courses.map(async (course) => {
        // Get course purchases for this course, populate user and course
        const coursePurchases = await CoursePurchase.find({
          "courses.courseId": course._id,
        })
          .populate("userId", "name email photoUrl")
          .populate("courses.courseId", "title");

        // Calculate total revenue and purchase count
        const totalRevenue = coursePurchases.reduce(
          (sum, purchase) =>
            sum +
            (Array.isArray(purchase.courses)
              ? purchase.courses
                  .filter((c) => c.courseId && c.courseId.equals(course._id))
                  .reduce((s, c) => s + (c.amount || 0), 0)
              : 0),
          0
        );
        const purchaseCount = coursePurchases.length;

        // Calculate average rating
        const ratings = course.reviews
          .map((r) => r.rating)
          .filter((r) => typeof r === "number");
        const avgRating =
          ratings.length > 0
            ? (
                ratings.reduce((sum, r) => sum + r, 0) / ratings.length
              ).toFixed(2)
            : null;

        return {
          courseId: course._id,
          courseTitle: course.title,
          enrolledCount: course.enrolledStudents.length,
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

    res.status(200).json({ analytics: result });
  } catch (error) {
    console.error("Error in getCourseAnalytics:", error);
    res.status(500).json({ message: "Failed to fetch course analytics" });
  }
};

// Helper to get progress percent for a user and course
async function getCourseProgressPercent(courseId, userId) {
  const progress = await CourseProgress.findOne({ courseId, userId });
  if (!progress) return 0;

  // Get total lectures for the course
  const course = await Course.findById(courseId).populate({
    path: "sections",
    select: "lectures",
  });
  const totalLectures = course.sections.reduce(
    (sum, section) => sum + (section.lectures?.length || 0),
    0
  );
  const completedLectures = progress.lectureProgress.filter(
    (l) => l.viewed
  ).length;
  return totalLectures > 0
    ? Math.round((completedLectures / totalLectures) * 100)
    : 0;
}
