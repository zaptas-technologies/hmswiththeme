/**
 * Notifications configuration (Email + WhatsApp).
 * All values are read from environment variables. Paste your credentials in .env.
 *
 * Required in .env:
 * - Email: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
 * - WhatsApp (Twilio): TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 *
 * Optional feature flags (set to "true" to enable):
 * - NOTIFY_APPOINTMENT_EMAIL, NOTIFY_APPOINTMENT_WHATSAPP
 * - NOTIFY_PRESCRIPTION_EMAIL, NOTIFY_PRESCRIPTION_WHATSAPP
 * - NOTIFY_LEAVE_REQUEST_EMAIL
 */

export type EmailConfig = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export type WhatsAppConfig = {
  enabled: boolean;
  accountSid: string;
  authToken: string;
  /** Twilio WhatsApp sender (e.g. whatsapp:+14155238886 for sandbox, or your WhatsApp Business number) */
  from: string;
};

export type NotificationFeatureFlags = {
  appointmentEmail: boolean;
  appointmentWhatsApp: boolean;
  prescriptionEmail: boolean;
  prescriptionWhatsApp: boolean;
  leaveRequestEmail: boolean;
};

const parseBool = (v: string | undefined): boolean =>
  String(v || "").toLowerCase() === "true" || String(v || "").toLowerCase() === "1";

export function getEmailConfig(): EmailConfig {
  const host = process.env.EMAIL_HOST || "";
  const port = parseInt(process.env.EMAIL_PORT || "587", 10);
  const user = process.env.EMAIL_USER || "";
  const pass = process.env.EMAIL_PASS || "";
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@hospital.com";
  const secure = parseBool(process.env.EMAIL_SECURE) || port === 465;
  const enabled = Boolean(host && user && pass);
  return { enabled, host, port, secure, user, pass, from };
}

export function getWhatsAppConfig(): WhatsAppConfig {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  /** e.g. whatsapp:+14155238886 (Twilio sandbox) or whatsapp:+919876543210 (your WhatsApp Business number) */
  const from = process.env.TWILIO_WHATSAPP_FROM || "";
  const enabled = Boolean(accountSid && authToken && from);
  return { enabled, accountSid, authToken, from };
}

export function getNotificationFlags(): NotificationFeatureFlags {
  return {
    appointmentEmail: parseBool(process.env.NOTIFY_APPOINTMENT_EMAIL) ?? true,
    appointmentWhatsApp: parseBool(process.env.NOTIFY_APPOINTMENT_WHATSAPP) ?? true,
    prescriptionEmail: parseBool(process.env.NOTIFY_PRESCRIPTION_EMAIL) ?? true,
    prescriptionWhatsApp: parseBool(process.env.NOTIFY_PRESCRIPTION_WHATSAPP) ?? true,
    leaveRequestEmail: parseBool(process.env.NOTIFY_LEAVE_REQUEST_EMAIL) ?? true,
  };
}

export function isAnyNotificationEnabled(): boolean {
  const email = getEmailConfig();
  const whatsapp = getWhatsAppConfig();
  return email.enabled || whatsapp.enabled;
}
