/**
 * Seed script: Indian hospitals, hospital admins, doctors, leaves, schedules,
 * GRN, appointments (70% Scheduled), consultations, pharmacy dispense.
 * Run once: npm run seed-dummy-data (requires MONGODB_URI in .env).
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../models/userModel";
import { Hospital } from "../models/hospitalModel";
import { Doctor } from "../models/doctorModel";
import { DoctorLeave } from "../models/doctorLeaveModel";
import { DoctorSchedule } from "../models/doctorScheduleModel";
import { GRN } from "../models/grnModel";
import { Inventory } from "../models/inventoryModel";
import { Patient } from "../models/patientModel";
import { Appointment } from "../models/appointmentModel";
import { Consultation } from "../models/consultationModel";
import { PharmacyDispense } from "../models/pharmacyDispenseModel";

dotenv.config();

const DEFAULT_PASSWORD = "123456";

// ---- Helpers ----
function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Generate 15-min slots between fromTime and toTime (e.g. "09:00", "13:00")
function slotTimes(fromTime: string, toTime: number): string[] {
  const [h, m] = fromTime.split(":").map(Number);
  let minutes = h * 60 + m;
  const slots: string[] = [];
  while (minutes < toTime) {
    const hh = Math.floor(minutes / 60);
    const mm = minutes % 60;
    slots.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
    minutes += 15;
  }
  return slots;
}

async function main() {
  await connectDB(process.env.MONGODB_URI || "");
  // eslint-disable-next-line no-console
  console.log("✔ Connected to MongoDB");

  // ---- 1) Super admin ----
  let superAdmin = await User.findOne({ role: "super_admin" });
  if (!superAdmin) {
    superAdmin = await User.create({
      email: "superadmin@preclinic.com",
      password: DEFAULT_PASSWORD,
      name: "Super Admin",
      phone: "+91 98765 43210",
      role: "super_admin",
    });
    // eslint-disable-next-line no-console
    console.log("✔ Created super_admin user");
  } else {
    // eslint-disable-next-line no-console
    console.log("✔ Using existing super_admin");
  }

  // ---- 2) Two Indian hospitals ----
  const hospitalPayloads = [
    {
      name: "Apollo Multispeciality Hospital",
      address: "Sector 5, Beliaghata",
      city: "Kolkata",
      state: "West Bengal",
      phone: "+91 33 2320 3040",
      email: "info@apollokolkata.in",
      status: "Active" as const,
    },
    {
      name: "Fortis Memorial Research Institute",
      address: "Sector 44, Gurugram",
      city: "Gurugram",
      state: "Haryana",
      phone: "+91 124 496 5000",
      email: "contact@fortisgmr.in",
      status: "Active" as const,
    },
  ];

  const hospitals: mongoose.Document[] = [];
  for (const payload of hospitalPayloads) {
    const existing = await Hospital.findOne({ email: payload.email });
    if (existing) {
      hospitals.push(existing);
      // eslint-disable-next-line no-console
      console.log(`✔ Using existing hospital: ${payload.name}`);
    } else {
      const h = await Hospital.create(payload);
      hospitals.push(h);
      // eslint-disable-next-line no-console
      console.log(`✔ Created hospital: ${payload.name}`);
    }
  }

  const hospitalIds = hospitals.map((h) => h._id as mongoose.Types.ObjectId);

  // ---- 3) Hospital admin users (one per hospital) ----
  const hospitalAdminEmails = ["hospitaladmin1@apollo.in", "hospitaladmin2@fortis.in"];
  const hospitalAdmins: mongoose.Document[] = [];
  for (let i = 0; i < hospitals.length; i++) {
    const email = hospitalAdminEmails[i];
    let admin = await User.findOne({ email });
    if (!admin) {
      admin = await User.create({
        email,
        password: DEFAULT_PASSWORD,
        name: i === 0 ? "Apollo Hospital Admin" : "Fortis Hospital Admin",
        phone: "+91 98765 0000" + (i + 1),
        role: "hospital_admin",
        hospitalId: hospitalIds[i],
      });
      // eslint-disable-next-line no-console
      console.log(`✔ Created hospital_admin: ${email}`);
    }
    hospitalAdmins.push(admin);
    await Hospital.findByIdAndUpdate(hospitalIds[i], { hospitalAdmin: admin._id });
  }

  // ---- 3b) Pharmacist users (one per hospital) ----
  const pharmacistEmails = ["pharmacist1@apollo.in", "pharmacist2@fortis.in"];
  const pharmacists: mongoose.Document[] = [];
  for (let i = 0; i < hospitals.length; i++) {
    const email = pharmacistEmails[i];
    let pharmacist = await User.findOne({ email });
    if (!pharmacist) {
      pharmacist = await User.create({
        email,
        password: DEFAULT_PASSWORD,
        name: i === 0 ? "Apollo Pharmacy Staff" : "Fortis Pharmacy Staff",
        phone: "+91 98765 5000" + (i + 1),
        role: "pharmacist",
        hospitalId: hospitalIds[i],
      });
      // eslint-disable-next-line no-console
      console.log(`✔ Created pharmacist: ${email}`);
    }
    pharmacists.push(pharmacist);
  }

  // ---- 4) Doctors (3 per hospital) + User per doctor ----
  const doctorSpecs = [
    { name: "Dr. Rajesh Kumar", dept: "Cardiology", fees: "800" },
    { name: "Dr. Priya Sharma", dept: "General Medicine", fees: "500" },
    { name: "Dr. Amit Patel", dept: "Orthopedics", fees: "600" },
    { name: "Dr. Sneha Reddy", dept: "Pediatrics", fees: "550" },
    { name: "Dr. Vikram Singh", dept: "General Medicine", fees: "500" },
    { name: "Dr. Anjali Gupta", dept: "Dermatology", fees: "450" },
  ];

  const doctors: mongoose.Document[] = [];
  for (let i = 0; i < 6; i++) {
    const hospIndex = Math.floor(i / 3);
    const hospitalId = hospitalIds[hospIndex];
    const spec = doctorSpecs[i];
    const baseEmail = `doctor${i + 1}@seed.in`;
    let user = await User.findOne({ email: baseEmail });
    if (!user) {
      user = await User.create({
        email: baseEmail,
        password: DEFAULT_PASSWORD,
        name: spec.name,
        phone: `+91 98765 ${String(10000 + i).slice(-5)}`,
        role: "doctor",
        specialization: spec.dept,
        hospitalId,
      });
    }
    let doc = await Doctor.findOne({ Email: baseEmail });
    if (!doc) {
      doc = await Doctor.create({
        Name_Designation: spec.name,
        Department: spec.dept,
        Phone: user.get("phone"),
        Email: baseEmail,
        Fees: spec.fees,
        Status: "Available",
        user: user._id,
        hospital: hospitalId,
      });
      // eslint-disable-next-line no-console
      console.log(`✔ Created doctor: ${spec.name} @ hospital ${hospIndex + 1}`);
    }
    doctors.push(doc);
  }

  const doctorIds = doctors.map((d) => d._id as mongoose.Types.ObjectId);

  // ---- 5) Doctor leaves ----
  const leaveTypes = ["Sick Leave", "Personal Leave", "Casual Leave"];
  for (let i = 0; i < doctors.length; i++) {
    const doctor = doctors[i];
    const doctorName = doctor.get("Name_Designation") as string;
    const hospitalId = doctor.get("hospital") as mongoose.Types.ObjectId;
    const userId = doctor.get("user") as mongoose.Types.ObjectId | undefined;
    const from1 = addDays(new Date(), 14);
    const to1 = addDays(new Date(), 15);
    const from2 = addDays(new Date(), 30);
    const to2 = addDays(new Date(), 31);
    const leavesToCreate = [
      {
        Doctor: doctorName,
        Date: `${from1.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} - ${to1.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
        From_Date: from1,
        To_Date: to1,
        Leave_Type: leaveTypes[i % 3],
        Day: "02 Days",
        No_Of_Days: 2,
        Applied_On: new Date().toLocaleDateString("en-IN"),
        Applied_On_Date: new Date(),
        Status: "Approved" as const,
        Reason: "Family function",
        Department: doctor.get("Department"),
        user: userId,
        hospital: hospitalId,
      },
      {
        Doctor: doctorName,
        Date: `${from2.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
        From_Date: from2,
        To_Date: to2,
        Leave_Type: "Casual Leave",
        Day: "01 Day",
        No_Of_Days: 1,
        Applied_On: new Date().toLocaleDateString("en-IN"),
        Status: "Applied" as const,
        user: userId,
        hospital: hospitalId,
      },
    ];
    for (const l of leavesToCreate) {
      const exists = await DoctorLeave.findOne({
        Doctor: l.Doctor,
        From_Date: l.From_Date,
        Leave_Type: l.Leave_Type,
      });
      if (!exists) {
        await DoctorLeave.create(l);
      }
    }
  }
  // eslint-disable-next-line no-console
  console.log("✔ Doctor leaves created");

  // ---- 6) Doctor schedules (1 per doctor, Mon–Fri 9–13 & 16–20) ----
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
  const defaultTimeSlots: { session: string; from: string; to: string }[] = [
    { session: "Morning", from: "09:00", to: "13:00" },
    { session: "Evening", from: "16:00", to: "20:00" },
  ];
  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);
  const toDate = addDays(fromDate, 90);

  for (let i = 0; i < doctors.length; i++) {
    const doctorId = doctorIds[i];
    const hospitalId = doctors[i].get("hospital") as mongoose.Types.ObjectId | undefined;
    const existing = await DoctorSchedule.findOne({ doctorId });
    if (existing) continue;
    const schedules = weekDays.map((day) => ({
      day,
      timeSlots: defaultTimeSlots,
    }));
    await DoctorSchedule.create({
      doctorId,
      location: hospitalId ? "OPD Block A" : "Main OPD",
      hospital: hospitalId,
      fromDate,
      toDate,
      recursEvery: "1 Week",
      schedules,
    });
  }
  // eslint-disable-next-line no-console
  console.log("✔ Doctor schedules created");

  // ---- 7) GRN (2 per hospital) ----
  const grnItems = [
    { Item_Name: "Paracetamol 500mg", Item_Code: "MED001", Batch_Number: "B202501", Expiry_Date: addDays(new Date(), 365), Quantity: 500, Unit: "strip", Unit_Price: 12, Total_Price: 6000 },
    { Item_Name: "Amoxicillin 250mg", Item_Code: "MED002", Batch_Number: "B202502", Expiry_Date: addDays(new Date(), 400), Quantity: 200, Unit: "bottle", Unit_Price: 85, Total_Price: 17000 },
    { Item_Name: "Cetirizine 10mg", Item_Code: "MED003", Batch_Number: "B202503", Expiry_Date: addDays(new Date(), 350), Quantity: 300, Unit: "strip", Unit_Price: 8, Total_Price: 2400 },
  ];
  let grnSeq = 0;
  for (let hi = 0; hi < hospitalIds.length; hi++) {
    const hospitalId = hospitalIds[hi];
    const pharmacist = pharmacists[hi]._id;
    for (let g = 0; g < 2; g++) {
      grnSeq += 1;
      const grnNumber = `GRN-SEED-${formatDate(new Date()).replace(/-/g, "")}-${String(grnSeq).padStart(4, "0")}`;
      const exists = await GRN.findOne({ GRN_Number: grnNumber });
      if (exists) continue;
      const items = grnItems.map((it) => ({ ...it, Expiry_Date: it.Expiry_Date as Date }));
      const totalAmount = items.reduce((sum, it) => sum + it.Total_Price, 0);
      await GRN.create({
        GRN_Number: grnNumber,
        GRN_Date: new Date(),
        Supplier: "Sun Pharma Ltd",
        Supplier_Invoice: `INV-${grnSeq}`,
        Items: items,
        Total_Amount: totalAmount,
        Status: g === 0 ? "Received" : "Draft",
        Received_By: "Pharmacy Staff",
        hospital: hospitalId,
        user: pharmacist,
      });
    }
  }
  // eslint-disable-next-line no-console
  console.log("✔ GRN created");

  // ---- 7b) Inventory: same medicines as GRN, linked per hospital ----
  for (let hi = 0; hi < hospitalIds.length; hi++) {
    const hospitalId = hospitalIds[hi];
    const pharmacist = pharmacists[hi]._id;
    for (const it of grnItems) {
      const existing = await Inventory.findOne({
        hospital: hospitalId,
        Item_Code: it.Item_Code,
        Batch_Number: it.Batch_Number,
      });
      if (existing) continue;
      const totalValue = it.Quantity * it.Unit_Price;
      const status: "Available" | "Low Stock" | "Out of Stock" | "Expired" =
        it.Quantity <= 0 ? "Out of Stock" : it.Quantity < 50 ? "Low Stock" : "Available";
      await Inventory.create({
        Item_Name: it.Item_Name,
        Item_Code: it.Item_Code,
        Batch_Number: it.Batch_Number,
        Expiry_Date: it.Expiry_Date as Date,
        Quantity: it.Quantity,
        Unit: it.Unit,
        Unit_Price: it.Unit_Price,
        Total_Value: totalValue,
        Supplier: "Sun Pharma Ltd",
        Status: status,
        hospital: hospitalId,
        user: pharmacist,
      });
    }
  }
  // eslint-disable-next-line no-console
  console.log("✔ Inventory created (same medicines as GRN, per hospital)");

  // ---- 8) Patients (per hospital); used by appointments ----
  const indianPatientNames = [
    "Ramesh Kumar", "Sunita Devi", "Vijay Singh", "Kavita Sharma", "Rajesh Patel",
    "Priya Nair", "Anil Gupta", "Meera Reddy", "Suresh Iyer", "Lakshmi Menon",
    "Mohammed Ali", "Deepa Krishnan", "Arun Pillai", "Pooja Nambiar", "Sanjay Verma",
    "Anita Desai", "Kiran Rao", "Venkat Rao", "Shobha Bhat", "Ravi Shankar",
    "Neha Joshi", "Prakash Malhotra", "Divya Saxena", "Manoj Tiwari", "Rekha Agarwal",
    "Sandeep Mehta", "Swati Kapoor", "Ashok Dubey", "Kirti Sinha", "Vikram Chopra",
    "Geeta Pandey", "Rahul Mishra", "Preeti Jha", "Naveen Trivedi", "Shalini Dwivedi",
    "Alok Singh", "Mamta Yadav", "Gaurav Sharma", "Pallavi Gupta", "Rohit Saxena",
  ];
  const patientsByHospital: mongoose.Document[][] = [[], []];
  const patientsPerHospital = 20;
  for (let hi = 0; hi < hospitalIds.length; hi++) {
    const hospitalId = hospitalIds[hi];
    const receptionUser = hospitalAdmins[hi]._id;
    for (let pi = 0; pi < patientsPerHospital; pi++) {
      const name = indianPatientNames[hi * patientsPerHospital + pi];
      const phone = `+91 9${String(800000000 + hi * 100 + pi).slice(-9)}`;
      const existing = await Patient.findOne({ hospital: hospitalId, Phone: phone });
      if (existing) {
        patientsByHospital[hi].push(existing);
        continue;
      }
      const patient = await Patient.create({
        Patient: name,
        Phone: phone,
        Gender: pi % 2 === 0 ? "Male" : "Female",
        Address: `${10 + pi} Block, Sector ${hi + 1}, City`,
        Status: "Available",
        hospital: hospitalId,
        user: receptionUser,
      });
      patientsByHospital[hi].push(patient);
    }
  }
  // eslint-disable-next-line no-console
  console.log("✔ Patients created (per hospital, Indian names)");

  // ---- 9) Appointments (70% Scheduled, 30% Completed); linked to patients ----
  const morningSlots = slotTimes("09:00", 13 * 60); // 09:00 to 12:45
  const eveningSlots = slotTimes("16:00", 20 * 60);
  const allSlotTimes = [...morningSlots, ...eveningSlots];
  const appointmentDates: string[] = [];
  for (let d = 1; d <= 14; d++) {
    appointmentDates.push(formatDate(addDays(new Date(), d)));
  }

  const createdAppointments: mongoose.Document[] = [];
  let appointmentIndex = 0;
  for (let di = 0; di < doctors.length; di++) {
    const doctor = doctors[di];
    const doctorId = doctorIds[di];
    const hospitalId = doctor.get("hospital") as mongoose.Types.ObjectId;
    const hospIndex = hospitalIds.findIndex((id) => id.equals(hospitalId));
    const doctorName = doctor.get("Name_Designation") as string;
    const fees = doctor.get("Fees") as string;
    const hospitalPatients = patientsByHospital[hospIndex] ?? patientsByHospital[0];

    for (let ni = 0; ni < 5; ni++) {
      const aptDate = appointmentDates[appointmentIndex % appointmentDates.length];
      const slotTime = allSlotTimes[ni % allSlotTimes.length];
      appointmentIndex += 1;

      const patient = hospitalPatients[(di * 5 + ni) % hospitalPatients.length] as mongoose.Document;
      const patientName = patient.get("Patient") as string;
      const phone = patient.get("Phone") as string;
      const isScheduled = (di * 5 + ni) % 10 < 7; // 70% Scheduled
      const status = isScheduled ? "Scheduled" : "Completed";
      const dateTime = new Date(`${aptDate}T${slotTime}:00`);

      const existing = await Appointment.findOne({
        doctorId,
        hospital: hospitalId,
        appointmentDate: aptDate,
        slotTime,
        Status: { $ne: "Cancelled" },
      });
      if (existing) continue;

      const apt = await Appointment.create({
        Date_Time: `${aptDate} ${slotTime}`,
        appointmentDate: aptDate,
        slotTime,
        dateTime,
        Patient: patientName,
        Phone: phone,
        Doctor: doctorName,
        Status: status,
        Fees: fees,
        amountPaid: status === "Completed" ? Number(fees) : 0,
        paymentStatus: status === "Completed" ? "Paid" : "Pending",
        paymentMode: "Cash",
        doctorId,
        hospital: hospitalId,
        user: hospitalAdmins[0]._id,
      });
      createdAppointments.push(apt);
    }
  }
  // eslint-disable-next-line no-console
  console.log(`✔ Appointments created (${createdAppointments.length}, ~70% Scheduled)`);

  // ---- 10) Consultations (for Completed appointments only) ----
  const completedAppointments = createdAppointments.filter((a) => a.get("Status") === "Completed");
  const consultations: mongoose.Document[] = [];
  for (const apt of completedAppointments) {
    const aptId = apt._id as mongoose.Types.ObjectId;
    const existingConsult = await Consultation.findOne({ Appointment_ID: aptId });
    if (existingConsult) continue;
    const hospitalId = apt.get("hospital") as mongoose.Types.ObjectId;
    const doctorId = apt.get("doctorId") as mongoose.Types.ObjectId;
    const doctor = doctors.find((d) => d._id.equals(doctorId));
    const doctorName = (doctor?.get("Name_Designation") as string) ?? "Doctor";
    const c = await Consultation.create({
      Appointment_ID: aptId,
      Patient: apt.get("Patient"),
      Doctor: doctorName,
      Vitals: { temperature: "98.6", pulse: "72", weight: "70", height: "170" },
      Complaints: [{ complaint: "Fever and cold", duration: "3 days" }],
      Diagnosis: [{ diagnosis: "Viral upper respiratory infection", type: "Provisional" }],
      Medications: [
        { medicine: "Paracetamol 500mg", dosage: "1 tab", frequency: "TDS", duration: "5 days", quantity: 15, unitPrice: 2, subtotal: 30 },
        { medicine: "Cetirizine 10mg", dosage: "1 tab", frequency: "OD", duration: "5 days", quantity: 5, unitPrice: 3, subtotal: 15 },
      ],
      Advice: [{ advice: "Rest and fluids" }],
      Investigations: [{ investigation: "CBC", notes: "If fever persists" }],
      Status: "Completed",
      Consultation_Date: apt.get("dateTime") ?? new Date(),
      Completed_At: new Date(),
      hospital: hospitalId,
      user: hospitalAdmins[0]._id,
    });
    consultations.push(c);
  }
  // eslint-disable-next-line no-console
  console.log(`✔ Consultations created (${consultations.length})`);

  // ---- 11) Pharmacy dispense (one per consultation) ----
  for (const c of consultations) {
    const consultationId = c._id as mongoose.Types.ObjectId;
    const existingDispense = await PharmacyDispense.findOne({ consultationId });
    if (existingDispense) continue;
    const aptId = c.get("Appointment_ID") as mongoose.Types.ObjectId;
    const apt = await Appointment.findById(aptId);
    const doctorId = apt?.get("doctorId") as mongoose.Types.ObjectId | undefined;
    const consultHospitalId = c.get("hospital") as mongoose.Types.ObjectId;
    const hospIndex = hospitalIds.findIndex((id) => id.equals(consultHospitalId));
    const dispensedBy = hospIndex >= 0 ? pharmacists[hospIndex]._id : pharmacists[0]._id;
    const meds = (c.get("Medications") as Array<{ medicine: string; dosage?: string; quantity?: number; unitPrice?: number; subtotal?: number }>) ?? [];
    await PharmacyDispense.create({
      hospital: consultHospitalId,
      consultationId,
      appointmentId: aptId,
      doctorId,
      doctorName: c.get("Doctor") as string,
      patientName: c.get("Patient") as string,
      amountReceived: meds.reduce((s, m) => s + (m.subtotal ?? 0), 0),
      paymentMethod: "Cash",
      medications: meds.map((m) => ({
        medicine: m.medicine,
        dosage: m.dosage,
        quantity: m.quantity ?? 1,
        unitPrice: m.unitPrice ?? 0,
        subtotal: m.subtotal ?? 0,
      })),
      dispensedBy,
      notes: "Dispensed as per prescription",
    });
  }
  // eslint-disable-next-line no-console
  console.log(`✔ Pharmacy dispense created (${consultations.length})`);

  // eslint-disable-next-line no-console
  console.log("\n✔ Seed completed. Run once; repeat runs may create duplicates.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
