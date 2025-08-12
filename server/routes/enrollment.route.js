
// import { Router } from 'express';
// import isAuthenticated from '../middlewares/isAuthenticated.js';
// import { getMyEnrollments, getSingleEnrollment } from '../controllers/enrollment.controller.js';
// import { updateLectureProgress } from '../controllers/courseProgress.controller.js';
// // import { isAuthenticated } from '../middlewares/auth.middleware.js'; // Assuming this is your authentication middleware

// const router = Router();

// // --- SECURE ALL ENROLLMENT ROUTES ---
// // The `isAuthenticated` middleware will be applied to every route defined in this file.
// // This ensures that no unauthenticated user can access any of these endpoints.
// router.use(isAuthenticated);


// // --- DEFINE ROUTES ---

// /**
//  * @route   GET /api/v1/enrollments/my-courses
//  * @desc    Get all courses the currently logged-in user is enrolled in.
//  * @access  Private (Authenticated users only)
//  */
// router.get('/my-courses', getMyEnrollments);


// /**
//  * @route   GET /api/v1/enrollments/:enrollmentId
//  * @desc    Get the full details of a specific enrollment for the course player.
//  * @access  Private (Authenticated users only)
//  */
// router.get('/:enrollmentId', getSingleEnrollment);


// /**
//  * @route   PUT /api/v1/enrollments/:enrollmentId/progress
//  * @desc    Update progress for a lecture (mark as complete or incomplete).
//  * @access  Private (Authenticated users only)
//  */
// router.put('/:enrollmentId/progress', updateLectureProgress);


// export default router;