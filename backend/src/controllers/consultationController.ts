import { RequestHandler } from "express";
import { getResourceModel } from "../models/resourceRegistry";
import mongoose from "mongoose";
import { DashboardAppointment } from "../models/dashboardAppointmentModel";
import { DashboardPatient } from "../models/dashboardPatientModel";
import { User } from "../models/userModel";

export interface ConsultationData {
  appointmentId: string;
  vitals?: {
    temperature?: string;
    pulse?: string;
    respiratoryRate?: string;
    spo2?: string;
    height?: string;
    weight?: string;
    bmi?: string;
    waist?: string;
  };
  complaints?: Array<{ complaint: string; duration?: string }>;
  diagnosis?: Array<{ diagnosis: string; type?: string }>;
  medications?: Array<{
    medicine: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
  advice?: Array<{ advice: string }>;
  investigations?: Array<{
    investigation: string;
    notes?: string;
  }>;
  followUp?: {
    nextConsultation?: string;
    emptyStomach?: string;
  };
  invoice?: Array<{
    item: string;
    quantity?: number;
    price?: number;
    total?: number;
  }>;
}

// GET /api/consultations/appointment/:id - Get appointment with patient details for consultation
export const getAppointmentForConsultation: RequestHandler = async (req, res, next) => {
  try {
    const dbName = mongoose.connection.db?.databaseName || "unknown";
    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Fetching appointment for consultation: ${req.params.id}`);
    
    const AppointmentModel = getResourceModel("appointments");
    const PatientModel = getResourceModel("patients");
    const { id } = req.params;

    // Find appointment
    const appointment = await AppointmentModel.findOne({ $or: [{ _id: id }, { id }] }).exec();
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Find patient by name or phone
    let patient = null;
    if (appointment.Patient) {
      patient = await PatientModel.findOne({
        $or: [
          { Patient: appointment.Patient },
          { Phone: appointment.Phone },
        ],
      }).exec();
    }

    // Format response
    const appointmentObj = typeof appointment.toObject === "function" ? appointment.toObject() : appointment;
    
    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Appointment data loaded:`, {
      appointmentId: appointmentObj.id || appointmentObj._id,
      hasInvoice: !!appointmentObj.Invoice,
      invoiceCount: appointmentObj.Invoice?.length || 0,
      invoiceItems: appointmentObj.Invoice || [],
    });
    
    res.json({
      appointment: appointmentObj,
      patient: patient ? (typeof patient.toObject === "function" ? patient.toObject() : patient) : null,
    });
  } catch (err: any) {
    if (err?.name === "CastError") {
      return res.status(400).json({ message: "Invalid appointment id" });
    }
    next(err);
  }
};

