
import { Router } from "express";
import { createArticle, deleteArticle, getAllArticles, getArticleBySlug, updateArticle } from "../controllers/article.controller.js";

const articleRouter = Router();
articleRouter.route("/").post(createArticle).get(getAllArticles);
// Use slug for public-facing GET route
articleRouter.route("/slug/:slug").get(getArticleBySlug);
// Use ID for admin-facing CUD routes
articleRouter.route("/:id").patch(updateArticle).delete(deleteArticle);
export default articleRouter;
