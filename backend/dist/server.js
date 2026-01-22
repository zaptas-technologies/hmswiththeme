"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const db_1 = require("./config/db");
const resourceRoutes_1 = require("./routes/resourceRoutes");
const dashboardRoutes_1 = require("./routes/dashboardRoutes");
const authRoutes_1 = require("./routes/authRoutes");
const scheduleRoutes_1 = require("./routes/scheduleRoutes");
const doctorRoutes_1 = require("./routes/doctorRoutes");
const appointmentRoutes_1 = require("./routes/appointmentRoutes");
const resourceLoader_1 = require("./utils/resourceLoader");
const resourceRegistry_1 = require("./models/resourceRegistry");
dotenv_1.default.config();
const start = async () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: true,
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: "1mb" }));
    app.use((0, morgan_1.default)("dev"));
    const descriptors = await (0, resourceLoader_1.scanResourceFiles)();
    const resources = await (0, resourceRegistry_1.initResourceModels)(descriptors);
    app.use("/api/auth", (0, authRoutes_1.buildAuthRouter)());
    app.use("/api/dashboard", (0, dashboardRoutes_1.buildDashboardRouter)());
    app.use("/api/schedule", (0, scheduleRoutes_1.buildScheduleRouter)());
    app.use("/api/doctors", (0, doctorRoutes_1.buildDoctorRouter)());
    app.use("/api/appointments", (0, appointmentRoutes_1.buildAppointmentRouter)());
    app.use("/api", (0, resourceRoutes_1.buildResourceRouter)(resources));
    app.get("/", (_req, res) => res.json({ message: "HMS API is healthy", resources }));
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
