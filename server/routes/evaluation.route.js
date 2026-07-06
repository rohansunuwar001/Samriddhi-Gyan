import express from "express";
import { validateCodeAST, checkPlagiarismLSH } from "../controllers/evaluation.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.post("/validate-code", isAuthenticated, validateCodeAST);
router.post("/check-plagiarism", isAuthenticated, checkPlagiarismLSH);

export default router;
