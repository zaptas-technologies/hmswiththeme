import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../models/userModel";
import { Hospital } from "../models/hospitalModel";
import { Doctor } from "../models/doctorModel";
import { Patient } from "../models/patientModel";
import { Appointment } from "../models/appointmentModel";
import { Consultation } from "../models/consultationModel";
import { Prescription } from "../models/prescriptionModel";

dotenv.config();

// Helper function to generate random date within last 30 days
const randomDate = (daysAgo: number = 30): Date => {
  const now = new Date();
  const days = Math.floor(Math.random() * daysAgo);
  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Helper function to format date for Date_Time field
const formatDateTime = (date: Date): string => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const day = days[date.getDay()];
  const month = months[date.getMonth()];
  const dayNum = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  
  return `${day} ${month} ${dayNum} ${year} ${hours}:${minutes}`;
};

// Helper function to format date string
const formatDateString = (date: Date): string => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const main = async () => {
  try {
    await connectDB(process.env.MONGODB_URI || "");
    // eslint-disable-next-line no-console
    console.log("✔ Connected to MongoDB\n");

    // Step 1: Create or get superadmin
    // eslint-disable-next-line no-console
    console.log("📋 Step 1: Creating superadmin...");
    const superAdminEmail = "superadmin@preclinic.com";
    const superAdminPassword = "123456";
    
    let superAdmin = await User.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      superAdmin = await User.create({
        email: superAdminEmail,
        password: superAdminPassword,
        name: "Super Admin",
        phone: "+1 234 567 8900",
        role: "super_admin",
      });
      // eslint-disable-next-line no-console
      console.log(`✔ Created superadmin: ${superAdminEmail}`);
    } else {
      // Update password to ensure it's set
      superAdmin.password = superAdminPassword;
      await superAdmin.save();
      // eslint-disable-next-line no-console
      console.log(`✔ Superadmin already exists: ${superAdminEmail}`);
    }

    // Step 2: Create hospital with hospital admin
    // eslint-disable-next-line no-console
    console.log("\n📋 Step 2: Creating hospital and hospital admin...");
    const hospitalAdminEmail = "hospitaladmin@preclinic.com";
    const hospitalAdminPassword = "123456";
    
    let hospitalAdmin = await User.findOne({ email: hospitalAdminEmail });
    if (!hospitalAdmin) {
      hospitalAdmin = await User.create({
        email: hospitalAdminEmail,
        password: hospitalAdminPassword,
        name: "Hospital Admin",
        phone: "+1 234 567 8901",
        role: "hospital_admin",
      });
      // eslint-disable-next-line no-console
      console.log(`✔ Created hospital admin user: ${hospitalAdminEmail}`);
    } else {
      hospitalAdmin.password = hospitalAdminPassword;
      await hospitalAdmin.save();
      // eslint-disable-next-line no-console
      console.log(`✔ Hospital admin already exists: ${hospitalAdminEmail}`);
    }

    let hospital = await Hospital.findOne({ email: "hospital@preclinic.com" });
    if (!hospital) {
      hospital = await Hospital.create({
        name: "City General Hospital",
        address: "123 Medical Center Drive",
        city: "New York",
        state: "NY",
        phone: "+1 234 567 8900",
        email: "hospital@preclinic.com",
        status: "Active",
        hospitalAdmin: hospitalAdmin._id,
      });
      // eslint-disable-next-line no-console
      console.log(`✔ Created hospital: ${hospital.name}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`✔ Hospital already exists: ${hospital.name}`);
    }

    // Update hospital admin's hospitalId
    hospitalAdmin.hospitalId = hospital._id;
    await hospitalAdmin.save();

    const hospitalId = hospital._id;
    const hospitalAdminId = hospitalAdmin._id;

    // Step 3: Create 10 doctors
    // eslint-disable-next-line no-console
    console.log("\n📋 Step 3: Creating 10 doctors...");
    const doctorNames = [
      { name: "Dr. Sarah Johnson", dept: "Cardiology", email: "sarah.johnson@preclinic.com" },
      { name: "Dr. Michael Chen", dept: "Pediatrics", email: "michael.chen@preclinic.com" },
      { name: "Dr. Emily Rodriguez", dept: "Dermatology", email: "emily.rodriguez@preclinic.com" },
      { name: "Dr. James Wilson", dept: "Orthopedics", email: "james.wilson@preclinic.com" },
      { name: "Dr. Lisa Anderson", dept: "Neurology", email: "lisa.anderson@preclinic.com" },
      { name: "Dr. Robert Brown", dept: "Oncology", email: "robert.brown@preclinic.com" },
      { name: "Dr. Maria Garcia", dept: "Gynecology", email: "maria.garcia@preclinic.com" },
      { name: "Dr. David Lee", dept: "Psychiatry", email: "david.lee@preclinic.com" },
      { name: "Dr. Jennifer Taylor", dept: "Endocrinology", email: "jennifer.taylor@preclinic.com" },
      { name: "Dr. Christopher Moore", dept: "Pulmonology", email: "christopher.moore@preclinic.com" },
    ];

    const doctors: mongoose.Types.ObjectId[] = [];
    for (let i = 0; i < doctorNames.length; i++) {
      const doc = doctorNames[i];
      const existingDoctor = await Doctor.findOne({ Email: doc.email });
      
      if (!existingDoctor) {
        const doctor = await Doctor.create({
          Name_Designation: `${doc.name} - ${doc.dept}`,
          Email: doc.email,
          Phone: `+1 234 567 ${8900 + i}`,
          Department: doc.dept,
          Status: "Available",
          Fees: `${500 + Math.floor(Math.random() * 500)}`,
          hospital: hospitalId,
          user: hospitalAdminId, // Hospital admin creates doctors
          timeSlotMinutes: 15,
        });

        // Create user account for doctor
        await User.create({
          email: doc.email,
          password: "123456",
          name: doc.name,
          phone: `+1 234 567 ${8900 + i}`,
          role: "doctor",
          specialization: doc.dept,
          hospitalId: hospitalId,
        });

        doctors.push(doctor._id);
        // eslint-disable-next-line no-console
        console.log(`✔ Created doctor ${i + 1}/10: ${doc.name} (${doc.dept})`);
      } else {
        doctors.push(existingDoctor._id);
        // eslint-disable-next-line no-console
        console.log(`⚠ Doctor already exists: ${doc.name}`);
      }
    }

    // Step 4: Create 25 patients
    // eslint-disable-next-line no-console
    console.log("\n📋 Step 4: Creating 25 patients...");
    const patientFirstNames = [
      "John", "Jane", "Robert", "Mary", "William", "Patricia", "Richard", "Jennifer",
      "Joseph", "Linda", "Thomas", "Elizabeth", "Charles", "Barbara", "Daniel", "Susan",
      "Matthew", "Jessica", "Anthony", "Sarah", "Mark", "Karen", "Donald", "Nancy", "Steven"
    ];
    const patientLastNames = [
      "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
      "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
      "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Clark", "Lewis"
    ];

    const patients: mongoose.Types.ObjectId[] = [];
    for (let i = 0; i < 25; i++) {
      const firstName = patientFirstNames[i];
      const lastName = patientLastNames[i];
      const patientName = `${firstName} ${lastName}`;
      const phone = `+1 555 ${1000 + i}`;
      
      const existingPatient = await Patient.findOne({ Phone: phone });
      
      if (!existingPatient) {
        const patient = await Patient.create({
          Patient: patientName,
          Phone: phone,
          Email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          Gender: i % 2 === 0 ? "Male" : "Female",
          Address: `${100 + i} Main Street, City, State ${10000 + i}`,
          Status: "Available",
          hospital: hospitalId,
          user: hospitalAdminId,
        });

        patients.push(patient._id);
        if ((i + 1) % 5 === 0) {
          // eslint-disable-next-line no-console
          console.log(`✔ Created patients ${i - 3}-${i + 1}/25`);
        }
      } else {
        patients.push(existingPatient._id);
      }
    }
    // eslint-disable-next-line no-console
    console.log(`✔ Created/verified 25 patients`);

    // Step 5: Create 25 appointments
    // eslint-disable-next-line no-console
    console.log("\n📋 Step 5: Creating 25 appointments...");
    const appointmentStatuses = ["Confirmed", "Pending", "Completed", "Cancelled"];
    const appointmentModes = ["In-Person", "Video", "Phone"];
    
    const appointments: mongoose.Types.ObjectId[] = [];
    for (let i = 0; i < 25; i++) {
      const doctorIndex = Math.floor(Math.random() * doctors.length);
      const patientIndex = Math.floor(Math.random() * patients.length);
      const doctor = await Doctor.findById(doctors[doctorIndex]);
      const patient = await Patient.findById(patients[patientIndex]);
      
      if (!doctor || !patient) continue;

      const appointmentDate = randomDate(30);
      const status = appointmentStatuses[Math.floor(Math.random() * appointmentStatuses.length)];
      
      const appointment = await Appointment.create({
        Date_Time: formatDateTime(appointmentDate),
        Patient: patient.Patient,
        Phone: patient.Phone,
        Patient_Image: patient.Patient_img,
        Doctor: doctor.Name_Designation,
        Doctor_Image: doctor.img,
        role: doctor.role || "Doctor",
        Mode: appointmentModes[Math.floor(Math.random() * appointmentModes.length)],
        Status: status,
        Fees: doctor.Fees || "500",
        doctorId: doctor._id,
        hospital: hospitalId,
        user: hospitalAdminId,
      });

      appointments.push(appointment._id);
      if ((i + 1) % 5 === 0) {
        // eslint-disable-next-line no-console
        console.log(`✔ Created appointments ${i - 3}-${i + 1}/25`);
      }
    }
    // eslint-disable-next-line no-console
    console.log(`✔ Created 25 appointments`);

    // Step 6: Create consultations for completed appointments
    // eslint-disable-next-line no-console
    console.log("\n📋 Step 6: Creating consultations...");
    const completedAppointments = await Appointment.find({
      _id: { $in: appointments },
      Status: "Completed",
    }).limit(15).lean();

    const consultations: mongoose.Types.ObjectId[] = [];
    const commonComplaints = [
      { complaint: "Headache", duration: "3 days" },
      { complaint: "Fever", duration: "2 days" },
      { complaint: "Cough", duration: "1 week" },
      { complaint: "Chest pain", duration: "1 day" },
      { complaint: "Abdominal pain", duration: "2 days" },
      { complaint: "Fatigue", duration: "1 week" },
      { complaint: "Joint pain", duration: "3 days" },
    ];

    const commonDiagnosis = [
      { diagnosis: "Upper Respiratory Infection", type: "Primary" },
      { diagnosis: "Hypertension", type: "Chronic" },
      { diagnosis: "Diabetes Type 2", type: "Chronic" },
      { diagnosis: "Migraine", type: "Acute" },
      { diagnosis: "Gastroenteritis", type: "Acute" },
    ];

    const commonMedicines = [
      { medicine: "Paracetamol 500mg", dosage: "1 tablet", frequency: "Twice daily", duration: "5 days" },
      { medicine: "Ibuprofen 400mg", dosage: "1 tablet", frequency: "Three times daily", duration: "3 days" },
      { medicine: "Amoxicillin 500mg", dosage: "1 capsule", frequency: "Twice daily", duration: "7 days" },
      { medicine: "Cetirizine 10mg", dosage: "1 tablet", frequency: "Once daily", duration: "5 days" },
      { medicine: "Omeprazole 20mg", dosage: "1 capsule", frequency: "Once daily", duration: "14 days" },
    ];

    for (const appt of completedAppointments) {
      const appointmentId = appt._id;
      const consultationDate = randomDate(20);
      
      const consultation = await Consultation.create({
        Appointment_ID: appointmentId,
        Patient: appt.Patient,
        Patient_Image: appt.Patient_Image,
        Doctor: appt.Doctor,
        Doctor_Image: appt.Doctor_Image,
        Vitals: {
          temperature: `${36.5 + Math.random() * 1.5}`.substring(0, 4),
          pulse: `${70 + Math.floor(Math.random() * 20)}`,
          respiratoryRate: `${16 + Math.floor(Math.random() * 4)}`,
          spo2: `${96 + Math.floor(Math.random() * 4)}`,
          height: `${150 + Math.floor(Math.random() * 50)} cm`,
          weight: `${50 + Math.floor(Math.random() * 40)} kg`,
          bmi: `${18 + Math.random() * 7}`.substring(0, 4),
        },
        Complaints: [commonComplaints[Math.floor(Math.random() * commonComplaints.length)]],
        Diagnosis: [commonDiagnosis[Math.floor(Math.random() * commonDiagnosis.length)]],
        Medications: [
          commonMedicines[Math.floor(Math.random() * commonMedicines.length)],
          commonMedicines[Math.floor(Math.random() * commonMedicines.length)],
        ],
        Advice: [
          { advice: "Take rest and stay hydrated" },
          { advice: "Follow up if symptoms persist" },
        ],
        Investigations: [
          { investigation: "Complete Blood Count", notes: "Routine check" },
        ],
        FollowUp: {
          nextConsultation: formatDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
          emptyStomach: "No",
        },
        Invoice: [
          {
            item: "Consultation Fee",
            quantity: 1,
            price: parseInt(appt.Fees as string) || 500,
            total: parseInt(appt.Fees as string) || 500,
            paymentMode: ["Cash", "Card", "Online"][Math.floor(Math.random() * 3)],
          },
        ],
        Status: "Completed",
        Consultation_Date: consultationDate,
        Completed_At: consultationDate,
        hospital: hospitalId,
        user: hospitalAdminId,
      });

      consultations.push(consultation._id);
      
      // Update appointment with consultation ID
      await Appointment.findByIdAndUpdate(appointmentId, {
        Consultation_ID: consultation._id.toString(),
      });
    }
    // eslint-disable-next-line no-console
    console.log(`✔ Created ${consultations.length} consultations`);

    // Step 7: Create prescriptions
    // eslint-disable-next-line no-console
    console.log("\n📋 Step 7: Creating prescriptions...");
    const prescriptionsCreated = [];
    
    for (const consultationId of consultations) {
      const consultation = await Consultation.findById(consultationId).lean() as any;
      if (!consultation) continue;

      const appointment = await Appointment.findById(consultation.Appointment_ID).lean() as any;
      if (!appointment) continue;

      // Use doctorId from appointment if available, otherwise look up by name
      let doctorId: mongoose.Types.ObjectId | undefined;
      if (appointment.doctorId) {
        doctorId = appointment.doctorId as mongoose.Types.ObjectId;
      } else {
        const doctor = await Doctor.findOne({ Name_Designation: consultation.Doctor }).lean() as any;
        if (doctor) {
          doctorId = doctor._id as mongoose.Types.ObjectId;
        }
      }
      
      // Find patient by phone or name
      let patientId: mongoose.Types.ObjectId | undefined;
      const patient = await Patient.findOne({
        $or: [
          { Patient: consultation.Patient },
          { Phone: appointment.Phone },
        ],
      }).lean() as any;
      if (patient) {
        patientId = patient._id as mongoose.Types.ObjectId;
      }
      
      if (!doctorId) continue;

      // Create prescription for each medication in consultation
      if (consultation.Medications && consultation.Medications.length > 0) {
        for (const med of consultation.Medications) {
          const prescription = await Prescription.create({
            Date: formatDateString(new Date()),
            Prescribed_On: formatDateString(new Date()),
            Patient: consultation.Patient,
            Patient_Image: consultation.Patient_Image,
            Doctor: consultation.Doctor,
            Medicine: med.medicine,
            Status: "Active",
            Dosage: med.dosage,
            Frequency: med.frequency,
            Duration: med.duration,
            Medications: [{
              medicine: med.medicine,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
            }],
            Appointment_ID: consultation.Appointment_ID,
            consultationId: consultationId,
            doctorId: doctorId,
            patientId: patientId,
            hospital: hospitalId,
            user: hospitalAdminId,
          });

          prescriptionsCreated.push(prescription._id);
        }
      } else {
        // Create a basic prescription even if no medications
        const prescription = await Prescription.create({
          Date: formatDateString(new Date()),
          Prescribed_On: formatDateString(new Date()),
          Patient: consultation.Patient,
          Patient_Image: consultation.Patient_Image,
          Doctor: consultation.Doctor,
          Medicine: "Prescribed medication",
          Status: "Active",
          Dosage: "As directed",
          Frequency: "As needed",
          Duration: "7 days",
          Medications: [{
            medicine: "Prescribed medication",
            dosage: "As directed",
            frequency: "As needed",
            duration: "7 days",
          }],
          Appointment_ID: consultation.Appointment_ID,
          consultationId: consultationId,
          doctorId: doctorId,
          patientId: patientId,
          hospital: hospitalId,
          user: hospitalAdminId,
        });

        prescriptionsCreated.push(prescription._id);
      }
    }
    // eslint-disable-next-line no-console
    console.log(`✔ Created ${prescriptionsCreated.length} prescriptions`);

    // Summary
    // eslint-disable-next-line no-console
    console.log("\n" + "=".repeat(60));
    // eslint-disable-next-line no-console
    console.log("✅ DUMMY DATA SEEDING COMPLETED SUCCESSFULLY!");
    // eslint-disable-next-line no-console
    console.log("=".repeat(60));
    // eslint-disable-next-line no-console
    console.log("\n📊 Summary:");
    // eslint-disable-next-line no-console
    console.log(`   • Superadmin: ${superAdminEmail} (password: ${superAdminPassword})`);
    // eslint-disable-next-line no-console
    console.log(`   • Hospital Admin: ${hospitalAdminEmail} (password: ${hospitalAdminPassword})`);
    // eslint-disable-next-line no-console
    console.log(`   • Hospital: ${hospital.name}`);
    // eslint-disable-next-line no-console
    console.log(`   • Doctors: ${doctors.length}`);
    // eslint-disable-next-line no-console
    console.log(`   • Patients: ${patients.length}`);
    // eslint-disable-next-line no-console
    console.log(`   • Appointments: ${appointments.length}`);
    // eslint-disable-next-line no-console
    console.log(`   • Consultations: ${consultations.length}`);
    // eslint-disable-next-line no-console
    console.log(`   • Prescriptions: ${prescriptionsCreated.length}`);
    // eslint-disable-next-line no-console
    console.log("\n💡 Login Credentials:");
    // eslint-disable-next-line no-console
    console.log(`   Superadmin: ${superAdminEmail} / ${superAdminPassword}`);
    // eslint-disable-next-line no-console
    console.log(`   Hospital Admin: ${hospitalAdminEmail} / ${hospitalAdminPassword}`);
    // eslint-disable-next-line no-console
    console.log(`   Doctors: <doctor-email> / 123456`);
    // eslint-disable-next-line no-console
    console.log("\n✨ Your reports should now show good data!\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("❌ Failed to seed dummy data:", err);
    process.exit(1);
  }
};

main();
