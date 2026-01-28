import { RequestHandler } from "express";
import { buildDashboardPayload } from "../services/dashboardService";
import { Doctor } from "../models/doctorModel";
import { User } from "../models/userModel";

export const getDashboard: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doctorId = req.user.userId;

    // Get doctor's hospitalId if doctor is associated with a hospital
    let hospitalId: string | undefined = undefined;
    try {
      // First try to find doctor by user ID
      let doctor = await Doctor.findOne({ user: doctorId })
        .select("hospital Email")
        .lean() as { hospital?: any; Email?: string } | null;

      // If not found by user ID, try to find by email from User model
      if (!doctor) {
        const user = await User.findById(doctorId).select("email").lean();
        if (user?.email) {
          doctor = await Doctor.findOne({
            Email: new RegExp(`^${user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          })
            .select("hospital Email")
            .lean() as { hospital?: any; Email?: string } | null;
        }
      }

      if (doctor?.hospital) {
        hospitalId = doctor.hospital.toString();
      }
    } catch (error) {
      // If we can't find doctor, continue without hospital filter
      // eslint-disable-next-line no-console
      console.error("Error fetching doctor hospital:", error);
    }

    const payload = await buildDashboardPayload(doctorId, hospitalId);
    return res.json(payload);
  } catch (err) {
    return next(err);
  }
};
