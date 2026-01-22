"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResourceModel = exports.initResourceModels = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const schemas_1 = require("./schemas");
const resources = {};
const initResourceModels = async (descriptors) => {
    for (const descriptor of descriptors) {
        if (resources[descriptor.name])
            continue;
        const schema = (0, schemas_1.getSchemaForResource)(descriptor.name);
        const model = mongoose_1.default.model(descriptor.name, schema, descriptor.name);
        resources[descriptor.name] = {
            descriptor,
            model,
        };
        // Register plural/singular aliases if they exist in schema map
        // e.g., if "location" is discovered, also register "locations" if it uses the same schema
        for (const [resourceName, resourceSchema] of Object.entries(schemas_1.schemaMap)) {
            if (resourceSchema === schema && resourceName !== descriptor.name && !resources[resourceName]) {
                // Reuse existing model if it exists, otherwise create new one
                let aliasModel;
                try {
                    aliasModel = mongoose_1.default.model(resourceName);
                }
                catch {
                    aliasModel = mongoose_1.default.model(resourceName, schema, resourceName);
                }
                resources[resourceName] = {
                    descriptor: { ...descriptor, name: resourceName },
                    model: aliasModel,
                };
            }
        }
    }
    return Object.keys(resources);
};
exports.initResourceModels = initResourceModels;
const getResourceModel = (resource) => {
    const meta = resources[resource];
    if (!meta)
        throw new Error(`Model not initialized for resource ${resource}`);
    return meta.model;
};
exports.getResourceModel = getResourceModel;
