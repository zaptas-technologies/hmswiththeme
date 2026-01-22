import mongoose from "mongoose";

export const connectDB = async (uri: string) => {
  if (!uri) {
    throw new Error("Missing Mongo connection string. Set MONGODB_URI in .env");
  }

  const connection = await mongoose.connect(uri);
  return connection;
};
