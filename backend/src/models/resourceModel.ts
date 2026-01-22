import mongoose, { Model } from "mongoose";

const cachedModels: Record<string, Model<any>> = {};

export const getModelForResource = (resource: string) => {
  if (cachedModels[resource]) {
    return cachedModels[resource];
  }

  const schema = new mongoose.Schema({}, { strict: false, timestamps: true });
  cachedModels[resource] = mongoose.model(resource, schema, resource);
  return cachedModels[resource];
};
