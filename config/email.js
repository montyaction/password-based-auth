const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

if (process.env.NODE_ENV === 'production') {
  // Production email configuration
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    }
  });
} else {
  // Development/testing email configuration using Ethereal
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.ethereal.email",
    port: process.env.EMAIL_PORT || 587,
    auth: {
      user: process.env.EMAIL_USER || "lemuel.pagac@ethereal.email",
      pass: process.env.EMAIL_PASSWORD || "qHtdUK78UsdfpzSCwf",
    },
  });
}

module.exports = { transporter };