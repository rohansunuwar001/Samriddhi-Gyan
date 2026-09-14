// server/middlewares/isAuthenticated.js

import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export class AuthMiddleware {
  /**
   * Required authentication middleware.
   */
  async authenticate(req, res, next) {
    try {
      const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          message: "Authentication token missing. Please log in.",
          success: false,
        });
      }

      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      if (!decoded) {
        return res.status(401).json({
          message: "Invalid token.",
          success: false,
        });
      }

      const user = await User.findById(decoded.userId)
        .select("-password")
        .populate("enrolledCourses")
        .populate("wishlist")
        .populate({
          path: "viewHistory.course",
          select: "title category thumbnail ratings",
        });

      if (!user) {
        return res.status(401).json({
          message: "User not found. Token is invalid.",
          success: false,
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.log("Authentication error:", error.message);
      return res.status(401).json({
        message: "Session expired or token is invalid. Please log in again.",
        success: false,
      });
    }
  }

  /**
   * Optional authentication middleware.
   */
  async authenticateOptional(req, res, next) {
    try {
      const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
      if (!token) return next();

      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      if (!decoded) return next();

      const user = await User.findById(decoded.userId)
        .select("-password")
        .populate("enrolledCourses")
        .populate("wishlist")
        .populate({
          path: "viewHistory.course",
          select: "title category thumbnail ratings",
        });

      if (user) req.user = user;
      next();
    } catch (error) {
      console.log("Optional authentication error:", error.message);
      next();
    }
  }

  /**
   * Role-based authorization middleware.
   */
  authorizeRoles(...roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message: `Role '${req.user?.role}' is not authorized to access this route.`,
        });
      }
      next();
    };
  }
}

export const authMiddleware = new AuthMiddleware();

// Backward-compatible named exports
export const isAuthenticated = authMiddleware.authenticate.bind(authMiddleware);
export const isOptionalAuthenticated = authMiddleware.authenticateOptional.bind(authMiddleware);
export const authorizeRoles = authMiddleware.authorizeRoles.bind(authMiddleware);