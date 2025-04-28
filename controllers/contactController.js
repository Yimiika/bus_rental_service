const { contacts } = require("../models") 
const nodemailer = require("nodemailer")

async function contactUs(req, res) {
  try {
    const { first_name, last_name, email, subject, message_text } = req.body;

    const contact = await contacts.create({
      first_name,
      last_name,
      email,
      subject,
      message_text,
    });

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || email,
      to: process.env.COMPANY_EMAIL,
      subject: `Bus Rental Contact: ${subject}`,
      text: `
        first_name: ${first_name}
        last_name: ${last_name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message_text}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${first_name}</p>
        <p><strong>Name:</strong> ${last_name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message_text.replace(/\n/g, "<br>")}</p>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(201).json({ 
      success: true, 
      message: 'Contact form submitted successfully',
      data: contact
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
    });
  } 
}

module.exports = { contactUs }
