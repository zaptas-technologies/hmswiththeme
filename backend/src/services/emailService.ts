import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getEmailConfig } from "../config/notifications";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const config = getEmailConfig();
  if (!config.enabled) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
  return transporter;
}

export type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

/**
 * Send an email. No-op if email is not configured.
 * Resolves to { sent: true } or { sent: false, error }.
 */
export async function sendMail(options: SendMailOptions): Promise<{ sent: boolean; error?: string }> {
  const config = getEmailConfig();
  if (!config.enabled) {
    return { sent: false, error: "Email not configured" };
  }
  const transport = getTransporter();
  if (!transport) return { sent: false, error: "Email transport not available" };

  try {
    await transport.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });
    return { sent: true };
  } catch (err: any) {
    const message = err?.message || String(err);
    // eslint-disable-next-line no-console
    console.error("[Email] send failed:", message);
    return { sent: false, error: message };
  }
}
