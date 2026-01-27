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
  hospitalId?: mongoose.Types.ObjectId; // For HOSPITAL_ADMIN role
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true },
    phone: { type: String },
    role: { 
      type: String, 
      required: true,
      enum: ["doctor", "receptionist", "admin", "super_admin", "hospital_admin", "nurse", "patient", "pharmacist", "lab_technician", "accountant"],
      default: "doctor",
      index: true,
    },
    specialization: { type: String },
    avatar: { type: String },
    hospitalId: { type: Schema.Types.ObjectId, index: true },
  },
  { 
    timestamps: true,
    id: false,
  }
);

// Compound indexes for common queries
userSchema.index({ role: 1, hospitalId: 1 });
userSchema.index({ email: 1, role: 1 });

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
