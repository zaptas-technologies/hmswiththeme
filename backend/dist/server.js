"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./config/db");
const dashboardRoutes_1 = require("./routes/dashboardRoutes");
const authRoutes_1 = require("./routes/authRoutes");
const scheduleRoutes_1 = require("./routes/scheduleRoutes");
const doctorRoutes_1 = require("./routes/doctorRoutes");
const appointmentRoutes_1 = require("./routes/appointmentRoutes");
const doctorLeaveRoutes_1 = require("./routes/doctorLeaveRoutes");
const patientRoutes_1 = require("./routes/patientRoutes");
const consultationRoutes_1 = require("./routes/consultationRoutes");
const prescriptionRoutes_1 = require("./routes/prescriptionRoutes");
const inventoryRoutes_1 = require("./routes/inventoryRoutes");
const grnRoutes_1 = require("./routes/grnRoutes");
const hospitalRoutes_1 = require("./routes/hospitalRoutes");
const pharmacyRoutes_1 = require("./routes/pharmacyRoutes");
dotenv_1.default.config();
const start = async () => {
    const app = (0, express_1.default)();
    const corsOptions = {
        origin: (origin, callback) => {
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
    app.use((0, cors_1.default)(corsOptions));
    app.options("*", (0, cors_1.default)(corsOptions));
    app.use(express_1.default.json({ limit: "1mb" }));
    app.use((0, morgan_1.default)("dev"));
    // Static uploads (local disk). e.g. http://localhost:4000/uploads/doctors/<file>
    const uploadsDir = path_1.default.join(process.cwd(), "uploads");
    fs_1.default.mkdirSync(path_1.default.join(uploadsDir, "doctors"), { recursive: true });
    app.use("/uploads", express_1.default.static(uploadsDir));
    app.use("/api/auth", (0, authRoutes_1.buildAuthRouter)());
    app.use("/api/dashboard", (0, dashboardRoutes_1.buildDashboardRouter)());
    app.use("/api/schedule", (0, scheduleRoutes_1.buildScheduleRouter)());
    app.use("/api/doctors", (0, doctorRoutes_1.buildDoctorRouter)());
    app.use("/api/appointments", (0, appointmentRoutes_1.buildAppointmentRouter)());
    app.use("/api/doctor-leaves", (0, doctorLeaveRoutes_1.buildDoctorLeaveRouter)());
    app.use("/api/patients", (0, patientRoutes_1.buildPatientRouter)());
    app.use("/api/consultations", (0, consultationRoutes_1.buildConsultationRouter)());
    app.use("/api/prescriptions", (0, prescriptionRoutes_1.buildPrescriptionRouter)());
    app.use("/api/inventory", (0, inventoryRoutes_1.buildInventoryRouter)());
    app.use("/api/grn", (0, grnRoutes_1.buildGRNRouter)());
    app.use("/api/hospitals", (0, hospitalRoutes_1.buildHospitalRouter)());
    app.use("/api/pharmacies", (0, pharmacyRoutes_1.buildPharmacyRouter)());
    app.get("/", (_req, res) => res.json({ message: "HMS API is healthy" }));
    await (0, db_1.connectDB)(process.env.MONGODB_URI || "");
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
