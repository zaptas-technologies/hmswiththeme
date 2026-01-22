"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("../config/db");
const resourceLoader_1 = require("../utils/resourceLoader");
const resourceRegistry_1 = require("../models/resourceRegistry");
dotenv_1.default.config();
const seedResource = async (descriptor) => {
    const Model = (0, resourceRegistry_1.getResourceModel)(descriptor.name);
    const dataset = await (0, resourceLoader_1.loadDataset)(descriptor);
    await Model.deleteMany({});
    await Model.insertMany(dataset);
    // eslint-disable-next-line no-console
    console.log(`✔ Seeded ${descriptor.name} (${dataset.length} records) from ${descriptor.filePath}`);
};
const main = async () => {
    await (0, db_1.connectDB)(process.env.MONGODB_URI || "");
    const descriptors = await (0, resourceLoader_1.scanResourceFiles)();
    await (0, resourceRegistry_1.initResourceModels)(descriptors);
    for (const descriptor of descriptors) {
        await seedResource(descriptor);
    }
};
main()
    .then(() => {
    mongoose_1.default.disconnect();
})
    .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    mongoose_1.default.disconnect();
    process.exit(1);
});
