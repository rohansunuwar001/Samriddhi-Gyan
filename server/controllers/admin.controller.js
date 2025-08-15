// your-backend/controllers/superAdminController.js

import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";

export const getSuperAdminDashboardAnalytics = async (req, res) => {
  try {
    // --- 1. Queries for "Stats" cards (Using efficient aggregations) ---
    const userCountsPromise = User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]);
    const courseCountPromise = Course.countDocuments();
    const totalRevenuePromise = CoursePurchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // --- 2. Queries for "Recent Activity" feeds ---
    const recentUsersPromise = User.find({}).sort({ createdAt: -1 }).limit(5).select("name email role createdAt photoUrl").lean();
    const recentTransactionsPromise = CoursePurchase.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(5).populate("userId", "name").select("orderId userId totalAmount paymentMethod createdAt").lean();

    // --- 3. Queries for "Performance" tables (Using your efficient methods) ---
    const topEnrolledCoursesPromise = Course.aggregate([
      { $match: { isPublished: true } },
      { $addFields: { enrollmentCount: { $size: '$enrolledStudents' } } },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 5 },
      { $project: { title: 1, enrollmentCount: 1, ratings: 1 } }
    ]);
    const topRatedCoursesPromise = Course.find({ isPublished: true, numOfReviews: { $gt: 5 } }).sort({ ratings: -1 }).limit(5).select('title ratings numOfReviews').lean();

    // --- 4. Query for "Charts" data ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyRevenuePromise = CoursePurchase.aggregate([
        { $match: { status: "completed", createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, dailyRevenue: { $sum: "$totalAmount" } } },
        { $sort: { _id: 1 } },
    ]);

    // --- Execute all promises concurrently ---
    const [
      userCounts,
      totalCourses,
      revenueResult,
      recentUsers,
      recentTransactions,
      topEnrolledCourses,
      topRatedCourses,
      weeklyRevenue
    ] = await Promise.all([
      userCountsPromise,
      courseCountPromise,
      totalRevenuePromise,
      recentUsersPromise,
      recentTransactionsPromise,
      topEnrolledCoursesPromise,
      topRatedCoursesPromise,
      weeklyRevenuePromise
    ]);

    // --- Assemble the final, organized data object ---
    const totalStudents = userCounts.find(r => r._id === 'student')?.count || 0;
    const totalInstructors = userCounts.find(r => r._id === 'instructor')?.count || 0;
    const totalRevenue = revenueResult[0]?.total || 0;

    const dashboardData = {
      stats: {
        totalRevenue,
        totalUsers: totalStudents + totalInstructors,
        totalInstructors,
        totalCourses,
      },
      activity: {
        recentUsers,
        recentTransactions,
      },
      performance: {
        topEnrolledCourses,
        topRatedCourses,
      },
      charts: {
        weeklyRevenue, // Array of { _id: "YYYY-MM-DD", dailyRevenue: X }
      }
    };

    return res.status(200).json({
      success: true,
      analytics: dashboardData,
    });

  } catch (error) {
    console.error("Super Admin Analytics Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching dashboard analytics.",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // --- Pagination Parameters ---
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // --- Search & Filter Parameters ---
    const { search, role } = req.query;

    // --- Build a dynamic query object ---
    const criteria = {};

    if (search) {
      // Case-insensitive search on name and email fields
      criteria.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role && ['student', 'instructor', 'admin'].includes(role)) {
      criteria.role = role;
    }

    // --- Execute queries in parallel for efficiency ---
    const usersPromise = User.find(criteria)
      .select('-password') // Never send the password hash
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalUsersPromise = User.countDocuments(criteria);

    const [users, totalUsers] = await Promise.all([usersPromise, totalUsersPromise]);

    res.status(200).json({
      success: true,
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: "Server error while fetching users." });
  }
};

export const updateUserRoleAndDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    // --- Find the user first ---
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // --- Safeguard: Prevent an admin from accidentally removing their own admin status ---
    if (user._id.toString() === req.user._id.toString() && role && role !== 'admin') {
      return res.status(400).json({ success: false, message: "Admins cannot remove their own admin role." });
    }

    // --- Update fields if they are provided ---
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;

    const updatedUser = await user.save();

    // Remove password from the returned object
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ success: false, message: "Server error while updating user." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // --- Safeguard: Prevent an admin from deleting themselves ---
    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot delete your own admin account." });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    
    // IMPORTANT: In a real-world scenario, you would handle the cleanup of this user's
    // associated data (e.g., re-assign courses if they were an instructor).
    // For now, this performs a direct deletion.

    res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ success: false, message: "Server error while deleting user." });
  }
};

