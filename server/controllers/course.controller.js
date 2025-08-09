import { Course } from "../models/course.model.js";
import { Section } from "../models/section.model.js";
import { Lecture } from "../models/lecture.model.js";
import { SearchSuggestion } from "../models/searchSuggestion.js";
import { User } from "../models/user.model.js";
import { Payment } from "../models/payment.model.js"; // Import your Payment model
import {
  deleteFromCloudinary,
  uploadMedia,
} from "../utils/cloudinary.js";

export const createCourse = async (req, res) => {
    try {
        // UPDATED: Destructuring new fields from the model
        const { title, category, language, level, price } = req.body;
        
        if (!title || !category || !price || !price.original || !price.current) {
            return res.status(400).json({
                message: "Title, category, and a full price object (original, current) are required.",
            });
        }
        
        const course = await Course.create({
            title,
            category,
            language: language || 'English',
            level: level || 'All Levels',
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
        { courseTitle: { $regex: query, $options: "i" } }, // UPDATED: courseTitle -> title
        { subtitle: { $regex: query, $options: "i" } }, // UPDATED: subTitle -> subtitle
        { category: { $regex: query, $options: "i" } },
      ],
    };

    if (categories.length > 0) {
      searchCriteria.category = { $in: categories };
    }

    const sortOptions = {};
    if (sortByPrice === "low") {
      sortOptions['price.current'] = 1; // UPDATED: coursePrice -> price.current
    } else if (sortByPrice === "high") {
      sortOptions['price.current'] = -1;
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


/**
 * @desc    Get comprehensive search results based on a query
 * @route   GET /api/search?q=your_query
 * @access  Public
 */
export const getSearchResults = async (req, res) => {
  try {
    const { q } = req.query;

    // Return empty results if the query is missing or empty
    if (!q || q.trim() === "") {
      return res.status(200).json({ suggestions: [], courses: [] });
    }

    // Sanitize the query to prevent Regex Injection attacks
    const sanitizedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(sanitizedQuery, "i"); // 'i' for case-insensitivity

    // Run both database lookups in parallel for maximum efficiency
    const [courses, suggestionDocs] = await Promise.all([
      // --- Query 1: Find Courses using the Aggregation Pipeline ---
      Course.aggregate([
        // Stage 1: Initial match to filter for only published courses.
        // This is a crucial performance optimization.
        {
          $match: { isPublished: true },
        },
        // Stage 2: Join with the 'users' collection to get creator's name
        {
          $lookup: {
            from: "users", // The name of the users collection
            localField: "creator",
            foreignField: "_id",
            as: "creatorInfo",
          },
        },
        // Stage 3: Deconstruct the creatorInfo array to an object
        {
          $unwind: {
            path: "$creatorInfo",
            preserveNullAndEmptyArrays: true, // Keep courses even if creator is not found
          },
        },
        // Stage 4: Match against all relevant fields
        {
          $match: {
            $or: [
              { courseTitle: searchRegex },
              { subTitle: searchRegex },
              { category: searchRegex },
              { "creatorInfo.name": searchRegex }, // Search by the creator's name
            ],
          },
        },
        // Stage 5: Limit the number of results
        {
          $limit: 5,
        },
        // Stage 6: Project only the fields needed by the frontend for a smaller payload
        {
          $project: {
            _id: 1, // The course ID is needed for the link
            title: "$courseTitle", // Rename for consistency
            thumbnail: "$courseThumbnail",
            creatorName: "$creatorInfo.name", // Send only the creator's name
          },
        },
      ]),

      // --- Query 2: Find Search Suggestions ---
      SearchSuggestion.find({ term: searchRegex }).limit(8).lean(),
    ]);

    // Format suggestions into a simple array of strings
    const suggestions = suggestionDocs.map((s) => s.term);

    // Send the final, combined results
    res.status(200).json({ suggestions, courses });
  } catch (error) {
    console.error("Search controller error:", error);
    res.status(500).json({ message: "Server error during search." });
  }
};

export const getPublishedCourse = async (_, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).populate({
      path: "creator",
      select: "name photoUrl",
    });
    if (!courses) {
      return res.status(404).json({
        message: "Course not found",
      });
    }
    return res.status(200).json({
      courses,
    });
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
/**
 * @desc    Update an existing course
 * @route   PUT /api/v1/courses/:courseId
 * @access  Private (Instructor only)
 */
export const editCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        // UPDATED: Destructure all the new updatable fields
        const {
            title, subtitle, description, category, language, level, price,
            learnings, requirements, includes
        } = req.body;
        const thumbnailFile = req.file;

        let course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found!" });
        }

        // --- Handle Thumbnail Upload ---
        if (thumbnailFile) {
            if (course.thumbnail) { // Delete old thumbnail if it exists
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
        if (price) { // Update nested price object
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
/**
 * @desc    Get a single course by its ID, with fully populated nested data
 * @route   GET /api/v1/courses/:courseId
 * @access  Public
 */
export const getCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId)
            .populate({
                path: 'sections', // 1. Populate the new 'sections' array
                populate: {
                    path: 'lectures' // 2. For each section, populate its 'lectures'
                }
            })
            .populate('creator', 'name headline photoUrl')
            .populate({
                path: 'reviews',
                populate: {
                    path: 'user',
                    select: 'name photoUrl'
                }
            });

        if (!course) {
            return res.status(404).json({ message: "Course not found!" });
        }
        
        return res.status(200).json({
            success: true,
            course,
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
        .limit(5);

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
/**
 * @desc    Remove a course and its related data
 * @route   DELETE /api/v1/course/:courseId
 * @access  Private (Instructor only)
 */
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
    // 1. Fetch all courses
    const courses = await Course.find()
      .populate('enrolledStudents', 'name email photoUrl');

    // 2. Format the response
    const result = courses.map(course => ({
      courseId: course._id,
      courseTitle: course.title || course.courseTitle,
      students: course.enrolledStudents,
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
      .populate('enrolledStudents', 'name email photoUrl')
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: 'name email photoUrl'
        }
      });

    // Format the response
    const result = courses.map(course => ({
      courseId: course._id,
      courseTitle: course.title || course.courseTitle,
      students: course.enrolledStudents,
      reviews: course.reviews.map(review => ({
        reviewId: review._id,
        rating: review.rating,
        comment: review.comment,
        user: review.user // { name, email, photoUrl }
      }))
    }));

    res.status(200).json({ courses: result });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch courses, students, and reviews" });
  }
};

export const getPaidCoursesWithEnrolledStudentsAndPayments = async (req, res) => {
  try {
    // Find paid courses
    const courses = await Course.find({ "price.current": { $gt: 0 } })
      .populate('enrolledStudents', 'name email photoUrl');

    // For each course, get payments
    const result = await Promise.all(courses.map(async (course) => {
      const payments = await Payment.find({ course: course._id })
        .populate('user', 'name email photoUrl');
      return {
        courseId: course._id,
        courseTitle: course.title || course.courseTitle,
        price: course.price.current,
        students: course.enrolledStudents,
        payments: payments.map(payment => ({
          user: payment.user,
          amount: payment.amount,
          date: payment.date
        }))
      };
    }));

    res.status(200).json({ courses: result });
  } catch (error) {
    console.error("Error in getPaidCoursesWithEnrolledStudentsAndPayments:", error);
    res.status(500).json({ message: "Failed to fetch paid courses and payments" });
  }
};
