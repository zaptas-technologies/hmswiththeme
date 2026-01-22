"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveResourceName = void 0;
const path_1 = __importDefault(require("path"));
const stripSuffix = (value, suffix) => value.replace(suffix, "");
const deriveResourceName = (filePath) => {
    const base = path_1.default.basename(filePath).replace(/\.[tj]sx?$/i, "");
    const normalized = stripSuffix(stripSuffix(stripSuffix(base, /Data$/i), /Report$/i), /List$/i);
    return normalized.toLowerCase();
};
exports.deriveResourceName = deriveResourceName;
