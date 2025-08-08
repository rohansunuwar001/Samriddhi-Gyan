import { Router } from 'express';
import { createReview } from '../controllers/review.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';

const reviewRouter = Router();
reviewRouter.route('/:courseId').post(isAuthenticated,createReview);

export default reviewRouter;