const express = require("express");
const ratingController = require("../controllers/ratingsControllers");
const ratingRouter = express.Router();

ratingRouter.get("/:user_id", ratingController.getUserRating);
ratingRouter.post("/:trip_id/rate", ratingController.rateUser);

module.exports = ratingRouter;
