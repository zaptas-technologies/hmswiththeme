import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User, type UserRole } from "../models/userModel";

dotenv.config();

const main = async () => {
  await connectDB(process.env.MONGODB_URI || "");

  // Drop problematic index if it exists
  try {
    const db = mongoose.connection.db;
    const collection = db?.collection("users");
    if (collection) {
      const indexes = await collection.indexes();
      const idIndex = indexes.find((idx: any) => idx.name === "id_1");
      if (idIndex) {
        await collection.dropIndex("id_1");
        // eslint-disable-next-line no-console
        console.log("✔ Dropped problematic 'id_1' index");
      }
    }
  } catch (err: any) {
    // Index might not exist, that's okay
    if (err.code !== 27) {
      // eslint-disable-next-line no-console
      console.log("⚠ Could not drop index (may not exist):", err.message);
    }
  }

  const users: Array<{
    email: string;
    password: string;
    name: string;
    phone: string;
    role: UserRole;
    specialization?: string;
    avatar?: string;
  }> = [
    // Doctors
    {
      email: "doctor@preclinic.com",
      password: "password123",
      name: "Dr. Sarah Johnson",
      phone: "+1 234 567 8901",
      role: "doctor",
      specialization: "Cardiology",
      avatar: "assets/img/doctors/doctor-01.jpg",
    },
    {
      email: "doctor2@preclinic.com",
      password: "password123",
      name: "Dr. Michael Chen",
      phone: "+1 234 567 8902",
      role: "doctor",
      specialization: "Pediatrics",
      avatar: "assets/img/doctors/doctor-02.jpg",
    },
    // Receptionist
    {
      email: "receptionist@preclinic.com",
      password: "password123",
      name: "Emma Thompson",
      phone: "+1 234 567 8903",
      role: "receptionist",
    },
    {
      email: "receptionist2@preclinic.com",
      password: "password123",
      name: "James Wilson",
      phone: "+1 234 567 8904",
      role: "receptionist",
    },
    // Admin
    {
      email: "admin@preclinic.com",
      password: "password123",
      name: "Robert Martinez",
      phone: "+1 234 567 8905",
      role: "admin",
    },
    {
      email: "admin2@preclinic.com",
      password: "password123",
      name: "Lisa Anderson",
      phone: "+1 234 567 8906",
      role: "admin",
    },
    // Super Admin
    {
      email: "superadmin@preclinic.com",
      password: "password123",
      name: "David Brown",
      phone: "+1 234 567 8907",
      role: "super_admin",
    },
    // Hospital Admin
    {
      email: "hospitaladmin@preclinic.com",
      password: "password123",
      name: "Jennifer Davis",
      phone: "+1 234 567 8908",
      role: "hospital_admin",
    },
    // Nurse
    {
      email: "nurse@preclinic.com",
      password: "password123",
      name: "Patricia Garcia",
      phone: "+1 234 567 8909",
      role: "nurse",
    },
    {
      email: "nurse2@preclinic.com",
      password: "password123",
      name: "Christopher Lee",
      phone: "+1 234 567 8910",
      role: "nurse",
    },
    // Patient
    {
      email: "patient@preclinic.com",
      password: "password123",
      name: "Maria Rodriguez",
      phone: "+1 234 567 8911",
      role: "patient",
    },
    {
      email: "patient2@preclinic.com",
      password: "password123",
      name: "Daniel White",
      phone: "+1 234 567 8912",
      role: "patient",
    },
    // Pharmacist
    {
      email: "pharmacist@preclinic.com",
      password: "password123",
      name: "Susan Taylor",
      phone: "+1 234 567 8913",
      role: "pharmacist",
    },
    // Lab Technician
    {
      email: "labtech@preclinic.com",
      password: "password123",
      name: "Kevin Moore",
      phone: "+1 234 567 8914",
      role: "lab_technician",
    },
    // Accountant
    {
      email: "accountant@preclinic.com",
      password: "password123",
      name: "Nancy Jackson",
      phone: "+1 234 567 8915",
      role: "accountant",
    },
    // Demo user (doctor for easy testing)
    {
      email: "demo@preclinic.com",
      password: "password",
      name: "Dr. Demo User",
      phone: "+1 234 567 8900",
      role: "doctor",
      specialization: "General Practice",
      avatar: "assets/img/doctors/doctor-01.jpg",
    },
  ];

  const createdUsers: Array<{ id: string; email: string; password: string; role: UserRole }> = [];

  for (const userData of users) {
    const existing = await User.findOne({ email: userData.email });
    if (!existing) {
      const user = await User.create(userData);
      createdUsers.push({
        id: user._id.toString(),
        email: userData.email,
        password: userData.password,
        role: userData.role,
      });
      // eslint-disable-next-line no-console
      console.log(`✔ Created ${userData.role}: ${userData.email} (ID: ${user._id})`);
    } else {
      createdUsers.push({
        id: existing._id.toString(),
        email: userData.email,
        password: userData.password,
        role: existing.role,
      });
      // eslint-disable-next-line no-console
      console.log(`⚠ User already exists: ${userData.email} (ID: ${existing._id})`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`\n✔ Seeded ${users.length} users across all roles`);
  // eslint-disable-next-line no-console
  console.log("\n📋 Login credentials by role:");
  
  const usersByRole = createdUsers.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = [];
    }
    acc[user.role].push(user);
    return acc;
  }, {} as Record<UserRole, typeof createdUsers>);

  Object.entries(usersByRole).forEach(([role, roleUsers]) => {
    // eslint-disable-next-line no-console
    console.log(`\n${role.toUpperCase()}:`);
    roleUsers.forEach((u) => {
      // eslint-disable-next-line no-console
      console.log(`  Email: ${u.email} | Password: ${u.password}`);
    });
  });

  // eslint-disable-next-line no-console
  console.log("\n💡 All users can login with their credentials and will be redirected to their role-specific dashboard.\n");

  await mongoose.disconnect();
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to seed users", err);
  process.exit(1);
});
