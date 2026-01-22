"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDataset = exports.scanResourceFiles = exports.FRONT_JSON_DIR = void 0;
const path_1 = __importDefault(require("path"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const resourceName_1 = require("./resourceName");
exports.FRONT_JSON_DIR = path_1.default.resolve(__dirname, "../../../src/core/json");
const scanResourceFiles = async () => {
    const files = await (0, fast_glob_1.default)(["*.ts", "*.tsx"], {
        cwd: exports.FRONT_JSON_DIR,
        absolute: true,
    });
    return files.map((filePath) => ({
        filePath,
        name: (0, resourceName_1.deriveResourceName)(filePath),
    }));
};
exports.scanResourceFiles = scanResourceFiles;
const loadDataset = async (descriptor) => {
    // Use CJS require; ts-node/register/transpile-only will transpile TS/TSX on the fly.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(descriptor.filePath);
    const firstExport = Object.values(mod)[0];
    if (!Array.isArray(firstExport)) {
        throw new Error(`Expected array export in ${descriptor.filePath}, got ${typeof firstExport}`);
    }
    return firstExport;
};
exports.loadDataset = loadDataset;
