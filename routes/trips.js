const express = require("express");
const tripController = require("../controllers/tripControllers");
const tripRouter = express.Router();

tripRouter.post("/", tripController.createTrip);
tripRouter.get("/", tripController.getAllTrips);
tripRouter.get("/owner", tripController.getAllTripsForOwner);
tripRouter.get("/:id", tripController.getTripById);
tripRouter.put("/:id", tripController.updateTrip);
tripRouter.delete("/:id", tripController.deleteTrip);

module.exports = tripRouter;
