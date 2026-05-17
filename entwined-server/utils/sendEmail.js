const nodemailer = require("nodemailer");

const buildTransportConfig = () => {
  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    };
  }

  return {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };
};

const sendEmail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const error = new Error("Email service is not configured");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  const transporter = nodemailer.createTransport(buildTransportConfig());

  const mailOptions = {
    from: `Your App <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    if (
      error.responseCode === 534 ||
      error.response?.includes("Application-specific password required")
    ) {
      error.code = "EMAIL_APP_PASSWORD_REQUIRED";
    }

    throw error;
  }
};

module.exports = sendEmail;
