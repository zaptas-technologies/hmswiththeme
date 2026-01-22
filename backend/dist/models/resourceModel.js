"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelForResource = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cachedModels = {};
const getModelForResource = (resource) => {
    if (cachedModels[resource]) {
        return cachedModels[resource];
    }
    const schema = new mongoose_1.default.Schema({}, { strict: false, timestamps: true });
    cachedModels[resource] = mongoose_1.default.model(resource, schema, resource);
    return cachedModels[resource];
};
exports.getModelForResource = getModelForResource;
