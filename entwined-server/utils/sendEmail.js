const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Entwined 📚" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  });
};

module.exports = sendEmail;