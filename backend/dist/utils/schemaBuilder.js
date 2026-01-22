"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSchemaFromSample = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const detectType = (value) => {
    if (value === null || value === undefined)
        return mongoose_1.Schema.Types.Mixed;
    if (Array.isArray(value))
        return [mongoose_1.Schema.Types.Mixed];
    switch (typeof value) {
        case "string":
            return String;
        case "number":
            return Number;
        case "boolean":
            return Boolean;
        case "object":
            return mongoose_1.Schema.Types.Mixed;
        default:
            return mongoose_1.Schema.Types.Mixed;
    }
};
const buildSchemaFromSample = (sample) => {
    const definition = {};
    Object.entries(sample || {}).forEach(([key, value]) => {
        definition[key] = { type: detectType(value), required: false };
    });
    // always keep a legacy id if present
    if (!definition.id) {
        definition.id = { type: String, required: false };
    }
    return new mongoose_1.default.Schema(definition, { strict: true, timestamps: true });
};
exports.buildSchemaFromSample = buildSchemaFromSample;
