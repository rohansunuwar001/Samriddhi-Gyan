import { Router } from 'express';
import {
    createLecture,
    deleteLecture,
    getLectureById,
    updateLecture
} from '../controllers/lecture.controller.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';

import upload from '../utils/multer.js';

const lectureRouter = Router();

// To create a lecture, you must know which section it belongs to.
lectureRouter.route('/sections/:sectionId/lectures').post(
    isAuthenticated,
    createLecture
);

// To update, delete, or get a lecture, you only need the lecture's own ID.
lectureRouter.route('/lectures/:lectureId')
    .get(getLectureById) // Could also require isAuthenticated
    .put(
        isAuthenticated,
        upload.single('video'), // Use multer to handle video file upload
        updateLecture
    )
    .delete(isAuthenticated, deleteLecture);

export default lectureRouter;