export const getPlatformAnalytics = async (req, res) => {
    try {
        // --- 1. Get Top Performing Instructors (by revenue) ---
        const instructorsRevenuePromise = CoursePurchase.aggregate([
            { $match: { status: 'completed' } },
            { $unwind: '$courses' }, // Deconstruct the courses array
            { 
                $lookup: { // Join with courses to get the creator ID
                    from: 'courses', 
                    localField: 'courses.courseId', 
                    foreignField: '_id', 
                    as: 'courseDetails' 
                } 
            },
            { $unwind: '$courseDetails' },
            { 
                $group: { // Group by instructor (creator)
                    _id: '$courseDetails.creator', 
                    totalRevenue: { $sum: '$courses.priceAtPurchase' },
                    coursesSold: { $sum: 1 }
                } 
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 },
            {
                $lookup: { // Join with users to get instructor names
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'instructorInfo'
                }
            },
            { $unwind: '$instructorInfo' },
            {
                $project: {
                    instructorId: '$_id',
                    name: '$instructorInfo.name',
                    email: '$instructorInfo.email',
                    totalRevenue: 1,
                    coursesSold: 1,
                    _id: 0
                }
            }
        ]);
        
        // --- 2. Get Platform-Wide Course Stats ---
        const allCoursesPromise = Course.find({})
            .populate('creator', 'name')
            .select('title creator price isPublished enrolledStudents ratings numOfReviews createdAt')
            .lean();

        // --- Execute in Parallel ---
        const [instructorsByRevenue, allCourses] = await Promise.all([
            instructorsRevenuePromise,
            allCoursesPromise
        ]);
        
        // --- 3. Process Course Data for Summary ---
        let totalPlatformRevenue = 0;
        const totalEnrollments = new Set();
        
        allCourses.forEach(course => {
            course.enrolledStudents.forEach(studentId => totalEnrollments.add(studentId.toString()));
        });
        
        // Sum revenue from the instructor aggregation for accuracy
        totalPlatformRevenue = instructorsByRevenue.reduce((acc, inst) => acc + inst.totalRevenue, 0);

        // --- 4. Assemble and Send the Final Response ---
        res.status(200).json({
            success: true,
            analytics: {
                summary: {
                    totalCourses: allCourses.length,
                    totalInstructors: await User.countDocuments({ role: 'instructor' }),
                    totalEnrollments: totalEnrollments.size,
                    totalPlatformRevenue
                },
                instructorsByRevenue, // The top 10 instructors
                allCourses // Full list for detailed tables, can be paginated if needed
            }
        });

    } catch (error) {
        console.error("Platform Analytics Error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching platform analytics." });
    }
};
export const updateCourseByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        
        // Update the course with the fields from the request body.
        // `req.body` can contain any field from the courseSchema.
        const updatedCourse = await Course.findByIdAndUpdate(id, req.body, {
            new: true, // Return the updated document
            runValidators: true, // Run schema validators on the update
        });

        res.status(200).json({
            success: true,
            message: 'Course updated successfully.',
            course: updatedCourse,
        });
    } catch (error) {
        console.error("Admin Course Update Error:", error);
        res.status(500).json({ success: false, message: 'Failed to update course.' });
    }
};
export const deleteCourseByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found." });
        }

        // --- DELETION LOGIC ---
        // TODO: In a real-world scenario, you would handle more complex cleanup:
        // 1. Delete associated sections and lectures.
        // 2. Remove the course from user's `enrolledCourses` arrays.
        // 3. Delete related reviews, purchases, etc.
        // This is a complex operation. For now, we delete the course document itself.
        // Libraries like `mongoose-delete` (soft delete) are highly recommended here.

        await Course.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Course has been deleted successfully.",
        });
    } catch (error) {
        console.error("Admin Course Deletion Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete course." });
    }
};
export const getRevenueDetails = async (req, res) => {
    try {
        // --- 1. Get Query Parameters with Defaults ---
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 15;
        const skip = (page - 1) * limit;

        const { status, paymentMethod, startDate, endDate } = req.query;

        // --- 2. Build a Dynamic Filter/Criteria Object ---
        const criteria = {};

        if (status) {
            criteria.status = status; // Filter by status (e.g., 'completed', 'failed')
        }
        if (paymentMethod) {
            criteria.paymentMethod = paymentMethod; // Filter by gateway
        }

        // Build a date range filter if provided
        const dateFilter = {};
        if (startDate) {
            dateFilter.$gte = new Date(startDate); // "Greater than or equal to" start date
        }
        if (endDate) {
            // Set to the end of the selected day
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            dateFilter.$lte = endOfDay; // "Less than or equal to" end date
        }

        // Only add the date filter to criteria if it's not empty
        if (Object.keys(dateFilter).length > 0) {
            criteria.createdAt = dateFilter;
        }

        // --- 3. Build a Dynamic Sort Object ---
        const sortOptions = {};
        const sortBy = req.query.sortBy || 'createdAt'; // Default sort by creation date
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1; // Default sort descending
        sortOptions[sortBy] = sortOrder;

        // --- 4. Execute Queries in Parallel for Efficiency ---
        const purchasesPromise = CoursePurchase.find(criteria)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            // Populate linked data for a rich response
            .populate({
                path: 'userId',
                select: 'name email photoUrl' // Get user details
            })
            .populate({
                path: 'courses.courseId',
                select: 'title' // Get the title of each course in the bundle
            })
            .lean(); // Use lean for faster read operations

        const totalPurchasesPromise = CoursePurchase.countDocuments(criteria);

        const [purchases, totalPurchases] = await Promise.all([
            purchasesPromise,
            totalPurchasesPromise,
        ]);
        
        // --- 5. Assemble and Send the Final Response ---
        res.status(200).json({
            success: true,
            data: purchases,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalPurchases / limit),
                totalItems: totalPurchases,
                itemsPerPage: limit
            },
        });
        
    } catch (error) {
        console.error("Error in getRevenueDetails:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching revenue details.",
        });
    }
};