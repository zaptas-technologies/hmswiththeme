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
    const AppointmentModel = getResourceModel("appointments");
    const { appointmentId, consultationData, completeAppointment } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: "Appointment ID is required" });
    }

    // Find appointment
    const appointment = await AppointmentModel.findOne({
      $or: [{ _id: appointmentId }, { id: appointmentId }],
    }).exec();

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

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

    const updatedAppointment = typeof appointment.toObject === "function" ? appointment.toObject() : appointment;

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
