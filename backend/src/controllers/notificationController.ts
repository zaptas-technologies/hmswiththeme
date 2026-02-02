import { RequestHandler } from "express";
import { getEmailConfig, getWhatsAppConfig } from "../config/notifications";

/**
 * GET /api/notifications/status
 * Returns whether email and WhatsApp are configured (no credentials exposed).
 */
export const getNotificationStatus: RequestHandler = (_req, res) => {
  const email = getEmailConfig();
  const whatsapp = getWhatsAppConfig();
  res.json({
    emailConfigured: email.enabled,
    whatsappConfigured: whatsapp.enabled,
  });
};
