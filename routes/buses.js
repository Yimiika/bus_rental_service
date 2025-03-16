const express = require('express')
const busesRouter = express.Router()
const busesController = require('../controllers/busesController')
const verifyOwner = require("../middleware/verifyOwner")
const verifyAdmin = require("../middleware/verifyAdmin")


busesRouter.get("/", busesController.getAllBuses)
busesRouter.get("/:id", busesController.getBus);
busesRouter.post("/", verifyOwner , busesController.addBus)
busesRouter.put("/:id", (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res
      .status(403)
      .json({ message: "Unauthorized: User role not found" });
  }
  if (req.user.role.toLowerCase() === "admin") {
    return verifyAdmin(req, res, () => busesController.updateBusDetails(req, res, next) );
  }
  return verifyOwner(req, res, () => busesController.updateBusDetails(req, res, next))
});

busesRouter.put("/:id/verify", verifyAdmin, busesController.verifyBuses);

busesRouter.delete("/:id", (req, res, next) => {
  if (req.user.role.toLowerCase() === "admin") {
    return verifyAdmin(req, res, () => busesController.deleteBus(req, res, next));
  }
  return verifyOwner(req, res, () => busesController.deleteBus(req, res, next))
});

module.exports = busesRouter