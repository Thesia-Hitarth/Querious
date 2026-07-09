import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  const mailUser = process.env.GMAIL_USER || process.env.SMTP_USER || "";
  const mailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "";

  // Default to Gmail SMTP settings if GMAIL_USER is specified, otherwise use Mailtrap as fallback
  const defaultHost = (process.env.GMAIL_USER || process.env.SMTP_USER?.includes("gmail")) ? "smtp.gmail.com" : "smtp.mailtrap.io";
  const defaultPort = (process.env.GMAIL_USER || process.env.SMTP_USER?.includes("gmail")) ? 587 : 2525;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || defaultHost,
    port: parseInt(process.env.SMTP_PORT) || defaultPort,
    secure: false,
    auth: {
      user: mailUser,
      pass: mailPass,
    },
  });

  return transporter;
};

export const sendResetEmail = async (email, resetLink) => {
  const mailUser = process.env.GMAIL_USER || process.env.SMTP_USER || "";
  let activeTransporter = getTransporter();

  if (!mailUser && process.env.NODE_ENV !== "production") {
    try {
      const testAccount = await nodemailer.createTestAccount();
      activeTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.warn("Could not create Ethereal test email account, logging to console instead:", err.message);
    }
  }

  const senderEmail = mailUser || "support@querious.com";
  const mailOptions = {
    from: `"Querious Support" <${senderEmail}>`,
    to: email,
    subject: "Password Reset Request - Querious",
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #f48225; margin-bottom: 20px;">Password Reset Request</h2>
        <p>You requested a password reset for your Querious account. Click the button below to reset your password:</p>
        <div style="margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #f48225; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #666;">This link is valid for 15 minutes. If you did not make this request, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999;">Querious Inc. • 123 Dev Lane, Stack City</p>
      </div>
    `,
  };

  const info = await activeTransporter.sendMail(mailOptions);
  
  if (!mailUser && process.env.NODE_ENV !== "production") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("========================================");
      console.log(`[Ethereal Email Sent] Preview URL: ${previewUrl}`);
      console.log("========================================");
    }
  }
  return info;
};
