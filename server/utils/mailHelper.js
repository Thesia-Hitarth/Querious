import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

export const sendResetEmail = async (email, resetLink) => {
  let activeTransporter = transporter;

  if (!process.env.SMTP_USER && process.env.NODE_ENV !== "production") {
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

  const mailOptions = {
    from: `"Querious Support" <support@querious.com>`,
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
  
  if (!process.env.SMTP_USER && process.env.NODE_ENV !== "production") {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("========================================");
      console.log(`[Ethereal Email Sent] Preview URL: ${previewUrl}`);
      console.log("========================================");
    }
  }
  return info;
};
