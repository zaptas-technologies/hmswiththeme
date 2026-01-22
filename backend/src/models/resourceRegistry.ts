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

    // Check if there's a plural/singular version in schemaMap
    // e.g., if "patient" is discovered, check for "patients" in schemaMap
    let schema = getSchemaForResource(descriptor.name);
    let collectionName = descriptor.name;
    
    // If the descriptor name isn't in schemaMap, check for plural/singular variants
    if (!schemaMap[descriptor.name]) {
      // Check for plural version (e.g., "patient" -> "patients")
      const pluralName = `${descriptor.name}s`;
      if (schemaMap[pluralName]) {
        schema = schemaMap[pluralName];
        collectionName = pluralName;
      } else {
        // Check for singular version (e.g., "patients" -> "patient")
        const singularName = descriptor.name.replace(/s$/, "");
        if (schemaMap[singularName]) {
          schema = schemaMap[singularName];
        }
      }
    }

    const model = mongoose.model(descriptor.name, schema, collectionName);
    
    resources[descriptor.name] = {
      descriptor,
      model,
    };

    // If we used a different collection name (e.g., "patients" for "patient"), 
    // also register the collection name as a resource
    if (collectionName !== descriptor.name && schemaMap[collectionName] && !resources[collectionName]) {
      let aliasModel: mongoose.Model<any>;
      try {
        aliasModel = mongoose.model(collectionName);
      } catch {
        aliasModel = mongoose.model(collectionName, schema, collectionName);
      }
      resources[collectionName] = {
        descriptor: { ...descriptor, name: collectionName },
        model: aliasModel,
      };
    }

    // Register plural/singular aliases if they exist in schema map
    // e.g., if "location" is discovered, also register "locations" if it uses the same schema
    for (const [resourceName, resourceSchema] of Object.entries(schemaMap)) {
      if (resourceSchema === schema && resourceName !== descriptor.name && resourceName !== collectionName && !resources[resourceName]) {
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
