const axios = require("axios")
const { payment, messages } = require("../models")
const pdfDoc = require("pdfkit")
const fs = require("fs")
require("dotenv").config()
const nodemailer = require("nodemailer");


const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET

async function initializePayment(req, res) {
  try {
    const { email, amount, trip_id, payment_method } = req.body

    const amountInKobo = amount * 100

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amountInKobo,
        callback_url: "https://yourapp.com/api/payments/verify",
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-type": "application/json",
        },
      }
    );
    if (response.data.status) {
      await payment.create({
        trip_id,
        amount,
        payment_method,
        payment_status: "Pending"
      })

      return res.status(200).json({
        message: "Payment link is generated",
        data: response.data.data
      })
    } else {
      return res.status(400).json({ message: "Payment initialization failed!" })
    }
  } catch (error) {
    return res.status(500).json({error: error.message})
  }
}

async function verifyPayment(req, res) {
  try {
    const { reference } = req.query

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`}
      },
    );
    const paymentData = response.data.data

    if (paymentData.status === "success") {
      await payment.update(
        { payment_status: "Completed" },
        { where: { trip_id: paymentData.metadata.trip_id } }
      )
      return res.status(200).json({ message: "Payment successfully verified" })
    } else {
      return res.status(200).json({ message: "Payment verification failed" })
    }
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function getPaymentSummary(req, res) {
  try {
    const { trip_id } = req.params

    const busPayment = await payment.findOne({ where: { trip_id } })

    if(!busPayment) {
      return res.status(404).json({ message:"Payment not found" })
    }

    return res.status(200).json({
      message: "Payment Summary",
      data: {
        trip_id: busPayment.trip_id,
        amount: busPayment.amount,
        payment_method: busPayment.payment_method,
        payment_status: busPayment.payment_status,
        created_at: busPayment.created_at
      }
    })
  } catch (error) {
    return res.status(500).json({error: error.message})
  }
}

async function generateReceipt(req, res) {
  try {
    const { trip_id } = req.params
    const busPayment = await payment.findOne({ where: { trip_id } })

    if(!busPayment) {
      return res.status(404).json({ message: "Payment not found" })
    }

    const doc = new pdfDoc()
    const fileName = `receipt_${trip_id}.pdf`
    const filePath = `./receipts/${fileName}`

    doc.pipe(fs.createWriteStream(filePath))

    doc.fontSize(20).text("ValueRide Rental", { align: "center" })
    doc.moveDown()
    doc.fontSize(16).text(`Trip ID: ${busPayment.trip_id}`)
    doc.text(`Amount Paid: ₦${busPayment.amount}`);
    doc.text(`Payment Method: ${busPayment.payment_method}`);
    doc.text(`Payment Status: ${busPayment.payment_status}`);
    doc.text(`Date: ${ new Date(busPayment.created_at).toLocaleString()}`)
    doc.end()

    return res.status(200).json({
      message: "Receipt generated",
      filePath
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function sendEmailReceipt(req, res) {
  try {
    const { trip_id, email } = req.body;
    const filePath = `./receipts/receipt_${trip_id}.pdf`;

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
      subject: "Payment Receipt",
      text: "Thank you for your payment. Find your receipt attached.",
      attachments: [{ filename: `receipt_${trip_id}.pdf`, path: filePath }],
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Receipt sent to email" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error sending email", error: error.message });
  }
}
module.exports = {
  initializePayment,
  verifyPayment,
  getPaymentSummary,
  generateReceipt,
  sendEmailReceipt
}