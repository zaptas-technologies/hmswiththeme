import mongoose, { Schema } from "mongoose";

const detectType = (value: unknown) => {
  if (value === null || value === undefined) return Schema.Types.Mixed;
  if (Array.isArray(value)) return [Schema.Types.Mixed];
  switch (typeof value) {
    case "string":
      return String;
    case "number":
      return Number;
    case "boolean":
      return Boolean;
    case "object":
      return Schema.Types.Mixed;
    default:
      return Schema.Types.Mixed;
  }
};

export const buildSchemaFromSample = (sample: Record<string, unknown>) => {
  const definition: Record<string, any> = {};
  Object.entries(sample || {}).forEach(([key, value]) => {
    definition[key] = { type: detectType(value), required: false };
  });

  // always keep a legacy id if present
  if (!definition.id) {
    definition.id = { type: String, required: false };
  }

  return new mongoose.Schema(definition, { strict: true, timestamps: true });
};
