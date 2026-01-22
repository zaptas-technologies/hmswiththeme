import { RequestHandler } from "express";
import { buildDashboardPayload } from "../services/dashboardService";

export const getDashboard: RequestHandler = async (req, res, next) => {
  try {
    const doctorId = (req as any).userId as string | undefined;
    if (!doctorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = await buildDashboardPayload(doctorId);
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};
