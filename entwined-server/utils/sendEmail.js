const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
    });

  const mailOptions = {
    from: `Your App <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };
  console.log(process.env.EMAIL_USER);
  console.log(process.env.EMAIL_PASS);
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;