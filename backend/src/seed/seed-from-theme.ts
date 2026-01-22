import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import {
  loadDataset,
  scanResourceFiles,
  ResourceDescriptor,
} from "../utils/resourceLoader";
import { initResourceModels, getResourceModel } from "../models/resourceRegistry";

dotenv.config();

const seedResource = async (descriptor: ResourceDescriptor) => {
  const Model = getResourceModel(descriptor.name);
  const dataset = await loadDataset(descriptor);

  await Model.deleteMany({});
  await Model.insertMany(dataset);
  // eslint-disable-next-line no-console
  console.log(
    `✔ Seeded ${descriptor.name} (${dataset.length} records) from ${descriptor.filePath}`
  );
};

const main = async () => {
  await connectDB(process.env.MONGODB_URI || "");

  const descriptors = await scanResourceFiles();
  await initResourceModels(descriptors);
  for (const descriptor of descriptors) {
    await seedResource(descriptor);
  }
};

main()
  .then(() => {
    mongoose.disconnect();
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    mongoose.disconnect();
    process.exit(1);
  });
