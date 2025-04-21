const express = require("express")
const paymentRouter = express.Router()
const paymentController = require("../controllers/paymentController")


paymentRouter.post("/initialize-payment", paymentController.initializePayment);
paymentRouter.get("/verify", paymentController.verifyPayment);
paymentRouter.get("/summary/:trip_id", paymentController.getPaymentSummary);
paymentRouter.get("/receipt/:trip_id", paymentController.generateReceipt);
paymentRouter.get("/send-receipt/:trip_id", paymentController.sendEmailReceipt);

module.exports = paymentRouter