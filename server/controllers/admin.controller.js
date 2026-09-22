// server/controllers/admin.controller.js

import { BaseController } from "../core/base.controller.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { SubscriptionPurchase } from "../models/subscriptionPurchase.model.js";
import { getSubscriptionPayouts } from "../utils/subscriptionPayout.js";
import { InstructorPayout } from "../models/instructorPayout.model.js";

export class AdminController extends BaseController {
  constructor() {
    super();
  }

  getSuperAdminDashboardAnalytics = async (req, res) => {
    try {
      const now = new Date();

      // Current week: Sunday 00:00:00 to Saturday 23:59:59
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);

      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
      currentWeekEnd.setHours(23, 59, 59, 999);

      // Previous week: Sunday 00:00:00 to Saturday 23:59:59
      const previousWeekStart = new Date(currentWeekStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);

      const previousWeekEnd = new Date(currentWeekStart);
      previousWeekEnd.setMilliseconds(-1);

      // 7-day revenue comparison (Sun - Sat)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyRevenue = dayNames.map((dayName, idx) => {
        const d = new Date(currentWeekStart);
        d.setDate(currentWeekStart.getDate() + idx);
        return {
          day: dayName,
          date: dayName,
          fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
          dailyRevenue: 0,
          previous: 0,
        };
      });

      const userCountsPromise = User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]);
      const totalUsersPromise = User.countDocuments();
      const newUsersThisWeekPromise = User.countDocuments({
        createdAt: { $gte: currentWeekStart, $lte: currentWeekEnd }
      });
      const courseCountPromise = Course.countDocuments();

      const totalCourseRevenuePromise = CoursePurchase.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const totalSubRevenuePromise = SubscriptionPurchase.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const recentUsersPromise = User.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email role createdAt photoUrl")
        .lean();

      const recentCourseTransactionsPromise = CoursePurchase.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .select("orderId userId totalAmount paymentMethod createdAt")
        .lean();

      const recentSubTransactionsPromise = SubscriptionPurchase.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .select("orderId userId amount paymentMethod createdAt")
        .lean();

      const topEnrolledCoursesPromise = Course.aggregate([
        { $match: { isPublished: true } },
        { $addFields: { enrollmentCount: { $size: { $ifNull: ['$enrolledStudents', []] } } } },
        { $sort: { enrollmentCount: -1 } },
        { $limit: 5 },
        { $project: { title: 1, enrollmentCount: 1, ratings: 1 } }
      ]);

      const topRatedCoursesPromise = Course.find({ isPublished: true, numOfReviews: { $gt: 5 } })
        .sort({ ratings: -1 })
        .limit(5)
        .select('title ratings numOfReviews')
        .lean();

      const twoWeeksCoursePurchasesPromise = CoursePurchase.find({
        status: 'completed',
        createdAt: { $gte: previousWeekStart, $lte: currentWeekEnd }
      }).select('totalAmount createdAt').lean();

      const twoWeeksSubPurchasesPromise = SubscriptionPurchase.find({
        status: 'completed',
        createdAt: { $gte: previousWeekStart, $lte: currentWeekEnd }
      }).select('amount createdAt').lean();

      const [
        userCounts,
        totalUsers,
        newUsersThisWeek,
        totalCourses,
        totalCourseRevenue,
        totalSubRevenue,
        recentUsers,
        recentCourseTransactions,
        recentSubTransactions,
        topEnrolledCourses,
        topRatedCourses,
        twoWeeksCoursePurchases,
        twoWeeksSubPurchases
      ] = await Promise.all([
        userCountsPromise,
        totalUsersPromise,
        newUsersThisWeekPromise,
        courseCountPromise,
        totalCourseRevenuePromise,
        totalSubRevenuePromise,
        recentUsersPromise,
        recentCourseTransactionsPromise,
        recentSubTransactionsPromise,
        topEnrolledCoursesPromise,
        topRatedCoursesPromise,
        twoWeeksCoursePurchasesPromise,
        twoWeeksSubPurchasesPromise
      ]);

      const processRevenueItem = (createdAt, amount) => {
        const itemDate = new Date(createdAt);
        const dayIdx = itemDate.getDay();
        if (dayIdx >= 0 && dayIdx < 7) {
          if (itemDate >= currentWeekStart && itemDate <= currentWeekEnd) {
            weeklyRevenue[dayIdx].dailyRevenue += amount;
          } else if (itemDate >= previousWeekStart && itemDate <= previousWeekEnd) {
            weeklyRevenue[dayIdx].previous += amount;
          }
        }
      };

      twoWeeksCoursePurchases.forEach(p => processRevenueItem(p.createdAt, p.totalAmount || 0));
      twoWeeksSubPurchases.forEach(p => processRevenueItem(p.createdAt, p.amount || 0));

      const currentWeekRevenue = weeklyRevenue.reduce((acc, item) => acc + item.dailyRevenue, 0);
      const previousWeekRevenue = weeklyRevenue.reduce((acc, item) => acc + item.previous, 0);

      const totalStudents = userCounts.find(r => r._id === 'student')?.count || 0;
      const totalInstructors = userCounts.find(r => r._id === 'instructor')?.count || 0;
      const totalRevenue = (totalCourseRevenue[0]?.total || 0) + (totalSubRevenue[0]?.total || 0);

      const newUsersPercentage = totalUsers > 0 ? Math.round((newUsersThisWeek / totalUsers) * 100) : 0;
      const instructorConversionRate = (totalStudents + totalInstructors) > 0
        ? Math.round((totalInstructors / (totalStudents + totalInstructors)) * 100)
        : (totalUsers > 0 ? Math.round((totalInstructors / totalUsers) * 100) : 0);

      const normalizedSubTx = recentSubTransactions.map(sp => ({
        _id: sp._id,
        orderId: sp.orderId,
        userId: sp.userId,
        totalAmount: sp.amount,
        paymentMethod: sp.paymentMethod,
        createdAt: sp.createdAt,
        type: 'Subscription'
      }));

      const recentTransactions = [...recentCourseTransactions, ...normalizedSubTx]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      const dashboardData = {
        stats: {
          totalRevenue,
          totalUsers,
          totalStudents,
          totalInstructors,
          totalCourses,
          currentWeekRevenue,
          previousWeekRevenue,
          newUsersThisWeek,
          newUsersPercentage,
          instructorConversionRate,
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
          weeklyRevenue,
        }
      };

      return this.sendSuccess(res, { analytics: dashboardData });
    } catch (error) {
      console.error("Super Admin Analytics Error:", error);
      return this.sendError(res, "An error occurred while fetching dashboard analytics.", 500);
    }
  };

  getAllUsers = async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;
      const { search, role } = req.query;

      const criteria = {};
      if (search) {
        criteria.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
      if (role && ['student', 'instructor', 'admin'].includes(role)) {
        criteria.role = role;
      }

      const usersPromise = User.find(criteria)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalUsersPromise = User.countDocuments(criteria);

      const [users, totalUsers] = await Promise.all([usersPromise, totalUsersPromise]);

      return res.status(200).json({
        success: true,
        users,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      });
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      return this.sendError(res, "Server error while fetching users.", 500);
    }
  };

  updateUserRoleAndDetails = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, role } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return this.sendError(res, "User not found.", 404);
      }

      if (user._id.toString() === req.user._id.toString() && role && role !== 'admin') {
        return this.sendError(res, "Admins cannot remove their own admin role.", 400);
      }

      user.name = name || user.name;
      user.email = email || user.email;
      user.role = role || user.role;

      const updatedUser = await user.save();
      const userResponse = updatedUser.toObject();
      delete userResponse.password;

      return this.sendSuccess(res, { user: userResponse }, "User updated successfully.");
    } catch (error) {
      console.error("Error in updateUser:", error);
      return this.sendError(res, "Server error while updating user.", 500);
    }
  };

  deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      if (id === req.user._id.toString()) {
        return this.sendError(res, "You cannot delete your own admin account.", 400);
      }

      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return this.sendError(res, "User not found.", 404);
      }

      return this.sendSuccess(res, {}, "User deleted successfully.");
    } catch (error) {
      console.error("Error in deleteUser:", error);
      return this.sendError(res, "Server error while deleting user.", 500);
    }
  };

  getPlatformAnalytics = async (req, res) => {
    try {
      const instructorsRevenuePromise = CoursePurchase.aggregate([
        { $match: { status: 'completed' } },
        { $unwind: '$courses' },
        {
          $lookup: {
            from: 'courses',
            localField: 'courses.courseId',
            foreignField: '_id',
            as: 'courseDetails'
          }
        },
        { $unwind: '$courseDetails' },
        {
          $group: {
            _id: '$courseDetails.creator',
            totalRevenue: { $sum: '$courses.priceAtPurchase' },
            coursesSold: { $sum: 1 }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
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

      const allCoursesPromise = Course.find({})
        .populate('creator', 'name')
        .select('title creator price isPublished enrolledStudents ratings numOfReviews createdAt')
        .lean();

      const [instructorsByRevenue, allCourses] = await Promise.all([
        instructorsRevenuePromise,
        allCoursesPromise
      ]);

      const totalEnrollments = new Set();
      allCourses.forEach(course => {
        course.enrolledStudents.forEach(studentId => totalEnrollments.add(studentId.toString()));
      });

      const totalPlatformRevenue = instructorsByRevenue.reduce((acc, inst) => acc + inst.totalRevenue, 0);

      return this.sendSuccess(res, {
        analytics: {
          summary: {
            totalCourses: allCourses.length,
            totalInstructors: await User.countDocuments({ role: 'instructor' }),
            totalEnrollments: totalEnrollments.size,
            totalPlatformRevenue
          },
          instructorsByRevenue,
          allCourses
        }
      });
    } catch (error) {
      console.error("Platform Analytics Error:", error);
      return this.sendError(res, "Server error while fetching platform analytics.", 500);
    }
  };

  updateCourseByAdmin = async (req, res) => {
    try {
      const { id } = req.params;
      const course = await Course.findById(id);
      if (!course) {
        return this.sendError(res, "Course not found", 404);
      }

      const updatedCourse = await Course.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      return this.sendSuccess(res, { course: updatedCourse }, "Course updated successfully.");
    } catch (error) {
      console.error("Admin Course Update Error:", error);
      return this.sendError(res, "Failed to update course.", 500);
    }
  };

  deleteCourseByAdmin = async (req, res) => {
    try {
      const { id } = req.params;
      const course = await Course.findById(id);
      if (!course) {
        return this.sendError(res, "Course not found.", 404);
      }

      await Course.findByIdAndDelete(id);

      return this.sendSuccess(res, {}, "Course has been deleted successfully.");
    } catch (error) {
      console.error("Admin Course Deletion Error:", error);
      return this.sendError(res, "Failed to delete course.", 500);
    }
  };

  getRevenueDetails = async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 15;
      const skip = (page - 1) * limit;

      const { status, paymentMethod, startDate, endDate } = req.query;
      const criteria = {};

      if (status) criteria.status = status;
      if (paymentMethod) criteria.paymentMethod = paymentMethod;

      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter.$lte = endOfDay;
      }
      if (Object.keys(dateFilter).length > 0) criteria.createdAt = dateFilter;

      const sortOptions = {};
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sortOptions[sortBy] = sortOrder;

      const purchasesPromise = CoursePurchase.find(criteria)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate({ path: 'userId', select: 'name email photoUrl' })
        .populate({
          path: 'courses.courseId',
          select: 'title creator',
          populate: { path: 'creator', select: 'name email' }
        })
        .lean();

      const totalPurchasesPromise = CoursePurchase.countDocuments(criteria);

      const courseSummaryPromise = CoursePurchase.aggregate([
        { $match: { status: "completed" } },
        { $unwind: "$courses" },
        {
          $group: {
            _id: null,
            totalCourseSales: { $sum: "$courses.priceAtPurchase" },
            totalInstructorShare: { $sum: "$courses.instructorShare" },
            totalAdminShare: { $sum: "$courses.adminShare" }
          }
        }
      ]);

      const [purchases, totalPurchases, courseSummary, payoutsData] = await Promise.all([
        purchasesPromise,
        totalPurchasesPromise,
        courseSummaryPromise,
        getSubscriptionPayouts()
      ]);

      const totalCourseSales = courseSummary[0]?.totalCourseSales || 0;
      const totalInstructorShare = courseSummary[0]?.totalInstructorShare || 0;
      const totalAdminShare = courseSummary[0]?.totalAdminShare || 0;

      const totalSubSales = payoutsData.totalSubSales || 0;
      const subInstructorPool = payoutsData.instructorPool || 0;
      const subAdminShare = payoutsData.adminSubShare || 0;
      const netAdminRevenue = totalAdminShare + subAdminShare;

      return res.status(200).json({
        success: true,
        data: purchases,
        summary: {
          totalCourseSales,
          totalInstructorShare,
          totalAdminShare,
          totalSubSales,
          subInstructorPool,
          subAdminShare,
          netAdminRevenue,
          instructorShares: payoutsData.instructorShares
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPurchases / limit),
          totalItems: totalPurchases,
          itemsPerPage: limit
        },
      });
    } catch (error) {
      console.error("Error in getRevenueDetails:", error);
      return this.sendError(res, "Server error while fetching revenue details.", 500);
    }
  };

  getInstructorPayoutSummary = async (req, res) => {
    try {
      const instructors = await User.find({ role: "instructor" }).select("name email photoUrl").lean();

      const courseEarnings = await CoursePurchase.aggregate([
        { $match: { status: "completed" } },
        { $unwind: "$courses" },
        {
          $lookup: {
            from: "courses",
            localField: "courses.courseId",
            foreignField: "_id",
            as: "courseInfo"
          }
        },
        { $unwind: "$courseInfo" },
        {
          $group: {
            _id: "$courseInfo.creator",
            totalCourseEarnings: { $sum: "$courses.instructorShare" },
            totalCourseSales: { $sum: "$courses.priceAtPurchase" }
          }
        }
      ]);

      const courseEarningsMap = {};
      courseEarnings.forEach(item => {
        if (item._id) {
          courseEarningsMap[item._id.toString()] = {
            totalCourseEarnings: item.totalCourseEarnings || 0,
            totalCourseSales: item.totalCourseSales || 0
          };
        }
      });

      const payoutsData = await getSubscriptionPayouts();
      const subPayoutsMap = payoutsData.payouts || {};

      const paidEarnings = await InstructorPayout.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: "$instructorId",
            totalPaid: { $sum: "$amount" }
          }
        }
      ]);

      const paidMap = {};
      paidEarnings.forEach(item => {
        if (item._id) {
          paidMap[item._id.toString()] = item.totalPaid || 0;
        }
      });

      const summary = instructors.map(inst => {
        const instIdStr = inst._id.toString();
        const courseData = courseEarningsMap[instIdStr] || { totalCourseEarnings: 0, totalCourseSales: 0 };
        const subEarnings = subPayoutsMap[instIdStr] || 0;
        const totalEarnings = courseData.totalCourseEarnings + subEarnings;
        const totalPaid = paidMap[instIdStr] || 0;
        const pendingBalance = Math.max(0, totalEarnings - totalPaid);

        return {
          instructorId: inst._id,
          name: inst.name,
          email: inst.email,
          photoUrl: inst.photoUrl,
          courseSales: courseData.totalCourseSales,
          courseEarnings: courseData.totalCourseEarnings,
          subscriptionEarnings: subEarnings,
          totalEarnings,
          totalPaid,
          pendingBalance: Number(pendingBalance.toFixed(2))
        };
      });

      const payoutHistory = await InstructorPayout.find()
        .populate("instructorId", "name email photoUrl")
        .sort({ createdAt: -1 })
        .lean();

      return this.sendSuccess(res, { summary, payoutHistory });
    } catch (error) {
      console.error("Error in getInstructorPayoutSummary:", error);
      return this.sendError(res, "Failed to fetch payout summary.", 500);
    }
  };

  createInstructorPayout = async (req, res) => {
    try {
      const { instructorId, amount, paymentMethod, transactionId, remarks } = req.body;

      if (!instructorId || !amount || !paymentMethod) {
        return this.sendError(res, "Missing required payout details.", 400);
      }

      if (Number(amount) <= 0) {
        return this.sendError(res, "Payout amount must be greater than zero.", 400);
      }

      const instructor = await User.findById(instructorId);
      if (!instructor || instructor.role !== "instructor") {
        return this.sendError(res, "Invalid instructor ID or user role is not instructor.", 400);
      }

      const payout = new InstructorPayout({
        instructorId,
        amount: Number(amount),
        paymentMethod,
        transactionId,
        remarks,
        status: "completed"
      });

      await payout.save();

      return this.sendSuccess(res, { data: payout }, "Payout successfully created and logged.", 201);
    } catch (error) {
      console.error("Error in createInstructorPayout:", error);
      return this.sendError(res, "Server error while processing payout.", 500);
    }
  };
}

export const adminController = new AdminController();

export const getSuperAdminDashboardAnalytics = adminController.getSuperAdminDashboardAnalytics;
export const getAllUsers = adminController.getAllUsers;
export const updateUserRoleAndDetails = adminController.updateUserRoleAndDetails;
export const deleteUser = adminController.deleteUser;
export const getPlatformAnalytics = adminController.getPlatformAnalytics;
export const updateCourseByAdmin = adminController.updateCourseByAdmin;
export const deleteCourseByAdmin = adminController.deleteCourseByAdmin;
export const getRevenueDetails = adminController.getRevenueDetails;
export const getInstructorPayoutSummary = adminController.getInstructorPayoutSummary;
export const createInstructorPayout = adminController.createInstructorPayout;