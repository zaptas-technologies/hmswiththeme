import { RequestHandler } from "express";
import { buildAdminDashboardPayload } from "../services/adminDashboardService";

export const getAdminDashboard: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // For hospital_admin, filter by their hospitalId - STRICTLY enforce hospital filtering
    // For super_admin or admin, show all data (hospitalId = undefined)
    let hospitalId: string | undefined = undefined;
    
    if (req.user.role === "HOSPITAL_ADMIN") {
      hospitalId = req.user.hospitalId;
      
      // Validate hospitalId for hospital_admin - REQUIRED
      if (!hospitalId) {
        return res.status(400).json({ 
          message: "Hospital Admin must be associated with a hospital. Please contact administrator." 
        });
      }
    }
    
    // Ensure hospital_admin can ONLY see their hospital's data
    // Pass hospitalId to service which will filter all queries by this hospital
    // If hospitalId is provided, ALL data will be filtered to that hospital only
    const payload = await buildAdminDashboardPayload(hospitalId);
    
    // Add hospitalId to response for debugging (can be removed in production)
    if (hospitalId) {
      (payload as any).filteredByHospitalId = hospitalId;
    }
    
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};
