import { Schema } from "mongoose";

export const flexibleSchema = () =>
  new Schema({}, { strict: false, timestamps: true });

