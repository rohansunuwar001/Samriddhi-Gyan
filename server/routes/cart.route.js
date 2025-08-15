// routes/cartRoutes.js

import { Router } from "express";

import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controllers/cart.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

const cartRouter = Router();

// All these routes are protected and require a logged-in user
// cartRouter.use(isAuthenticated);

cartRouter.get("/", isAuthenticated, getCart);
cartRouter.post("/add", isAuthenticated, addToCart);
cartRouter.post("/remove", isAuthenticated, removeFromCart);

export default cartRouter;
