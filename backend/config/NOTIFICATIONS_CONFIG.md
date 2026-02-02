# Email & WhatsApp Configuration

All notification settings are read from **environment variables**. Paste your values in the backend `.env` file (copy from `.env.example` if needed).

## Quick setup

1. Copy `.env.example` to `.env` (or add the variables below to your existing `.env`).
2. Fill in **Email** and/or **WhatsApp** credentials.
3. Restart the backend. Notifications will be sent when:
   - A new **appointment** is created (confirmation to patient via email + WhatsApp).
   - A **prescription** is dispensed at pharmacy (notification to patient).
   - A **leave request** is submitted by a doctor (email to hospital admin).

---

## Email (SMTP)

| Variable       | Description |
|----------------|-------------|
| `EMAIL_HOST`   | SMTP server (e.g. `smtp.gmail.com`, `smtp.office365.com`) |
| `EMAIL_PORT`  | Port (587 for TLS, 465 for SSL) |
| `EMAIL_USER`  | Your SMTP login email |
| `EMAIL_PASS`  | SMTP password (for Gmail use an [App Password](https://support.google.com/accounts/answer/185833)) |
| `EMAIL_FROM`  | Sender address shown to recipients (defaults to `EMAIL_USER` if not set) |
| `EMAIL_SECURE`| Set to `true` if using port 465 |

**Example (Gmail):**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=hospital@gmail.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
EMAIL_FROM=hospital@gmail.com
```

---

## WhatsApp (Twilio)

1. Create an account at [twilio.com](https://www.twilio.com).
2. In Twilio Console: **Account** → **API keys & tokens** → copy **Account SID** and **Auth Token**.
3. **Testing:** Enable [WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn) and join with your phone; use the sandbox “From” number (e.g. `whatsapp:+14155238886`).
4. **Production:** Use [Twilio WhatsApp Business](https://www.twilio.com/whatsapp) and your own WhatsApp Business number (e.g. `whatsapp:+919876543210`).

| Variable               | Description |
|------------------------|-------------|
| `TWILIO_ACCOUNT_SID`   | Twilio Account SID |
| `TWILIO_AUTH_TOKEN`    | Twilio Auth Token |
| `TWILIO_WHATSAPP_FROM` | Sender: `whatsapp:+&lt;number&gt;` (e.g. `whatsapp:+14155238886` or `whatsapp:+919876543210`) |

**Recipient format:** Patient phone numbers are normalized to E.164 (e.g. `9876543210` → `919876543210`). Default country code is India (91). Ensure appointments/patients have a valid phone number.

---

## Optional

| Variable | Description |
|----------|-------------|
| `HOSPITAL_NAME` | Name shown in email/WhatsApp body (e.g. "Apollo Clinic") |
| `NOTIFY_APPOINTMENT_EMAIL` | `true` / `false` – send appointment confirmation by email |
| `NOTIFY_APPOINTMENT_WHATSAPP` | `true` / `false` – send appointment confirmation by WhatsApp |
| `NOTIFY_PRESCRIPTION_EMAIL` | `true` / `false` – send “prescription dispensed” by email |
| `NOTIFY_PRESCRIPTION_WHATSAPP` | `true` / `false` – send “prescription dispensed” by WhatsApp |
| `NOTIFY_LEAVE_REQUEST_EMAIL` | `true` / `false` – send leave request alert to admin by email |

If email or WhatsApp is not configured (missing credentials), that channel is skipped without errors.
