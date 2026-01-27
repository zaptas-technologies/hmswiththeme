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
    const ConsultationModel = getResourceModel("consultations");
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

    // Find consultation if exists
    let consultation = null;
    const consultationId = appointment.Consultation_ID;
    if (consultationId) {
      consultation = await ConsultationModel.findOne({
        $or: [
          { Consultation_ID: consultationId },
          { id: consultationId },
          { Appointment_ID: appointment.id || appointment._id?.toString() },
        ],
      }).exec();
    }

    // Format response
    const appointmentObj = typeof appointment.toObject === "function" ? appointment.toObject() : appointment;
    const consultationObj = consultation ? (typeof consultation.toObject === "function" ? consultation.toObject() : consultation) : null;
    
    // Merge consultation data into appointment object for backward compatibility
    if (consultationObj) {
      if (consultationObj.Vitals) appointmentObj.Vitals = consultationObj.Vitals;
      if (consultationObj.Complaints) appointmentObj.Complaints = consultationObj.Complaints;
      if (consultationObj.Diagnosis) appointmentObj.Diagnosis = consultationObj.Diagnosis;
      if (consultationObj.Medications) appointmentObj.Medications = consultationObj.Medications;
      if (consultationObj.Advice) appointmentObj.Advice = consultationObj.Advice;
      if (consultationObj.Investigations) appointmentObj.Investigations = consultationObj.Investigations;
      if (consultationObj.FollowUp) appointmentObj.FollowUp = consultationObj.FollowUp;
      if (consultationObj.Invoice) appointmentObj.Invoice = consultationObj.Invoice;
    }
    
    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Appointment data loaded:`, {
      appointmentId: appointmentObj.id || appointmentObj._id,
      consultationId: consultationObj?.Consultation_ID || consultationObj?.id,
      hasConsultation: !!consultationObj,
      hasInvoice: !!appointmentObj.Invoice,
      invoiceCount: appointmentObj.Invoice?.length || 0,
    });
    
    res.json({
      appointment: appointmentObj,
      patient: patient ? (typeof patient.toObject === "function" ? patient.toObject() : patient) : null,
      consultation: consultationObj,
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

    // Validation
    if (!appointmentId) {
      return res.status(400).json({ message: "Appointment ID is required" });
    }

    if (!consultationData || typeof consultationData !== "object") {
      return res.status(400).json({ message: "Consultation data is required" });
    }

    // Validate vitals if provided
    if (consultationData.vitals) {
      const vitals = consultationData.vitals;
      if (vitals.temperature && isNaN(parseFloat(vitals.temperature))) {
        return res.status(400).json({ message: "Temperature must be a valid number" });
      }
      if (vitals.pulse && isNaN(parseFloat(vitals.pulse))) {
        return res.status(400).json({ message: "Pulse must be a valid number" });
      }
      if (vitals.weight && isNaN(parseFloat(vitals.weight))) {
        return res.status(400).json({ message: "Weight must be a valid number" });
      }
      if (vitals.height && isNaN(parseFloat(vitals.height))) {
        return res.status(400).json({ message: "Height must be a valid number" });
      }
    }

    // Validate medications if provided
    if (consultationData.medications && Array.isArray(consultationData.medications)) {
      for (const med of consultationData.medications) {
        if (!med.medicine || typeof med.medicine !== "string" || med.medicine.trim() === "") {
          return res.status(400).json({ message: "All medications must have a valid medicine name" });
        }
      }
    }

    // Validate invoice if provided
    if (consultationData.invoice && Array.isArray(consultationData.invoice)) {
      for (const inv of consultationData.invoice) {
        if (!inv.item || typeof inv.item !== "string" || inv.item.trim() === "") {
          return res.status(400).json({ message: "All invoice items must have a service/item name" });
        }
        if (inv.price === undefined || inv.price === null || isNaN(Number(inv.price))) {
          return res.status(400).json({ message: "All invoice items must have a valid price" });
        }
        if (Number(inv.price) < 0) {
          return res.status(400).json({ message: "Invoice prices cannot be negative" });
        }
      }
    }

    // Validate arrays are actually arrays
    if (consultationData.complaints && !Array.isArray(consultationData.complaints)) {
      return res.status(400).json({ message: "Complaints must be an array" });
    }
    if (consultationData.diagnosis && !Array.isArray(consultationData.diagnosis)) {
      return res.status(400).json({ message: "Diagnosis must be an array" });
    }
    if (consultationData.advice && !Array.isArray(consultationData.advice)) {
      return res.status(400).json({ message: "Advice must be an array" });
    }
    if (consultationData.investigations && !Array.isArray(consultationData.investigations)) {
      return res.status(400).json({ message: "Investigations must be an array" });
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

    // Get Consultation Model
    const ConsultationModel = getResourceModel("consultations");
    const appointmentIdValue = appointment.id || appointment._id?.toString() || appointmentId;
    
    // Generate Consultation ID
    const consultationId = `CONS${Date.now().toString().slice(-8)}`;
    const consultationIdValue = `${consultationId}-${Math.random().toString(36).slice(2, 7)}`;

    // Prepare consultation document data
    const consultationDocument: any = {
      id: consultationIdValue,
      Consultation_ID: consultationId,
      Appointment_ID: appointmentIdValue,
      Patient: appointment.Patient || "",
      Patient_Image: appointment.Patient_Image || "",
      Doctor: appointment.Doctor || "",
      Doctor_Image: appointment.Doctor_Image || "",
      Status: completeAppointment ? "Completed" : "Draft",
      Consultation_Date: new Date(),
    };

    // Add consultation data fields
    if (consultationData?.vitals && Object.keys(consultationData.vitals).length > 0) {
      consultationDocument.Vitals = consultationData.vitals;
    }
    if (consultationData?.complaints && Array.isArray(consultationData.complaints) && consultationData.complaints.length > 0) {
      consultationDocument.Complaints = consultationData.complaints;
    }
    if (consultationData?.diagnosis && Array.isArray(consultationData.diagnosis) && consultationData.diagnosis.length > 0) {
      consultationDocument.Diagnosis = consultationData.diagnosis;
    }
    if (consultationData?.medications && Array.isArray(consultationData.medications) && consultationData.medications.length > 0) {
      consultationDocument.Medications = consultationData.medications;
    }
    if (consultationData?.advice && Array.isArray(consultationData.advice) && consultationData.advice.length > 0) {
      consultationDocument.Advice = consultationData.advice;
    }
    if (consultationData?.investigations && Array.isArray(consultationData.investigations) && consultationData.investigations.length > 0) {
      consultationDocument.Investigations = consultationData.investigations;
    }
    if (consultationData?.followUp && Object.keys(consultationData.followUp).length > 0) {
      consultationDocument.FollowUp = consultationData.followUp;
    }
    if (consultationData?.invoice && Array.isArray(consultationData.invoice) && consultationData.invoice.length > 0) {
      consultationDocument.Invoice = consultationData.invoice;
    }

    if (completeAppointment) {
      consultationDocument.Completed_At = new Date();
    }

    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Creating consultation document:`, {
      consultationId: consultationDocument.Consultation_ID,
      appointmentId: consultationDocument.Appointment_ID,
      hasVitals: !!consultationDocument.Vitals,
      hasComplaints: !!consultationDocument.Complaints,
      hasDiagnosis: !!consultationDocument.Diagnosis,
      hasMedications: !!consultationDocument.Medications,
      medicationsCount: consultationDocument.Medications?.length || 0,
      hasAdvice: !!consultationDocument.Advice,
      hasInvestigations: !!consultationDocument.Investigations,
      hasFollowUp: !!consultationDocument.FollowUp,
      hasInvoice: !!consultationDocument.Invoice,
      invoiceCount: consultationDocument.Invoice?.length || 0,
      status: consultationDocument.Status,
    });

    // Check if consultation already exists for this appointment
    let consultation = await ConsultationModel.findOne({
      Appointment_ID: appointmentIdValue,
    }).exec();

    if (consultation) {
      // Update existing consultation
      Object.assign(consultation, consultationDocument);
      await consultation.save();
      // eslint-disable-next-line no-console
      console.log(`[Consultation Controller] Database: ${dbName} - Updated existing consultation:`, {
        consultationId: consultation.Consultation_ID || consultation.id,
        appointmentId: consultation.Appointment_ID,
      });
    } else {
      // Create new consultation
      consultation = await ConsultationModel.create(consultationDocument);
      // eslint-disable-next-line no-console
      console.log(`[Consultation Controller] Database: ${dbName} - Created new consultation:`, {
        consultationId: consultation.Consultation_ID || consultation.id,
        appointmentId: consultation.Appointment_ID,
      });
    }

    // Update appointment with consultation ID reference
    appointment.Consultation_ID = consultation.Consultation_ID || consultation.id;

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
      consultationId: appointment.Consultation_ID,
      status: appointment.Status,
    });

    // If completing appointment and medications exist, create prescription records
    // eslint-disable-next-line no-console
    console.log(`[Consultation Controller] Database: ${dbName} - Checking prescription creation conditions:`, {
      completeAppointment,
      hasMedications: !!consultationData?.medications,
      medicationsLength: consultationData?.medications?.length || 0,
      medications: consultationData?.medications || [],
      consultationId: consultation?.Consultation_ID || consultation?.id,
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

          // Ensure appointment ID is properly saved - use both id and _id for compatibility
          const appointmentIdValue = appointment.id || appointment._id?.toString() || appointmentId;
          
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
            Appointment_ID: appointmentIdValue,
            Consultation_ID: consultation?.Consultation_ID || consultation?.id || "",
            // Also store as appointmentId for consistency
            appointmentId: appointmentIdValue,
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
                $and: [
                  {
                    $or: [
                      { Appointment_ID: prescriptionData.Appointment_ID },
                      { appointmentId: appointmentIdValue }
                    ]
                  },
                  { Medicine: prescriptionData.Medicine },
                  { Patient: prescriptionData.Patient },
                ]
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
