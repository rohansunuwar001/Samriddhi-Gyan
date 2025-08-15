import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


const loadUserIfAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
        if (!token) {
            return next(); // No token? No problem. Just continue.
        }
        
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded && decoded.userId) {
            const user = await User.findById(decoded.userId).select("-password");
            if (user) {
                req.user = user; // Attach the user if found.
            }
        }
        return next();
    } catch (error) {
        // If token is expired or invalid, just move on without a user.
        return next();
    }
};

export default loadUserIfAuthenticated;