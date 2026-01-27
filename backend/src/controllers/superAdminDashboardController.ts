import { RequestHandler } from "express";
import { buildSuperAdminDashboardPayload } from "../services/superAdminDashboardService";

export const getSuperAdminDashboard: RequestHandler = async (_req, res, next) => {
  try {
    const payload = await buildSuperAdminDashboardPayload();
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};

