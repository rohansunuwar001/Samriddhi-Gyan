import express from 'express';
import { getSearchResults, getTrendingSuggestions } from '../controllers/course.controller.js';

const searchRouter = express.Router();

// Maps GET requests to / to the getSearchResults function
searchRouter.get('/', getSearchResults);
searchRouter.get('/trending', getTrendingSuggestions);

export default searchRouter;