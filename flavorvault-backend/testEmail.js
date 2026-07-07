// Standalone test - run with: node testEmail.js
// This isolates the email sending from the rest of the app so we can see
// exactly what Gmail says, without anything else getting in the way.

require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("EMAIL_USER from .env:", JSON.stringify(process.env.EMAIL_USER));
console.log("EMAIL_PASS length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : "MISSING");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false },
  family: 4 // forces IPv4 - fixes ENETUNREACH on Render
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER, // sends a test email to yourself
  subject: "FlavorVault test email",
  text: "If you got this, your email setup works!"
}).then(() => {
  console.log("SUCCESS: Email sent!");
}).catch((err) => {
  console.log("FAILED:", err.message);
});
