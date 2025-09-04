// backend/utils/mailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@example.com";

let transporter = null;
if (SMTP_HOST && SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

export const sendMail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log("No SMTP configured — email content:");
    console.log("TO:", to, "SUBJECT:", subject, "HTML:", html);
    return;
  }
  await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
};
