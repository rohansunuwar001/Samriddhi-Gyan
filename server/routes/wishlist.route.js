import express from "express";
import { addToWishlist, getWishlist, removeFromWishlist } from "../controllers/wishlist.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";




const wishlistRouter = express.Router();

wishlistRouter.get("/", isAuthenticated, getWishlist);
wishlistRouter.post("/add", isAuthenticated, addToWishlist);
wishlistRouter.post("/remove", isAuthenticated, removeFromWishlist);

export default wishlistRouter;