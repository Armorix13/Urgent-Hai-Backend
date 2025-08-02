import { raagDetailService } from "../services/raagDetail.service.js";

const addRaagDetail = async (req, res, next) => {
    try {
        const detail = await raagDetailService.addRaagDetail(req);
        return res.status(201).json({
            success: true,
            message: "RaagDetail created successfully!",
            detail,
        });
    } catch (error) {
        next(error);
    }
};

const getAllRaagDetails = async (req, res, next) => {
    try {
        const data = await raagDetailService.getAllRaagDetails(req);
        return res.status(200).json({
            success: true,
            message: "RaagDetails fetched successfully!",
            ...data,
        });
    } catch (error) {
        next(error);
    }
};

const getRaagDetailById = async (req, res, next) => {
    try {
        const detail = await raagDetailService.getRaagDetailById(req);
        return res.status(200).json({
            success: true,
            message: "RaagDetail fetched successfully!",
            detail,
        });
    } catch (error) {
        next(error);
    }
};

const updateRaagDetail = async (req, res, next) => {
    try {
        const detail = await raagDetailService.updateRaagDetail(req);
        return res.status(200).json({
            success: true,
            message: "RaagDetail updated successfully!",
            detail,
        });
    } catch (error) {
        next(error);
    }
};

const deleteRaagDetail = async (req, res, next) => {
    try {
        const detail = await raagDetailService.deleteRaagDetail(req);
        return res.status(200).json({
            success: true,
            message: "RaagDetail deleted successfully!",
            detail,
        });
    } catch (error) {
        next(error);
    }
};

export const raagDetailController = {
    addRaagDetail,
    getAllRaagDetails,
    getRaagDetailById,
    updateRaagDetail,
    deleteRaagDetail,
};
