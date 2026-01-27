"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationSchema = exports.StateSchema = exports.CitySchema = exports.CountrySchema = void 0;
const mongoose_1 = require("mongoose");
exports.CountrySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    countryName: { type: String },
    countryId: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    countryCode: { type: String },
}, { timestamps: true, strict: false });
exports.CitySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    cityName: { type: String },
    cityId: { type: String },
    stateName: { type: String },
    stateId: { type: String },
    countryName: { type: String },
    countryId: { type: String },
    countryCode: { type: String },
}, { timestamps: true, strict: false });
exports.StateSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    stateName: { type: String },
    stateId: { type: String },
    countryName: { type: String },
    countryId: { type: String },
    countryCode: { type: String },
}, { timestamps: true, strict: false });
exports.LocationSchema = new mongoose_1.Schema({
    Location: { type: String, required: true },
    Address: { type: String },
    Phone: { type: String },
    Email: { type: String },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
}, { timestamps: true, strict: false });
