import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { connectDB } from "./config/db";
import { buildDashboardRouter } from "./routes/dashboardRoutes";
import { buildAuthRouter } from "./routes/authRoutes";
import { buildScheduleRouter } from "./routes/scheduleRoutes";
import { buildDoctorRouter } from "./routes/doctorRoutes";
import { buildAppointmentRouter } from "./routes/appointmentRoutes";
import { buildDoctorLeaveRouter } from "./routes/doctorLeaveRoutes";
import { buildPatientRouter } from "./routes/patientRoutes";
import { buildConsultationRouter } from "./routes/consultationRoutes";
import { buildPrescriptionRouter } from "./routes/prescriptionRoutes";
import { buildInventoryRouter } from "./routes/inventoryRoutes";
import { buildGRNRouter } from "./routes/grnRoutes";
import { buildHospitalRouter } from "./routes/hospitalRoutes";
import { buildPharmacyRouter } from "./routes/pharmacyRoutes";

dotenv.config();

const start = async () => {
  const app = express();
  
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  };
  
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use("/api/auth", buildAuthRouter());
  app.use("/api/dashboard", buildDashboardRouter());
  app.use("/api/schedule", buildScheduleRouter());
  app.use("/api/doctors", buildDoctorRouter());
  app.use("/api/appointments", buildAppointmentRouter());
  app.use("/api/doctor-leaves", buildDoctorLeaveRouter());
  app.use("/api/patients", buildPatientRouter());
  app.use("/api/consultations", buildConsultationRouter());
  app.use("/api/prescriptions", buildPrescriptionRouter());
  app.use("/api/inventory", buildInventoryRouter());
  app.use("/api/grn", buildGRNRouter());
  app.use("/api/hospitals", buildHospitalRouter());
  app.use("/api/pharmacies", buildPharmacyRouter());

  app.get("/", (_req, res) =>
    res.json({ message: "HMS API is healthy" })
  );

  await connectDB(process.env.MONGODB_URI || "");

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API running on http://localhost:${port}`);
  });
};

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API", err);
  process.exit(1);
});
