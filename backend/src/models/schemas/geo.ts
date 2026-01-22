import { Schema } from "mongoose";

export const CountrySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    countryName: { type: String },
    countryId: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    countryCode: { type: String },
  },
  { timestamps: true, strict: false }
);

export const CitySchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    cityName: { type: String },
    cityId: { type: String },
    stateName: { type: String },
    stateId: { type: String },
    countryName: { type: String },
    countryId: { type: String },
    countryCode: { type: String },
  },
  { timestamps: true, strict: false }
);

export const StateSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    stateName: { type: String },
    stateId: { type: String },
    countryName: { type: String },
    countryId: { type: String },
    countryCode: { type: String },
  },
  { timestamps: true, strict: false }
);

export const LocationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    Location: { type: String, required: true },
    Address: { type: String },
    Phone: { type: String },
    Email: { type: String },
    Status: { type: String, enum: ["Active", "Inactive"], required: true },
  },
  { timestamps: true, strict: false }
);

