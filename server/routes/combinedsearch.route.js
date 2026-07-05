import express from "express";
import { getCombinedSearchResults } from "../controllers/combinedSearch.controller.js";

import loadUserIfAuthenticated from "../middlewares/loadUserIfAuthenticated.js";

const combinedSearchRouter = express.Router();

// GET /api/v1/search-by-topic?topic=Node.js
combinedSearchRouter.get("/", loadUserIfAuthenticated, getCombinedSearchResults);

export default combinedSearchRouter;