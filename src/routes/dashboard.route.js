import express from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
import authenticate from "../middlewares/auth.middleware.js";

const dashboardRoute = express.Router();

dashboardRoute.use(authenticate);
dashboardRoute.get("/analytics", dashboardController.getAnalytics);

export default dashboardRoute;
