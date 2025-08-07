import express from 'express';
import { createCategory, getAllCategories, updateCategory, deleteCategory } from '../controllers/category.controller.js';

const router = express.Router();

router.route('/').post(createCategory).get(getAllCategories);
router.route('/:id').patch(updateCategory).delete(deleteCategory);

export default router;