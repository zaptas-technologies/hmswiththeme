/**
 * Hospital notification orchestration: appointment confirmations, prescription ready, leave requests.
 * Uses email and WhatsApp services; runs fire-and-forget so controllers are not blocked.
 */
import { sendMail } from "./emailService";
import { sendWhatsApp } from "./whatsappService";
import { getEmailConfig, getWhatsAppConfig, getNotificationFlags } from "../config/notifications";

const hospitalName = () => process.env.HOSPITAL_NAME || "Hospital";

// ---- Appointment confirmation ----
export type AppointmentNotificationPayload = {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorName: string;
  dateTime: string;
  mode?: string;
  fees?: string | number;
};

export function sendAppointmentConfirmation(payload: AppointmentNotificationPayload): void {
  const flags = getNotificationFlags();
  const emailConfig = getEmailConfig();
  const whatsappConfig = getWhatsAppConfig();

  const subject = `Appointment confirmed – ${hospitalName()}`;
  const text = `Dear ${payload.patientName}, your appointment with Dr. ${payload.doctorName} is confirmed for ${payload.dateTime}. Mode: ${payload.mode || "In-Person"}. ${hospitalName()}.`;
  const html = `
    <p>Dear ${payload.patientName},</p>
    <p>Your appointment has been confirmed.</p>
    <ul>
      <li><strong>Doctor:</strong> Dr. ${payload.doctorName}</li>
      <li><strong>Date & Time:</strong> ${payload.dateTime}</li>
      <li><strong>Mode:</strong> ${payload.mode || "In-Person"}</li>
      ${payload.fees != null ? `<li><strong>Fees:</strong> ₹${payload.fees}</li>` : ""}
    </ul>
    <p>Thank you,<br/>${hospitalName()}</p>
  `;

  if (flags.appointmentEmail && emailConfig.enabled && payload.patientEmail) {
    sendMail({
      to: payload.patientEmail,
      subject,
      html,
      text,
    }).catch(() => {});
  }

  if (flags.appointmentWhatsApp && whatsappConfig.enabled && payload.patientPhone) {
    sendWhatsApp(payload.patientPhone, text).catch(() => {});
  }
}

// ---- Prescription / medicine dispensed ----
export type PrescriptionDispensedPayload = {
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  doctorName: string;
  amountPaid?: number;
};

export function sendPrescriptionDispensed(payload: PrescriptionDispensedPayload): void {
  const flags = getNotificationFlags();
  const emailConfig = getEmailConfig();
  const whatsappConfig = getWhatsAppConfig();

  const subject = `Your medicines are ready – ${hospitalName()}`;
  const text = `Dear ${payload.patientName}, your prescription from Dr. ${payload.doctorName} has been dispensed. ${payload.amountPaid != null ? `Amount paid: ₹${payload.amountPaid}.` : ""} Thank you, ${hospitalName()}.`;
  const html = `
    <p>Dear ${payload.patientName},</p>
    <p>Your prescription has been dispensed.</p>
    <ul>
      <li><strong>Doctor:</strong> Dr. ${payload.doctorName}</li>
      ${payload.amountPaid != null ? `<li><strong>Amount paid:</strong> ₹${payload.amountPaid}</li>` : ""}
    </ul>
    <p>Thank you,<br/>${hospitalName()}</p>
  `;

  if (flags.prescriptionEmail && emailConfig.enabled && payload.patientEmail) {
    sendMail({ to: payload.patientEmail, subject, html, text }).catch(() => {});
  }

  if (flags.prescriptionWhatsApp && whatsappConfig.enabled && payload.patientPhone) {
    sendWhatsApp(payload.patientPhone, text).catch(() => {});
  }
}

// ---- Leave request (notify admin) ----
export type LeaveRequestPayload = {
  adminEmail: string;
  doctorName: string;
  days: number;
  reason: string;
  startDate: string;
  endDate: string;
};

export function sendLeaveRequestNotification(payload: LeaveRequestPayload): void {
  const flags = getNotificationFlags();
  const emailConfig = getEmailConfig();
  if (!flags.leaveRequestEmail || !emailConfig.enabled || !payload.adminEmail) return;

  const subject = `Leave request from Dr. ${payload.doctorName} – ${hospitalName()}`;
  const html = `
    <p>A new leave request has been submitted.</p>
    <ul>
      <li><strong>Doctor:</strong> ${payload.doctorName}</li>
      <li><strong>Duration:</strong> ${payload.days} day(s)</li>
      <li><strong>Reason:</strong> ${payload.reason}</li>
      <li><strong>From:</strong> ${payload.startDate}</li>
      <li><strong>To:</strong> ${payload.endDate}</li>
    </ul>
    <p>Please review in the admin dashboard.</p>
    <p>${hospitalName()}</p>
  `;
  sendMail({
    to: payload.adminEmail,
    subject,
    html,
    text: `Leave request from Dr. ${payload.doctorName}: ${payload.days} day(s), ${payload.startDate} to ${payload.endDate}. Reason: ${payload.reason}.`,
  }).catch(() => {});
}
