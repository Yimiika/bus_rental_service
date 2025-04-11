const express = require("express");
const tripController = require("../controllers/tripControllers");
const tripRouter = express.Router();
const verifyOwner = require("../middleware/verifyOwner");
const verifyAdmin = require("../middleware/verifyAdmin");

tripRouter.post("/", tripController.createTrip);
tripRouter.get("/", tripController.getAllTrips);
tripRouter.get("/owner", verifyOwner, tripController.getAllTripsForOwner);
tripRouter.get("/:id", tripController.getTripById);
tripRouter.put("/:id", tripController.updateTrip);
tripRouter.delete("/:id", verifyAdmin, tripController.deleteTrip);
tripRouter.post("/:trip_id/buses", tripController.assignBusesToTrip);
tripRouter.delete("/:trip_id/buses/:bus_id", tripController.removeBusFromTrip);

module.exports = tripRouter;
