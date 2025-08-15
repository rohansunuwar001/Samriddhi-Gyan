import { Router } from 'express';
import { createReview, deleteReview, replyToReview } from '../controllers/review.controller.js';
import { authorizeRoles, isAuthenticated } from '../middlewares/isAuthenticated.js';


const reviewRouter = Router();
reviewRouter.route('/:courseId').post(isAuthenticated,createReview);
reviewRouter.route('/:reviewId/reply').put(
    isAuthenticated,
    authorizeRoles('instructor'),
    replyToReview
);
reviewRouter.route('/:reviewId').delete(
    isAuthenticated,
    authorizeRoles('instructor'),
    deleteReview
);
export default reviewRouter;