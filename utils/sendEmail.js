const nodemailer = require("nodemailer");

const sendEmail = async (email, filePath, tripPayment) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Receipt for Trip #${tripPayment}`,
    text: `Attached is your receipt for your recent bus booking.`,
    attachments: [
      {
        filename: `receipt_${tripPayment}.pdf`,
        path: filePath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
