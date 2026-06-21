const nodemailer = require("nodemailer");

const sendVerificationEmail = async (toEmail, username, token) => {
  // CLIENT_URL is your frontend URL e.g. http://localhost:5173
  const verifyURL = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "Gmail", // or use host/port for other providers
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Entwined 📚" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your Entwined account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Welcome to Entwined, ${username}! 📖</h2>
        <p>Thanks for signing up. Please verify your email to activate your account.</p>
        <a href="${verifyURL}"
           style="display:inline-block; padding:12px 24px; background:#5c3d2e;
                  color:#fff; border-radius:6px; text-decoration:none; font-size:16px;">
          Verify my Email
        </a>
        <p style="margin-top:16px; color:#888; font-size:13px;">
          This link expires in <strong>24 hours</strong>. If you didn't sign up, ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationEmail;