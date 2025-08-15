// file: middleware/isAuthenticated.js

import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Authentication token missing. Please log in.",
        success: false,
      });
    }

    // Decode the token to get the payload (which now includes userId and role)
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    if (!decoded) {
      return res.status(401).json({
        message: "Invalid token.",
        success: false,
      });
    }

    // --- RECOMMENDED IMPROVEMENT ---
    // Fetch the user from the database using the ID from the token.
    // This ensures you always have the most up-to-date user information (like their role).
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
         return res.status(401).json({
             message: "User not found. Token is invalid.",
             success: false,
         });
    }

    // Attach the full user object from the DB to the request object.
    req.user = user;

    next(); // Pass control to the next middleware (e.g., authorizeRoles)

  } catch (error) {
    console.log("Authentication error:", error.message);
    return res.status(401).json({
      message: "Session expired or token is invalid. Please log in again.",
      success: false,
    });
  }
};


// This function is a "higher-order function". It takes roles as arguments
// and returns a middleware function that can use those roles.
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // We expect `isAuthenticated` to have run before this,
    // so `req.user` should exist. The role is on `req.user.role`.

    if (!roles.includes(req.user.role)) {
      // If the user's role is not in the list of allowed roles, deny access.
      // We use a 403 Forbidden status because the user is authenticated,
      // but they lack the necessary permissions for this specific resource.
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      });
    }

    // If the user's role is allowed, proceed to the next middleware or controller.
    next();
  };
};


