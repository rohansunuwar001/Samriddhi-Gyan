import { Course } from '../models/course.model.js';

export const getDashboardAnalytics = async (req, res) => {
    try {
        const instructorId = req.id;

        const courses = await Course.find({ creator: instructorId });

        if (!courses || courses.length === 0) {
            return res.status(200).json({
                stats: { totalRevenue: 0, totalStudents: 0, totalCourses: 0, averageRating: 0 },
                monthlySales: []
            });
        }
        
        // --- Calculate Stats ---
        const totalCourses = courses.filter(c => c.isPublished).length;
        const totalRevenue = courses.reduce((acc, course) => acc + (course.price.current * course.enrolledStudents.length), 0);
        
        // Get a unique set of all student IDs across all courses
        const allStudentIds = courses.reduce((acc, course) => {
            course.enrolledStudents.forEach(id => acc.add(id.toString()));
            return acc;
        }, new Set());
        const totalStudents = allStudentIds.size;
        
        const totalRatingSum = courses.reduce((acc, course) => acc + (course.ratings * course.numOfReviews), 0);
        const totalReviewsCount = courses.reduce((acc, course) => acc + course.numOfReviews, 0);
        const averageRating = totalReviewsCount > 0 ? totalRatingSum / totalReviewsCount : 0;
        
        // --- Monthly sales data would require querying your 'CoursePurchase' model by date ---
        // This is a more complex query, so here's a placeholder:
        const monthlySales = [
            { month: "Jan", revenue: 50000 },
            { month: "Feb", revenue: 75000 },
            { month: "Mar", revenue: 60000 },
        ];
        
        res.status(200).json({
            stats: { totalRevenue, totalStudents, totalCourses, averageRating },
            monthlySales
        });
        
    } catch (error) {
        console.error("Dashboard Analytics Error:", error);
        res.status(500).json({ message: "Server error" });
    }
}