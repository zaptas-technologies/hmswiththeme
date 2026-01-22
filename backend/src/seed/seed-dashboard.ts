import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { DashboardPatient } from "../models/dashboardPatientModel";
import { DashboardAppointment } from "../models/dashboardAppointmentModel";
import { DashboardAvailability } from "../models/dashboardAvailabilityModel";

dotenv.config();

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T,>(arr: T[]) => arr[randInt(0, arr.length - 1)];

const toDateDaysFromNow = (daysFromNow: number, hour: number, minute: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const main = async () => {
  const doctorId = process.env.SEED_DOCTOR_ID || "demo-user";
  const patientsCount = Number(process.env.SEED_PATIENTS || 12);
  const apptsCount = Number(process.env.SEED_APPOINTMENTS || 80);

  await connectDB(process.env.MONGODB_URI || "");

  await Promise.all([
    DashboardAppointment.deleteMany({ doctorId }),
    DashboardPatient.deleteMany({ doctorId }),
    DashboardAvailability.deleteMany({ doctorId }),
  ]);

  const patientNames = [
    "Alberto Ripley",
    "Susan Babin",
    "Carol Lam",
    "Marsha Noland",
    "John Elsass",
    "Irma Armstrong",
    "Andrew Billard",
    "Tanya McLean",
    "Devon Walsh",
    "Katherine Flores",
    "Miles Smith",
    "Noah Davis",
  ];

  const avatars = [
    "assets/img/profiles/avatar-06.jpg",
    "assets/img/profiles/avatar-12.jpg",
    "assets/img/profiles/avatar-08.jpg",
    "assets/img/profiles/avatar-22.jpg",
    "assets/img/profiles/avatar-25.jpg",
    "assets/img/profiles/avatar-17.jpg",
    "assets/img/doctors/doctor-01.jpg",
  ];

  const patients = await DashboardPatient.insertMany(
    Array.from({ length: patientsCount }).map((_, i) => ({
      doctorId,
      name: patientNames[i % patientNames.length],
      phone: `+1 ${randInt(200, 999)}${randInt(100, 999)} ${randInt(100, 999)}${randInt(10, 99)}`,
      avatar: avatars[i % avatars.length],
    }))
  );

  const statuses = ["Schedule", "Checked in", "Checked Out", "Cancelled"] as const;
  const modes = ["Online", "In-Person"] as const;

  const now = new Date();
  const start = new Date(now);
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const randomDateBetween = (a: Date, b: Date) => {
    const t = randInt(a.getTime(), b.getTime());
    return new Date(t);
  };

  await DashboardAppointment.insertMany(
    Array.from({ length: apptsCount }).map((_, i) => {
      const patient = pick(patients);
      const dt =
        i < 5
          ? toDateDaysFromNow(i + 1, 9 + i, i % 2 === 0 ? 30 : 15)
          : randomDateBetween(start, now);
      const status = pick([...statuses]);
      const mode = pick([...modes]);
      const fee = randInt(150, 500);
      return {
        doctorId,
        patientId: patient._id,
        datetime: dt,
        mode,
        status,
        fee,
      };
    })
  );

  await DashboardAvailability.insertMany([
    { doctorId, day: "Mon", window: "11:00 AM - 12:30 PM" },
    { doctorId, day: "Tue", window: "11:00 AM - 12:30 PM" },
    { doctorId, day: "Wed", window: "11:00 AM - 12:30 PM" },
    { doctorId, day: "Thu", window: "11:00 AM - 12:30 PM" },
    { doctorId, day: "Fri", window: "11:00 AM - 12:30 PM" },
    { doctorId, day: "Sat", window: "11:00 AM - 12:30 PM" },
    { doctorId, day: "Sun", window: null },
  ]);

  // eslint-disable-next-line no-console
  console.log(
    `✔ Seeded dashboard data for doctorId=${doctorId} (patients=${patientsCount}, appointments=${apptsCount})`
  );
};

main()
  .then(() => mongoose.disconnect())
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    mongoose.disconnect();
    process.exit(1);
  });

