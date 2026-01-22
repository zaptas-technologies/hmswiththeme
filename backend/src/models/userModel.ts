import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = 
  | "doctor" 
  | "receptionist" 
  | "admin" 
  | "super_admin" 
  | "hospital_admin"
  | "nurse"
  | "patient"
  | "pharmacist"
  | "lab_technician"
  | "accountant";

export interface UserDoc extends Document {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  specialization?: string; // For doctors
  avatar?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true },
    phone: { type: String },
    role: { 
      type: String, 
      required: true,
      enum: ["doctor", "receptionist", "admin", "super_admin", "hospital_admin", "nurse", "patient", "pharmacist", "lab_technician", "accountant"],
      default: "doctor"
    },
    specialization: { type: String }, // For doctors
    avatar: { type: String },
  },
  { 
    timestamps: true,
    id: false, // Disable virtual id field to avoid index conflicts
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<UserDoc>("User", userSchema);
