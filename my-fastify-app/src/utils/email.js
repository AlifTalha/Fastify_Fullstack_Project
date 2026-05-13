"use strict";

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send a forgot-password OTP email.
 * @param {string} to  - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
async function sendOtpEmail(to, otp) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Your Password Reset OTP",
    text: `Your OTP for password reset is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px;">
        <h2 style="color:#333;">Password Reset OTP</h2>
        <p style="color:#555;">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f5f5f5;border-radius:6px;color:#222;">
          ${otp}
        </div>
        <p style="color:#888;font-size:13px;margin-top:20px;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };
