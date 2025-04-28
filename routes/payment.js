const express = require("express")
const paymentRouter = express.Router()
const paymentController = require("../controllers/paymentController");
const verifyUser = require("../middleware/verifyUser");


paymentRouter.post("/initialize-payment", verifyUser, paymentController.initializePayment);
paymentRouter.get("/summary/:trip_id", verifyUser ,paymentController.getPaymentSummary);
paymentRouter.get("/receipt/:trip_id", verifyUser,paymentController.generateReceipt);
paymentRouter.get("/send-receipt/:trip_id", verifyUser,paymentController.sendEmailReceipt);

module.exports = paymentRouter