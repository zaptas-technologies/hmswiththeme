import mongoose from "mongoose";

export const connectDB = async (uri: string) => {
  if (!uri) {
    throw new Error("Missing Mongo connection string. Set MONGODB_URI in .env");
  }

  const connection = await mongoose.connect(uri);

  // Safety: drop legacy unique index on `id` that breaks inserts with `id: null`
  // Seen as: MongoServerError E11000 ... consultations index: id_1 dup key: { id: null }
  // This index is not used by the app (we use MongoDB _id). If it doesn't exist, ignore.
  try {
    const db = mongoose.connection.db;
    const collection = db?.collection("consultations");
    if (collection) {
      const indexes = await collection.indexes();
      const idIndex = indexes.find((idx: any) => idx.name === "id_1");
      if (idIndex) {
        await collection.dropIndex("id_1");
        // eslint-disable-next-line no-console
        console.log("✔ Dropped problematic 'consultations.id_1' index");
      }
    }
  } catch (err: any) {
    // Index might not exist, that's okay
    if (err?.code !== 27) {
      // eslint-disable-next-line no-console
      console.log("⚠ Could not drop consultations id_1 index (may not exist):", err?.message || err);
    }
  }

  return connection;
};
