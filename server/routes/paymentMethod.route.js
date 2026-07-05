// server/routes/paymentMethod.route.js

import express from "express";
import { getPaymentMethods, addPaymentMethod, deletePaymentMethod } from "../controllers/paymentMethod.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.use(isAuthenticated);

router.route("/")
  .get(getPaymentMethods)
  .post(addPaymentMethod);

router.route("/:id")
  .delete(deletePaymentMethod);

export default router;
