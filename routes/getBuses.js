const express = require('express')
const getBusesRouter = express.Router()
const getBusesController = require('../controllers/busesController')


getBusesRouter.get("/", getBusesController.getAllBuses);
getBusesRouter.get("/:id", getBusesController.getBus);


module.exports = getBusesRouter