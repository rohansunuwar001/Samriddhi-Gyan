import { Router } from "express";
import { createAuthor, deleteAuthor, getAllAuthors, getAuthorById, updateAuthor } from "../controllers/author.controller.js";


const authorRouter = Router();

authorRouter.route('/').post(createAuthor).get(getAllAuthors);
authorRouter.route('/:id').get(getAuthorById).patch(updateAuthor).delete(deleteAuthor);

export default authorRouter;