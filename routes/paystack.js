const express = require("express")
const paystackRouter = express.Router()
const paymentController = require("../controllers/paymentController");



paystackRouter.get("/verify", paymentController.verifyPayment);

module.exports = paystackRouter