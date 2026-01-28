"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async (uri) => {
    if (!uri) {
        throw new Error("Missing Mongo connection string. Set MONGODB_URI in .env");
    }
    const connection = await mongoose_1.default.connect(uri);
    // Safety: drop legacy unique indexes that break inserts with null values
    // Seen as: MongoServerError E11000 ... consultations index: id_1 dup key: { id: null }
    //          MongoServerError E11000 ... consultations index: Consultation_ID_1 dup key: { Consultation_ID: null }
    // These indexes are not used by the app (we use MongoDB _id). If they don't exist, ignore.
    try {
        const db = mongoose_1.default.connection.db;
        const collection = db?.collection("consultations");
        if (collection) {
            const indexes = await collection.indexes();
            // Drop id_1 index if it exists
            const idIndex = indexes.find((idx) => idx.name === "id_1");
            if (idIndex) {
                await collection.dropIndex("id_1");
                // eslint-disable-next-line no-console
                console.log("✔ Dropped problematic 'consultations.id_1' index");
            }
            // Drop Consultation_ID_1 unique index if it exists (we removed Consultation_ID from schema)
            const consultationIdIndex = indexes.find((idx) => idx.name === "Consultation_ID_1");
            if (consultationIdIndex) {
                await collection.dropIndex("Consultation_ID_1");
                // eslint-disable-next-line no-console
                console.log("✔ Dropped problematic 'consultations.Consultation_ID_1' index");
            }
        }
    }
    catch (err) {
        // Index might not exist, that's okay
        if (err?.code !== 27) {
            // eslint-disable-next-line no-console
            console.log("⚠ Could not drop consultations indexes (may not exist):", err?.message || err);
        }
    }
    return connection;
};
exports.connectDB = connectDB;
