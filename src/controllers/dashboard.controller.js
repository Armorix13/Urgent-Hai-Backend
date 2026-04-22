import { getDashboardAnalytics } from "../services/dashboard.service.js";

const getAnalytics = async (req, res, next) => {
  try {
    const data = await getDashboardAnalytics(req);
    return res.status(200).json({
      success: true,
      message: "Dashboard analytics loaded",
      ...data,
    });
  } catch (err) {
    next(err);
  }
};

export const dashboardController = {
  getAnalytics,
};
