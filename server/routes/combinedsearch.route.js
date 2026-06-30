import express from "express";
import { getCombinedSearchResults } from "../controllers/combinedSearch.controller.js";

const combinedSearchRouter = express.Router();

// GET /api/v1/search-by-topic?topic=Node.js
combinedSearchRouter.get("/", getCombinedSearchResults);

export default combinedSearchRouter;