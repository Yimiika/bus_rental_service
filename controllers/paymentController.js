const axios = require("axios")
const { payment, trips, buses, users } = require("../models")
require("dotenv").config()


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
        callback_url: "http://localhost:3000/api/payments/verify",
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

    const busPayment = await payment.findOne({
      where: { trip_id },
      include: {
        model: trips,
        include: [ users, buses ]
      }
    });

    if(!busPayment || busPayment.trips) {
      return res.status(404).json({ message:"Payment not found" })
    }

    const tripPayment = busPayment.trips
    const userPayment = tripPayment.users;
    const bus = tripPayment.buses;

    const summary = {
        customer_name: `${userPayment.first_name} ${userPayment.last_name}`,
        bus_type: bus.vehicle_type,
        duration: tripPayment.duration,
        booking_type: tripPayment.booking_type,
        pickup_date: tripPayment.pickup_date,
        total_amount: busPayment.amount,
        payment_method: busPayment.payment_method,
        payment_status: busPayment.payment_status
    };

    return res.status(200).json({
      message: "Booking Summary",
      data: summary
    })
  } catch (error) {
    return res.status(500).json({error: error.message})
  }
}

async function generateReceipt(req, res) {
  try {
    const { trip_id } = req.params
    const busPayment = await payment.findOne({
      where: { trip_id },
      include: {
        model: trips,
        include: [ users, buses ]
      }
    });

    if(!busPayment || busPayment.trips ) {
      return res.status(404).json({ message: "Payment or Trip not found" })
    }

    const tripPayment = busPayment.trips;
    const userPayment = tripPayment.users;
    const bus = tripPayment.buses;

    const filePath = await generateReceiptPDF(
      tripPayment,
      userPayment,
      bus,
      busPayment
    );

    return res.status(200).json({
      message: "Receipt generated",
      data: { filePath }
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}

async function sendEmailReceipt(req, res) {
  try {
    const { trip_id } = req.params;

    const busPayment = await payment.findOne({
      where: { trip_id },
      include: {
        model: trips,
        include: [users, buses],
      },
    });

    if (!busPayment || !busPayment.trips) {
      return res.status(404).json({ message: "Payment or trip not found" })
    }

    const tripPayment = busPayment.trips;
    const userPayment = tripPayment.users;
    const bus = tripPayment.buses;

    const filePath = await getReceipt(
      tripPayment,
      userPayment,
      bus,
      busPayment
    );

    await sendEmail(userPayment.email_address, filePath, tripPayment.id);

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