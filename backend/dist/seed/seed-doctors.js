"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("../config/db");
const doctorModel_1 = require("../models/doctorModel");
dotenv_1.default.config();
const main = async () => {
    await (0, db_1.connectDB)(process.env.MONGODB_URI || "");
    // Drop problematic index if it exists
    try {
        const db = mongoose_1.default.connection.db;
        const collection = db?.collection("doctors");
        if (collection) {
            const indexes = await collection.indexes();
            const idIndex = indexes.find((idx) => idx.name === "id_1");
            if (idIndex) {
                await collection.dropIndex("id_1");
                // eslint-disable-next-line no-console
                console.log("✔ Dropped problematic 'id_1' index");
            }
        }
    }
    catch (err) {
        // Index might not exist, that's okay
        if (err.code !== 27) {
            // eslint-disable-next-line no-console
            console.log("⚠ Could not drop index (may not exist):", err.message);
        }
    }
    const doctors = [
        {
            email: "doctor1@preclinic.com",
            password: "password123",
            name: "Dr. Sarah Johnson",
            phone: "+1 234 567 8901",
            specialization: "Cardiology",
            avatar: "assets/img/doctors/doctor-01.jpg",
        },
        {
            email: "doctor2@preclinic.com",
            password: "password123",
            name: "Dr. Michael Chen",
            phone: "+1 234 567 8902",
            specialization: "Pediatrics",
            avatar: "assets/img/doctors/doctor-02.jpg",
        },
        {
            email: "doctor3@preclinic.com",
            password: "password123",
            name: "Dr. Emily Rodriguez",
            phone: "+1 234 567 8903",
            specialization: "Dermatology",
            avatar: "assets/img/doctors/doctor-03.jpg",
        },
        {
            email: "demo@preclinic.com",
            password: "password",
            name: "Dr. Demo User",
            phone: "+1 234 567 8900",
            specialization: "General Practice",
            avatar: "assets/img/doctors/doctor-01.jpg",
        },
    ];
    const createdDoctors = [];
    for (const doctorData of doctors) {
        const existing = await doctorModel_1.Doctor.findOne({ email: doctorData.email });
        if (!existing) {
            const doctor = await doctorModel_1.Doctor.create(doctorData);
            createdDoctors.push({
                id: doctor._id.toString(),
                email: doctorData.email,
                password: doctorData.password,
            });
            // eslint-disable-next-line no-console
            console.log(`✔ Created doctor: ${doctorData.email} (ID: ${doctor._id})`);
        }
        else {
            createdDoctors.push({
                id: existing._id.toString(),
                email: doctorData.email,
                password: doctorData.password,
            });
            // eslint-disable-next-line no-console
            console.log(`⚠ Doctor already exists: ${doctorData.email} (ID: ${existing._id})`);
        }
    }
    // eslint-disable-next-line no-console
    console.log(`\n✔ Seeded ${doctors.length} doctors`);
    // eslint-disable-next-line no-console
    console.log("\n📋 Login credentials:");
    createdDoctors.forEach((d) => {
        // eslint-disable-next-line no-console
        console.log(`  Email: ${d.email} | Password: ${d.password} | Doctor ID: ${d.id}`);
    });
    // eslint-disable-next-line no-console
    console.log("\n💡 Next step: Run 'npm run seed:dashboard' to seed dashboard data for these doctors.");
    // eslint-disable-next-line no-console
    console.log("   Or set SEED_DOCTOR_ID=<doctor-id> and run seed:dashboard for each doctor.\n");
    await mongoose_1.default.disconnect();
};
main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to seed doctors", err);
    process.exit(1);
});
