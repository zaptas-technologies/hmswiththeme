import { getWhatsAppConfig } from "../config/notifications";

/**
 * Normalize phone to E.164 for Twilio WhatsApp: digits only, with country code.
 * e.g. "9876543210" -> "919876543210", "+91 98765 43210" -> "919876543210"
 */
export function normalizeWhatsAppNumber(phone: string, defaultCountryCode = "91"): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10 && defaultCountryCode) return defaultCountryCode + digits;
  if (digits.length === 11 && digits.startsWith("0")) return defaultCountryCode + digits.slice(1);
  if (digits.length >= 10) return digits;
  return "";
}

/**
 * Send a WhatsApp message via Twilio.
 * "to" should be E.164 (e.g. 919876543210). We prepend "whatsapp:" for Twilio.
 * Resolves to { sent: true } or { sent: false, error }.
 */
export async function sendWhatsApp(to: string, body: string): Promise<{ sent: boolean; error?: string }> {
  const config = getWhatsAppConfig();
  if (!config.enabled) {
    return { sent: false, error: "WhatsApp not configured" };
  }

  const normalized = normalizeWhatsAppNumber(to);
  if (!normalized) {
    return { sent: false, error: "Invalid or missing phone number" };
  }

  const twilio = await import("twilio");
  const client = twilio.default(config.accountSid, config.authToken);
  const toWhatsApp = `whatsapp:${normalized}`;
  const from = config.from.startsWith("whatsapp:") ? config.from : `whatsapp:${config.from.replace(/\D/g, "")}`;

  try {
    await client.messages.create({
      body,
      from,
      to: toWhatsApp,
    });
    return { sent: true };
  } catch (err: any) {
    const message = err?.message || String(err);
    // eslint-disable-next-line no-console
    console.error("[WhatsApp] send failed:", message);
    return { sent: false, error: message };
  }
}
