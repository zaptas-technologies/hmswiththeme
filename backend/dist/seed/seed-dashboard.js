"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("../config/db");
const dashboardPatientModel_1 = require("../models/dashboardPatientModel");
const dashboardAppointmentModel_1 = require("../models/dashboardAppointmentModel");
const dashboardAvailabilityModel_1 = require("../models/dashboardAvailabilityModel");
dotenv_1.default.config();
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const toDateDaysFromNow = (daysFromNow, hour, minute) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, minute, 0, 0);
    return d;
};
const main = async () => {
    const doctorId = process.env.SEED_DOCTOR_ID || "demo-user";
    const patientsCount = Number(process.env.SEED_PATIENTS || 12);
    const apptsCount = Number(process.env.SEED_APPOINTMENTS || 80);
    await (0, db_1.connectDB)(process.env.MONGODB_URI || "");
    await Promise.all([
        dashboardAppointmentModel_1.DashboardAppointment.deleteMany({ doctorId }),
        dashboardPatientModel_1.DashboardPatient.deleteMany({ doctorId }),
        dashboardAvailabilityModel_1.DashboardAvailability.deleteMany({ doctorId }),
    ]);
    const patientNames = [
        "Alberto Ripley",
        "Susan Babin",
        "Carol Lam",
        "Marsha Noland",
        "John Elsass",
        "Irma Armstrong",
        "Andrew Billard",
        "Tanya McLean",
        "Devon Walsh",
        "Katherine Flores",
        "Miles Smith",
        "Noah Davis",
    ];
    const avatars = [
        "assets/img/profiles/avatar-06.jpg",
        "assets/img/profiles/avatar-12.jpg",
        "assets/img/profiles/avatar-08.jpg",
        "assets/img/profiles/avatar-22.jpg",
        "assets/img/profiles/avatar-25.jpg",
        "assets/img/profiles/avatar-17.jpg",
        "assets/img/doctors/doctor-01.jpg",
    ];
    const patients = await dashboardPatientModel_1.DashboardPatient.insertMany(Array.from({ length: patientsCount }).map((_, i) => ({
        doctorId,
        name: patientNames[i % patientNames.length],
        phone: `+1 ${randInt(200, 999)}${randInt(100, 999)} ${randInt(100, 999)}${randInt(10, 99)}`,
        avatar: avatars[i % avatars.length],
    })));
    const statuses = ["Schedule", "Checked in", "Checked Out", "Cancelled"];
    const modes = ["Online", "In-Person"];
    const now = new Date();
    const start = new Date(now);
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const randomDateBetween = (a, b) => {
        const t = randInt(a.getTime(), b.getTime());
        return new Date(t);
    };
    await dashboardAppointmentModel_1.DashboardAppointment.insertMany(Array.from({ length: apptsCount }).map((_, i) => {
        const patient = pick(patients);
        const dt = i < 5
            ? toDateDaysFromNow(i + 1, 9 + i, i % 2 === 0 ? 30 : 15)
            : randomDateBetween(start, now);
        const status = pick([...statuses]);
        const mode = pick([...modes]);
        const fee = randInt(150, 500);
        return {
            doctorId,
            patientId: patient._id,
            datetime: dt,
            mode,
            status,
            fee,
        };
    }));
    await dashboardAvailabilityModel_1.DashboardAvailability.insertMany([
        { doctorId, day: "Mon", window: "11:00 AM - 12:30 PM" },
        { doctorId, day: "Tue", window: "11:00 AM - 12:30 PM" },
        { doctorId, day: "Wed", window: "11:00 AM - 12:30 PM" },
        { doctorId, day: "Thu", window: "11:00 AM - 12:30 PM" },
        { doctorId, day: "Fri", window: "11:00 AM - 12:30 PM" },
        { doctorId, day: "Sat", window: "11:00 AM - 12:30 PM" },
        { doctorId, day: "Sun", window: null },
    ]);
    // eslint-disable-next-line no-console
    console.log(`✔ Seeded dashboard data for doctorId=${doctorId} (patients=${patientsCount}, appointments=${apptsCount})`);
};
main()
    .then(() => mongoose_1.default.disconnect())
    .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    mongoose_1.default.disconnect();
    process.exit(1);
});
