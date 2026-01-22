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
    return connection;
};
exports.connectDB = connectDB;
