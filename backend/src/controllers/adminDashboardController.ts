import { RequestHandler } from "express";
import { buildAdminDashboardPayload } from "../services/adminDashboardService";

export const getAdminDashboard: RequestHandler = async (req, res, next) => {
  try {
    const payload = await buildAdminDashboardPayload();
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};
