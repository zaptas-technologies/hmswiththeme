import mongoose from "mongoose";
import { ResourceDescriptor } from "../utils/resourceLoader";
import { getSchemaForResource, schemaMap } from "./schemas";

type ResourceMeta = {
  descriptor: ResourceDescriptor;
  model: mongoose.Model<any>;
};

const resources: Record<string, ResourceMeta> = {};

export const initResourceModels = async (
  descriptors: ResourceDescriptor[]
): Promise<string[]> => {
  for (const descriptor of descriptors) {
    if (resources[descriptor.name]) continue;

    const schema = getSchemaForResource(descriptor.name);
    const model = mongoose.model(descriptor.name, schema, descriptor.name);
    
    resources[descriptor.name] = {
      descriptor,
      model,
    };

    // Register plural/singular aliases if they exist in schema map
    // e.g., if "location" is discovered, also register "locations" if it uses the same schema
    for (const [resourceName, resourceSchema] of Object.entries(schemaMap)) {
      if (resourceSchema === schema && resourceName !== descriptor.name && !resources[resourceName]) {
        // Reuse existing model if it exists, otherwise create new one
        let aliasModel: mongoose.Model<any>;
        try {
          aliasModel = mongoose.model(resourceName);
        } catch {
          aliasModel = mongoose.model(resourceName, schema, resourceName);
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

export const getResourceModel = (resource: string) => {
  const meta = resources[resource];
  if (!meta) throw new Error(`Model not initialized for resource ${resource}`);
  return meta.model;
};
