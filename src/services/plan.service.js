import Plan from "../models/plan.model.js";

export const getPlanById = async (id) => {
  return await Plan.findById(id);
};

const addPlan = async (req) => {
  try {
    const { title, durationMonths, price, currency, discountPercentage, isActive } =
      req.body;

    const existing = await Plan.findOne({
      title: { $regex: new RegExp(`^${title}$`, "i") },
      durationMonths,
    });
    if (existing) {
      throw new Error("A plan with this title and duration already exists.");
    }

    const plan = await Plan.create({
      title,
      durationMonths,
      price,
      currency: currency || "INR",
      discountPercentage: discountPercentage ?? 0,
      isActive: isActive !== false,
    });

    return plan;
  } catch (error) {
    throw error;
  }
};

const getAllPlans = async (req) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const isActive = req.query.isActive;

    const skip = (page - 1) * limit;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === "true" || isActive === true;
    }

    const plans = await Plan.find(filter)
      .sort({ durationMonths: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Plan.countDocuments(filter);

    return {
      plans,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    throw error;
  }
};

const getPlanByIdService = async (req) => {
  try {
    const { id } = req.params;
    const plan = await getPlanById(id);

    if (!plan) {
      throw new Error("Plan not found.");
    }

    return plan;
  } catch (error) {
    throw error;
  }
};

const updatePlan = async (req) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const plan = await Plan.findByIdAndUpdate(id, updates, { new: true });

    if (!plan) {
      throw new Error("Plan not found.");
    }

    return plan;
  } catch (error) {
    throw error;
  }
};

const deletePlan = async (req) => {
  try {
    const { id } = req.params;

    const plan = await Plan.findByIdAndDelete(id);

    if (!plan) {
      throw new Error("Plan not found.");
    }

    return plan;
  } catch (error) {
    throw error;
  }
};

export const planService = {
  addPlan,
  getAllPlans,
  getPlanById: getPlanByIdService,
  updatePlan,
  deletePlan,
};
