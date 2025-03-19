const {
  sequelize,
  buses,
  ownerDetails,
  trips,
  users,
  ratings,
  tripBuses,
} = require("../models");
const { Op } = require("sequelize");

const rateUser = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { trip_id } = req.params;
    const { rating, comment } = req.body;
    const raterId = req.user.id;

    if (!trip_id || !rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Trip ID or rating is missing or invalid" });
    }

    // Fetch the trip to validate it
    const trip = await trips.findByPk(trip_id, {
      include: [
        {
          model: tripBuses,
          as: "tripBuses",
          include: [{ model: buses, as: "buses" }],
        },
      ],
      transaction,
    });

    if (!trip) {
      await transaction.rollback();
      return res.status(404).json({ message: "Trip not found" });
    }

    let ratedId = null;

    if (trip.user_id === raterId) {
      //Customer is rating the Owner
      const bus = trip.tripBuses[0]?.buses;
      if (!bus) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "No bus associated with this trip" });
      }

      const owner = await ownerDetails.findOne({
        where: { id: bus.owner_id },
        transaction,
      });

      if (!owner) {
        await transaction.rollback();
        return res.status(404).json({ message: "Owner not found" });
      }

      ratedId = owner.user_id;
    } else {
      //Owner is rating the Customer
      ratedId = trip.user_id;
    }

    if (!ratedId) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid rating recipient" });
    }

    //Check if a rating already exists for this trip, rater, and rated user
    const existingRating = await ratings.findOne({
      where: {
        trip_id,
        rater_id: raterId,
        rated_id: ratedId,
      },
      transaction,
    });

    if (existingRating) {
      await transaction.rollback();
      return res.status(409).json({ message: "Trip has already been rated" });
    }

    //Create the new rating
    const newRating = await ratings.create(
      {
        trip_id,
        rater_id: raterId,
        rated_id: ratedId,
        rating,
        comment: comment || null,
      },
      { transaction }
    );

    await transaction.commit();
    return res
      .status(201)
      .json({ message: "Rating submitted successfully", rating: newRating });
  } catch (error) {
    await transaction.rollback();

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Trip has already been rated" });
    }

    console.error("Error submitting rating:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while submitting the rating." });
  }
};

async function getUserRating(req, res, next) {
  const { user_id } = req.params;

  try {
    const userRatings = await ratings.findAll({
      where: { rated_id: user_id },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating")), "average_rating"],
        [sequelize.fn("COUNT", sequelize.col("id")), "total_ratings"],
      ],
      raw: true,
    });

    if (!userRatings || userRatings[0].total_ratings === "0") {
      return res
        .status(404)
        .json({ message: "No ratings found for this user" });
    }

    return res.status(200).json({
      average_rating: parseFloat(userRatings[0].average_rating).toFixed(2),
      total_ratings: parseInt(userRatings[0].total_ratings),
    });
  } catch (err) {
    console.error("Error fetching user ratings:", err);
    next(err);
  }
}

async function getUsersRating(user_id) {
  try {
    if (!user_id) {
      throw new Error("User ID is required to fetch ratings");
    }

    const userRatings = await ratings.findAll({
      where: { rated_id: user_id },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("rating")), "average_rating"],
        [sequelize.fn("COUNT", sequelize.col("id")), "total_ratings"],
      ],
      raw: true,
    });

    if (!userRatings || userRatings[0].total_ratings === "0") {
      return { average_rating: "0.00", total_ratings: 0 };
    }

    return {
      average_rating: parseFloat(userRatings[0].average_rating).toFixed(2),
      total_ratings: parseInt(userRatings[0].total_ratings),
    };
  } catch (err) {
    console.error("Error fetching user ratings:", err);
    return null;
  }
}

module.exports = {
  rateUser,
  getUserRating,
  getUsersRating,
};
