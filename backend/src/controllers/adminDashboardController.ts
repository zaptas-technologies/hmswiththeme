import { RequestHandler } from "express";
import { buildAdminDashboardPayload } from "../services/adminDashboardService";

export const getAdminDashboard: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // For hospital_admin, filter by their hospitalId
    // For super_admin or admin, show all data (hospitalId = undefined)
    const hospitalId = req.user.role === "HOSPITAL_ADMIN" ? req.user.hospitalId : undefined;
    
    // Validate hospitalId for hospital_admin
    if (req.user.role === "HOSPITAL_ADMIN" && !hospitalId) {
      return res.status(400).json({ 
        message: "Hospital Admin must be associated with a hospital. Please contact administrator." 
      });
    }
    
    const payload = await buildAdminDashboardPayload(hospitalId);
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};
