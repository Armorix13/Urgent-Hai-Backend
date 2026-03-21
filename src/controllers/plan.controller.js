import { planService } from "../services/plan.service.js";

const addPlan = async (req, res, next) => {
  try {
    const plan = await planService.addPlan(req);
    return res.status(201).json({
      success: true,
      message: "Plan created successfully!",
      plan,
    });
  } catch (error) {
    next(error);
  }
};

const getAllPlans = async (req, res, next) => {
  try {
    const data = await planService.getAllPlans(req);
    return res.status(200).json({
      success: true,
      message: "Plans fetched successfully!",
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const plan = await planService.getPlanById(req);
    return res.status(200).json({
      success: true,
      message: "Plan fetched successfully!",
      plan,
    });
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const plan = await planService.updatePlan(req);
    return res.status(200).json({
      success: true,
      message: "Plan updated successfully!",
      plan,
    });
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const plan = await planService.deletePlan(req);
    return res.status(200).json({
      success: true,
      message: "Plan deleted successfully!",
      plan,
    });
  } catch (error) {
    next(error);
  }
};

export const planController = {
  addPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
};
