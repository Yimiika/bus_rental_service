const express = require("express")
const contactRouter = express.Router()
const contactController = require("../controllers/contactController")
const validateContact = require("../middleware/validateContact")
const contactLimiter = require("../middleware/contactLimiter")


contactRouter.post("/contact", contactLimiter , validateContact, contactController.contactUs)


module.exports = contactRouter