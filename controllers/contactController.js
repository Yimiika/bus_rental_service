const { contacts } = require("../models") 
const nodemailer = require("nodemailer")

async function contactUs(req, res) {
  const { first_name, last_name, email, subject, message_text } = req.body;
  
  
  try {
    if (!first_name || !last_name || !email || !subject || !message_text) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }    
    // console.log("Creating contact...");

    const contact = await contacts.create({
      first_name,
      last_name,
      email,
      subject,
      message_text,
    });

    // console.log("Contact created:", contact.id);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    
    const mailOptions = {
      from: email,
      to: process.env.COMPANY_EMAIL,
      subject: `Bus Rental Contact: ${subject}`,
      text: `
        Name: ${first_name} ${last_name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message_text}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${first_name} ${last_name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message_text.replace(/\n/g, "<br>")}</p>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    
    console.log({
      EMAIL_USER: process.env.EMAIL_USER,
      email,
      COMPANY_EMAIL: process.env.COMPANY_EMAIL,
    }); 

    res.status(201).json({ 
      success: true, 
      message: 'Contact form submitted successfully',
      data: contact
    });
  } catch (err) {
    console.error("Contact form error:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  } 
}

module.exports = { contactUs }