// POST /api/consultations - Save consultation data and optionally complete appointment
export const saveConsultation: RequestHandler = async (req, res, next) => {
  try {
    const dbName = mongoose.connection.db?.databaseName || "unknown";
    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Saving consultation data`);
    
    const AppointmentModel = getResourceModel("appointments");
    const { appointmentId, consultationData, completeAppointment } = req.body;

    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Request data:`, {
      appointmentId,
      hasVitals: !!consultationData?.vitals,
      hasComplaints: !!consultationData?.complaints,
      hasDiagnosis: !!consultationData?.diagnosis,
      hasMedications: !!consultationData?.medications,
      hasAdvice: !!consultationData?.advice,
      hasInvestigations: !!consultationData?.investigations,
      hasFollowUp: !!consultationData?.followUp,
      hasInvoice: !!consultationData?.invoice,
      invoiceItems: consultationData?.invoice || [],
      completeAppointment,
    });

    if (!appointmentId) {
      return res.status(400).json({ message: "Appointment ID is required" });
    }

    // Find appointment
    const appointment = await AppointmentModel.findOne({
      $or: [{ _id: appointmentId }, { id: appointmentId }],
    }).exec();

    if (!appointment) {
      // eslint-disable-next-line no-console
      console.log(`[Consultation Controller] Database: ${dbName} - Appointment not found: ${appointmentId}`);
      return res.status(404).json({ message: "Appointment not found" });
    }

    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Found appointment:`, {
      appointmentId: appointment.id || appointment._id,
      patient: appointment.Patient,
      status: appointment.Status,
    });

    // Save consultation data to appointment
    const consultationFields: any = {};
    if (consultationData?.vitals) consultationFields.Vitals = consultationData.vitals;
    if (consultationData?.complaints) consultationFields.Complaints = consultationData.complaints;
    if (consultationData?.diagnosis) consultationFields.Diagnosis = consultationData.diagnosis;
    if (consultationData?.medications) consultationFields.Medications = consultationData.medications;
    if (consultationData?.advice) consultationFields.Advice = consultationData.advice;
    if (consultationData?.investigations) consultationFields.Investigations = consultationData.investigations;
    if (consultationData?.followUp) consultationFields.FollowUp = consultationData.followUp;
    if (consultationData?.invoice) consultationFields.Invoice = consultationData.invoice;

    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Consultation fields to save:`, {
      hasVitals: !!consultationFields.Vitals,
      hasComplaints: !!consultationFields.Complaints,
      hasDiagnosis: !!consultationFields.Diagnosis,
      hasMedications: !!consultationFields.Medications,
      medicationsCount: consultationData?.medications?.length || 0,
      medications: consultationData?.medications || [],
      hasAdvice: !!consultationFields.Advice,
      hasInvestigations: !!consultationFields.Investigations,
      hasFollowUp: !!consultationFields.FollowUp,
      hasInvoice: !!consultationFields.Invoice,
      invoiceData: consultationFields.Invoice || [],
      invoiceCount: consultationFields.Invoice?.length || 0,
      completeAppointment,
    });

    // Update appointment with consultation data
    Object.assign(appointment, consultationFields);

    // If completing appointment, update status
    if (completeAppointment) {
      appointment.Status = "Checked Out";
      
      // Also update DashboardAppointment if it exists
      try {
        // Find User by doctor email to get correct doctorId
        const doctorModel = getResourceModel("doctors");
        const doctor = await doctorModel.findById(appointment.doctorId || appointment.Doctor).exec();
        
        if (doctor) {
          const doctorEmail = (doctor.Email || doctor.email || "").toLowerCase().trim();
          if (doctorEmail) {
            const user = await User.findOne({ email: doctorEmail });
            const dashboardDoctorId = user ? String(user._id) : appointment.doctorId;
            
            // Find DashboardPatient by name and phone
            const dashboardPatient = await DashboardPatient.findOne({
              doctorId: dashboardDoctorId,
              name: appointment.Patient,
              phone: appointment.Phone,
            });
            
            if (dashboardPatient) {
              // Parse appointment date to match
              let appointmentDate: Date;
              try {
                appointmentDate = new Date(appointment.Date_Time);
                if (isNaN(appointmentDate.getTime())) {
                  // Try manual parsing
                  const monthMap: Record<string, number> = {
                    "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
                    "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
                  };
                  const match = appointment.Date_Time.match(/(\d{1,2})\s+(\w{3})\s+(\d{4}),\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i);
                  if (match) {
                    const [, day, month, year, hour, minute, ampm] = match;
                    const monthNum = monthMap[month];
                    if (monthNum !== undefined) {
                      let hour24 = parseInt(hour, 10);
                      if (ampm.toUpperCase() === "PM" && hour24 !== 12) hour24 += 12;
                      if (ampm.toUpperCase() === "AM" && hour24 === 12) hour24 = 0;
                      appointmentDate = new Date(parseInt(year, 10), monthNum, parseInt(day, 10), hour24, parseInt(minute, 10));
                    }
                  }
                }
              } catch {
                appointmentDate = new Date();
              }
              
              // Update DashboardAppointment by matching doctorId, patientId, and approximate datetime
              const startOfDay = new Date(appointmentDate);
              startOfDay.setHours(0, 0, 0, 0);
              const endOfDay = new Date(appointmentDate);
              endOfDay.setHours(23, 59, 59, 999);
              
              await DashboardAppointment.updateMany(
                {
                  doctorId: dashboardDoctorId,
                  patientId: dashboardPatient._id,
                  datetime: { $gte: startOfDay, $lte: endOfDay },
                },
                { $set: { status: "Checked Out" } }
              );
            }
          }
        }
      } catch (dashboardErr: any) {
        // eslint-disable-next-line no-console
        console.error("[Consultation] Failed to update DashboardAppointment:", dashboardErr);
      }
    }

    await appointment.save();
    
    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Appointment saved successfully:`, {
      appointmentId: appointment.id || appointment._id,
      status: appointment.Status,
      hasInvoice: !!appointment.Invoice,
      invoiceCount: appointment.Invoice?.length || 0,
    });

    // If completing appointment and medications exist, create prescription records
    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Checking prescription creation conditions:`, {
      completeAppointment,
      hasMedications: !!consultationData?.medications,
      medicationsLength: consultationData?.medications?.length || 0,
      medications: consultationData?.medications || [],
      willCreatePrescriptions: !!(completeAppointment && consultationData?.medications && consultationData.medications.length > 0),
    });

    if (completeAppointment && consultationData?.medications && consultationData.medications.length > 0) {
      try {
        const PrescriptionModel = getResourceModel("doctorprescriptions");
        const prescriptionId = `#PRE${Date.now().toString().slice(-4)}`;
        const prescriptionDate = new Date().toISOString().split("T")[0];
        
        // eslint-disable-next-line no-console
        console.log(`[Consultation Controller] Database: ${dbName} - Creating prescriptions:`, {
          medicationCount: consultationData.medications.length,
          doctor: appointment.Doctor,
          patient: appointment.Patient,
        });
        
        // Create a prescription for each medication
        let createdCount = 0;
        let skippedCount = 0;
        for (const medication of consultationData.medications) {
          // Get medicine name - handle different field names
          const medicineName = medication.medicine || medication.Medicine || medication.name || "";
          
          // Skip if medicine name is empty
          if (!medicineName || medicineName.trim() === "") {
            skippedCount++;
            // eslint-disable-next-line no-console
            console.log(`[Consultation Controller] Database: ${dbName} - Skipping prescription (empty medicine name):`, medication);
            continue;
          }

          const prescriptionData = {
            id: `${prescriptionId}-${Math.random().toString(36).slice(2, 7)}`,
            Prescription_ID: prescriptionId,
            Date: prescriptionDate,
            Prescribed_On: prescriptionDate,
            Patient: appointment.Patient || "",
            Patient_Image: appointment.Patient_Image || "",
            Doctor: appointment.Doctor || "",
            Medicine: medicineName.trim(),
            Status: "Active",
            // Store additional medication details - handle different field names
            Dosage: medication.dosage || medication.Dosage || "",
            Frequency: medication.frequency || medication.Frequency || "",
            Duration: medication.duration || medication.Duration || "",
            Appointment_ID: appointment.id || appointment._id?.toString() || "",
          };

          // eslint-disable-next-line no-console
          console.log(`[Consultation Controller] Database: ${dbName} - Prescription data:`, {
            id: prescriptionData.id,
            Doctor: prescriptionData.Doctor,
            Patient: prescriptionData.Patient,
            Medicine: prescriptionData.Medicine,
            Dosage: prescriptionData.Dosage,
            Frequency: prescriptionData.Frequency,
            Duration: prescriptionData.Duration,
          });

          // Check if prescription already exists (by unique id or by same appointment + medicine)
          const existingPrescription = await PrescriptionModel.findOne({
            $or: [
              { id: prescriptionData.id },
              {
                Appointment_ID: prescriptionData.Appointment_ID,
                Medicine: prescriptionData.Medicine,
                Patient: prescriptionData.Patient,
              }
            ]
          }).exec();

          if (!existingPrescription) {
            const created = await PrescriptionModel.create(prescriptionData);
            createdCount++;
            // eslint-disable-next-line no-console
            console.log(`[Consultation Controller] Database: ${dbName} - Prescription created successfully:`, {
              id: created.id || created._id,
              Doctor: created.Doctor,
              Patient: created.Patient,
              Medicine: created.Medicine,
            });
          } else {
            // eslint-disable-next-line no-console
            console.log(`[Consultation Controller] Database: ${dbName} - Prescription already exists:`, {
              existingId: existingPrescription.id || existingPrescription._id,
              Doctor: existingPrescription.Doctor,
              Medicine: existingPrescription.Medicine,
            });
          }
        }
        
        // eslint-disable-next-line no-console
        console.log(`[Consultation Controller] Database: ${dbName} - Prescription creation summary:`, {
          totalMedications: consultationData.medications.length,
          prescriptionsCreated: createdCount,
          prescriptionsSkipped: skippedCount,
        });
      } catch (prescriptionErr: any) {
        // eslint-disable-next-line no-console
        console.error(`[Consultation Controller] Database: ${dbName} - Failed to create prescription:`, {
          error: prescriptionErr.message,
          stack: prescriptionErr.stack,
          medications: consultationData.medications,
        });
        // Don't fail the consultation save if prescription creation fails
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(`[Consultation Controller] Database: ${dbName} - Skipping prescription creation:`, {
        reason: !completeAppointment ? "Appointment not being completed" : 
                !consultationData?.medications ? "No medications in consultation data" :
                consultationData.medications.length === 0 ? "Medications array is empty" : "Unknown reason",
      });
    }

    const updatedAppointment = typeof appointment.toObject === "function" ? appointment.toObject() : appointment;

    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Consultation saved successfully:`, {
      appointmentId: updatedAppointment.id || updatedAppointment._id,
      status: updatedAppointment.Status,
      hasInvoice: !!updatedAppointment.Invoice,
      invoiceCount: updatedAppointment.Invoice?.length || 0,
      invoiceItems: updatedAppointment.Invoice || [],
    });

    res.json({
      message: completeAppointment ? "Consultation saved and appointment completed" : "Consultation saved",
      appointment: updatedAppointment,
    });
  } catch (err: any) {
    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};
