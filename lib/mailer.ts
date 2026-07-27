import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMaliciousLoginAlert(params: {
  ip: string;
  userEmail?: string;
  userAgent?: string;
  reason: string;
}) {
  const adminEmails = (process.env.ADMIN_ALERT_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) return;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: adminEmails,
    subject: "⚠️ Blocked login attempt — VSource CRM",
    html: `
      <h3>Blocked / suspicious login attempt</h3>
      <p><b>IP:</b> ${params.ip}</p>
      <p><b>Attempted email:</b> ${params.userEmail ?? "unknown"}</p>
      <p><b>User agent:</b> ${params.userAgent ?? "unknown"}</p>
      <p><b>Reason:</b> ${params.reason}</p>
      <p><b>Time:</b> ${new Date().toISOString()}</p>
    `,
  });
}