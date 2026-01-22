"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flexibleSchema = void 0;
const mongoose_1 = require("mongoose");
const flexibleSchema = () => new mongoose_1.Schema({}, { strict: false, timestamps: true });
exports.flexibleSchema = flexibleSchema;
