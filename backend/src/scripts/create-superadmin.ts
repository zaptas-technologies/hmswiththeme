import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../models/userModel";

dotenv.config();

const main = async () => {
  try {
    await connectDB(process.env.MONGODB_URI || "");
    // eslint-disable-next-line no-console
    console.log("✔ Connected to MongoDB");

    const email = "superadmin@preclinic.com";
    const password = "123456";
    const name = "Super Admin";
    const phone = "+1 234 567 8907";
    const role = "super_admin";

    // Check if superadmin already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      // Update password if user exists
      existingUser.password = password;
      await existingUser.save();
      // eslint-disable-next-line no-console
      console.log(`✔ Updated existing superadmin user: ${email}`);
      // eslint-disable-next-line no-console
      console.log(`   Email: ${email}`);
      // eslint-disable-next-line no-console
      console.log(`   Password: ${password}`);
      // eslint-disable-next-line no-console
      console.log(`   Role: ${role}`);
    } else {
      // Create new superadmin user
      const user = await User.create({
        email: email.toLowerCase(),
        password,
        name,
        phone,
        role,
      });
      // eslint-disable-next-line no-console
      console.log(`✔ Created superadmin user: ${email}`);
      // eslint-disable-next-line no-console
      console.log(`   Email: ${email}`);
      // eslint-disable-next-line no-console
      console.log(`   Password: ${password}`);
      // eslint-disable-next-line no-console
      console.log(`   Role: ${role}`);
      // eslint-disable-next-line no-console
      console.log(`   ID: ${user._id}`);
    }

    // eslint-disable-next-line no-console
    console.log("\n✔ Superadmin user ready!");
    // eslint-disable-next-line no-console
    console.log("   You can now login with:");
    // eslint-disable-next-line no-console
    console.log(`   Email: ${email}`);
    // eslint-disable-next-line no-console
    console.log(`   Password: ${password}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("❌ Failed to create superadmin user:", err);
    process.exit(1);
  }
};

main();
