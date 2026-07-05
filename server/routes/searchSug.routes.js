import express from 'express';
import { getSearchResults, getTrendingSuggestions } from '../controllers/course.controller.js';

import loadUserIfAuthenticated from '../middlewares/loadUserIfAuthenticated.js';

const searchRouter = express.Router();

// Maps GET requests to / to the getSearchResults function
searchRouter.get('/', loadUserIfAuthenticated, getSearchResults);
searchRouter.get('/trending', getTrendingSuggestions);

export default searchRouter;