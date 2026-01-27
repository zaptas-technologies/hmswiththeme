import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { connectDB } from "./config/db";
import { buildResourceRouter } from "./routes/resourceRoutes";
import { buildDashboardRouter } from "./routes/dashboardRoutes";
import { buildAuthRouter } from "./routes/authRoutes";
import { buildScheduleRouter } from "./routes/scheduleRoutes";
import { buildDoctorRouter } from "./routes/doctorRoutes";
import { buildAppointmentRouter } from "./routes/appointmentRoutes";
import { buildDoctorLeaveRouter } from "./routes/doctorLeaveRoutes";
import { buildPatientRouter } from "./routes/patientRoutes";
import { buildConsultationRouter } from "./routes/consultationRoutes";
import { buildPrescriptionRouter } from "./routes/prescriptionRoutes";
import { scanResourceFiles } from "./utils/resourceLoader";
import { initResourceModels } from "./models/resourceRegistry";
import { schemaMap } from "./models/schemas";

dotenv.config();

const start = async () => {
  const app = express();
  
  // Enhanced CORS configuration to handle all HTTP methods including PATCH
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow all origins for development
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-user-id",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours
  };
  
  // Apply CORS to all routes - this must be before other middleware
  app.use(cors(corsOptions));
  
  // Handle preflight requests explicitly for all routes
  app.options("*", cors(corsOptions));
  
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  const discoveredDescriptors = await scanResourceFiles();
  // Ensure core schemas (e.g. "consultations") are always initialized even if
  // there is no corresponding dataset file under `src/core/json`.
  const schemaDescriptors = Object.keys(schemaMap).map((name) => ({
    name,
    filePath: "<schema>",
  }));
  const mergedDescriptors = [
    ...discoveredDescriptors,
    ...schemaDescriptors.filter(
      (d) => !discoveredDescriptors.some((x) => x.name === d.name)
    ),
  ];
  const resources = await initResourceModels(mergedDescriptors);
  app.use("/api/auth", buildAuthRouter());
  app.use("/api/dashboard", buildDashboardRouter());
  app.use("/api/schedule", buildScheduleRouter());
  app.use("/api/doctors", buildDoctorRouter());
  app.use("/api/appointments", buildAppointmentRouter());
  app.use("/api/doctor-leaves", buildDoctorLeaveRouter());
  app.use("/api/patients", buildPatientRouter());
  app.use("/api/consultations", buildConsultationRouter());
  app.use("/api/prescriptions", buildPrescriptionRouter());
  app.use("/api", buildResourceRouter(resources));

  app.get("/", (_req, res) =>
    res.json({ message: "HMS API is healthy", resources })
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
