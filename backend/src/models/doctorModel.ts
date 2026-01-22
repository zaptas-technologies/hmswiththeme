import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface DoctorDoc extends Document {
  email: string;
  password: string;
  name: string;
  phone?: string;
  specialization?: string;
  avatar?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const doctorSchema = new Schema<DoctorDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true },
    phone: { type: String },
    specialization: { type: String },
    avatar: { type: String },
  },
  { 
    timestamps: true,
    id: false, // Disable virtual id field to avoid index conflicts
  }
);

// Hash password before saving
doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
doctorSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Doctor = mongoose.model<DoctorDoc>("Doctor", doctorSchema);
