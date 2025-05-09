const { sequelize } = require("../models");
const {
  trips,
  users,
  buses,
  payments,
  tripBuses,
  ownerDetails,
} = require("../models");
const { Op } = require("sequelize");

function formatStatus(trip_status) {
  return (
    trip_status.charAt(0).toUpperCase() + trip_status.slice(1).toLowerCase()
  );
}

const VALID_STATUS = ["Completed", "Ongoing", "Cancelled"];

async function createTrip(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    const {
      pickup_address,
      destination_address,
      rental_purpose,
      bus_ids, //an array of bus ids
      // booking_type,
      // pickup_date,
      // duration,
      // bus_id,
    } = req.body;

    const userId = req.user ? req.user.id : null; // User is optional

    // Validate required fields
    if (
      pickup_address === undefined ||
      destination_address === undefined ||
      rental_purpose === undefined 
      // booking_type === undefined ||
      // pickup_date === undefined ||
      // duration === undefined ||
      // bus_id === undefined
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // if (typeof price !== "number" || price <= 0) {
    //   return res
    //     .status(400)
    //     .json({ message: "Price must be a positive number" });
    // }

    // if (typeof trip_distance !== "number" || trip_distance <= 0) {
    //   return res
    //     .status(400)
    //     .json({ message: "Trip distance must be a positive number" });
    // }

    // Validate bus IDs
    if (!Array.isArray(bus_ids) || bus_ids.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one bus must be provided" });
    }

    // // Check if buses exist
    // const foundBuses = await buses.findAll({
    //   where: { id: { [Op.in]: bus_ids } },
    //   transaction,
    // });

    // if (foundBuses.length !== bus_ids.length) {
    //   await transaction.rollback();
    //   return res.status(404).json({ message: "One or more buses not found" });
    // }

    // Check if buses exist and fetch their price_per_day
    const foundBuses = await buses.findAll({
      where: { id: { [Op.in]: bus_ids } },
      attributes: ["id", "price_per_day"],
      transaction,
    });

    if (foundBuses.length !== bus_ids.length) {
      await transaction.rollback();
      return res.status(404).json({ message: "One or more buses not found" });
    }

    // Calculate total price from price_per_day
    const totalPrice = foundBuses.reduce(
      (sum, bus) => sum + Number(bus.price_per_day || 0),
      0
    );

    // Check for ongoing trips for any of the provided bus IDs
    const ongoingTrips = await trips.findAll({
      where: {
        trip_status: "Ongoing",
      },
      include: {
        model: buses,
        where: {
          id: bus_ids,
        },
      },
    });

    if (ongoingTrips.length > 0) {
      return res
        .status(400)
        .json({ error: "One or more buses are already in an ongoing trip." });
    }

    // Create trip
    const newTrip = await trips.create(
      {
        pickup_address,
        destination_address,
        rental_purpose,
        // booking_type,
        // pickup_date, 
        // duration,
        // bus_id,
        price: totalPrice,
        user_id: userId,
      },
      { transaction }
    );

    // Associate buses with the trip
    const tripBusRecords = bus_ids.map((bus_id) => ({
      trip_id: newTrip.id,
      bus_id,
    }));

    await tripBuses.bulkCreate(tripBusRecords, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: "Trip created successfully",
      trip: newTrip,
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    console.error("Error creating trip:", err);
    next(err);
  }
}

async function getAllTrips(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized: User must be logged in to access this resource",
      });
    }

    // Extract pagination and sorting parameters
    let {
      page = 1,
      limit = 10,
      sortField = "createdAt",
      order = "DESC",
    } = req.query;

    // Convert pagination params to numbers
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);
    const offset = (pageNumber - 1) * pageSize;

    // Validate sort order
    const validOrders = ["ASC", "DESC"];
    const sortOrder = validOrders.includes(String(order).toUpperCase())
      ? String(order).toUpperCase()
      : "DESC";

    // Fetch all trips for the logged-in user
    const tripsData = await trips.findAndCountAll({
      where: { user_id: userId },
      include: [{ model: buses, attributes: ["vehicle_registration_number"] }],
      order: [[sortField, sortOrder]],
      limit: pageSize,
      offset,
    });

    // Check if trips exist
    if (!tripsData.rows.length) {
      return res.status(404).json({ message: "No trips found for this user" });
    }

    return res.status(200).json({
      totalTrips: tripsData.count,
      currentPage: pageNumber,
      totalPages: Math.ceil(tripsData.count / pageSize),
      trips: tripsData.rows,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}

async function getAllTripsForOwner(req, res, next) {
  try {
    // Extract user details from request
    const userId = req.user?.id;
    //const userRole = req.user?.role;

    // if (!userId) {
    //   return res.status(401).json({
    //     message: "Unauthorized: User must be logged in to access this resource",
    //   });
    // }

    // if (userRole !== "Owner") {
    //   return res.status(403).json({
    //     message: "Access Denied: Only Owners can access this resource",
    //   });
    // }

    // Find the owner's ID from OwnerDetails using user_id
    const ownerDetailsData = await ownerDetails.findOne({
      where: { user_id: userId },
      attributes: ["id"],
    });

    if (!ownerDetailsData) {
      return res.status(404).json({ message: "Owner profile not found" });
    }

    const ownerId = ownerDetailsData.id;

    // Extract filtering, pagination, and sorting parameters
    let {
      page = 1,
      limit = 10,
      sortField = "createdAt",
      order = "DESC",
      trip_status,
      vehicle_registration_number,
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);
    const offset = (pageNumber - 1) * pageSize;

    const validOrders = ["ASC", "DESC"];
    const sortOrder = validOrders.includes(String(order).toUpperCase())
      ? String(order).toUpperCase()
      : "DESC";

    const whereClause = {};

    // Validate and format trip_status if provided
    if (trip_status) {
      try {
        trip_status =
          trip_status.charAt(0).toUpperCase() +
          trip_status.slice(1).toLowerCase();

        if (!VALID_STATUS.includes(trip_status)) {
          return res.status(400).json({
            message: `Invalid status: Must be one of ${VALID_STATUS.join(
              ", "
            )}`,
          });
        }

        whereClause.trip_status = trip_status;
      } catch (error) {
        return res.status(400).json({ message: "Invalid trip status format" });
      }
    }

    // Add filtering by vehicle_registration_number if provided
    const busWhereClause = { owner_id: ownerId };

    if (vehicle_registration_number) {
      busWhereClause.vehicle_registration_number = vehicle_registration_number;
    }

    // Fetch all trips associated with the Owner's buses
    const tripsData = await trips.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: buses,
          where: busWhereClause,
          attributes: ["vehicle_registration_number"],
        },
        {
          model: users,
          attributes: ["first_name", "last_name"],
        },
      ],
      order: [[sortField, sortOrder]],
      limit: pageSize,
      offset,
    });

    if (!tripsData.rows.length) {
      return res.status(404).json({ message: "No trips found for this owner" });
    }

    return res.status(200).json({
      totalTrips: tripsData.count,
      currentPage: pageNumber,
      totalPages: Math.ceil(tripsData.count / pageSize),
      trips: tripsData.rows,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}

async function getTripById(req, res, next) {
  try {
    const { id } = req.params;

    const trip = await trips.findOne({
      where: { id },
      include: [
        {
          model: buses,
          attributes: ["vehicle_registration_number"],
          through: { attributes: [] },
        },
        {
          model: users,
          attributes: ["first_name", "last_name"],
        },
      ],
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    return res.status(200).json({ trip });
  } catch (err) {
    console.error(err);
    next(err);
  }
}

// Update trip details

async function updateTrip(req, res, next) {
  const transaction = await sequelize.transaction(); // Create transaction

  try {
    const { id } = req.params;
    const {
      pickup_address,
      destination_address,
      rental_purpose,
      bus_ids,
      trip_status,
    } = req.body;

    const trip = await trips.findByPk(id, { transaction });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    let formattedStatus = trip.trip_status;
    if (trip_status) {
      formattedStatus = formatStatus(trip_status);
      if (!VALID_STATUS.includes(formattedStatus)) {
        return res.status(400).json({
          message: `Invalid status: Must be one of ${VALID_STATUS.join(", ")}`,
        });
      }
    }

    await trip.update(
      {
        pickup_address: pickup_address ?? trip.pickup_address,
        destination_address: destination_address ?? trip.destination_address,
        rental_purpose: rental_purpose ?? trip.rental_purpose,
        trip_status: formattedStatus,
      },
      { transaction }
    );

    let totalPrice = trip.price;

    // If bus_ids are provided, update bus associations and recalculate price
    if (bus_ids && Array.isArray(bus_ids)) {
      const foundBuses = await buses.findAll({
        where: { id: { [Op.in]: bus_ids } },
        attributes: ["id", "price_per_day"],
        transaction,
      });

      if (foundBuses.length !== bus_ids.length) {
        await transaction.rollback(); // Rollback if buses not found
        return res.status(404).json({ message: "One or more buses not found" });
      }

      if (bus_ids.length > 0) {
        // Check for ongoing trips for any of the provided bus IDs
        const ongoingTrips = await trips.findAll({
          where: {
            trip_status: "Ongoing",
            id: { [Op.ne]: id }, // exclude the current trip being updated
          },
          include: {
            model: buses,
            where: {
              id: bus_ids,
            },
          },
          transaction,
        });

        if (ongoingTrips.length > 0) {
          await transaction.rollback();
          return res.status(400).json({
            error: "One or more buses are already in an ongoing trip.",
          });
        }
      }

      // Delete old bus_trips
      await bus_trips.destroy({ where: { trip_id: trip.id }, transaction });

      // Create new bus_trips
      await Promise.all(
        bus_ids.map(async (busId) => {
          await bus_trips.create(
            {
              trip_id: trip.id,
              bus_id: busId,
            },
            { transaction }
          );
        })
      );

      // Recalculate total price
      totalPrice = foundBuses.reduce(
        (sum, bus) => sum + Number(bus.price_per_day || 0),
        0
      );
    }

    // Update trip with recalculated price
    await trip.update(
      {
        price: totalPrice,
      },
      { transaction }
    );

    await transaction.commit(); // Commit the transaction

    return res.status(200).json({ message: "Trip updated successfully", trip });
  } catch (error) {
    await transaction.rollback(); // Rollback on error
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
// Delete Trip
async function deleteTrip(req, res, next) {
  try {
    const { id } = req.params;

    // Check if trip exists
    const trip = await trips.findByPk(id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Remove associated trip-bus records
    await tripBuses.destroy({ where: { trip_id: id } });

    // Remove associated payment records (if any)
    await payments.destroy({ where: { trip_id: id } });

    // Delete the trip itself
    await trip.destroy();

    return res.status(200).json({ message: "Trip deleted successfully" });
  } catch (err) {
    console.error("Error deleting trip:", err);
    next(err);
  }
}

async function assignBusesToTrip(req, res, next) {
  const { trip_id } = req.params;
  const { bus_ids } = req.body;
  // console.log(trip_id);

  if (!Array.isArray(bus_ids) || bus_ids.length === 0) {
    return res
      .status(400)
      .json({ message: "At least one bus must be provided" });
  }

  const transaction = await sequelize.transaction();

  try {
    // Check if trip exists
    const trip = await trips.findByPk(trip_id, { transaction });
    if (!trip) {
      await transaction.rollback();
      return res.status(404).json({ message: "Trip not found" });
    }

    // Validate bus IDs
    const foundBuses = await buses.findAll({
      where: { id: { [Op.in]: bus_ids } },
      transaction,
    });

    if (foundBuses.length !== bus_ids.length) {
      await transaction.rollback();
      return res.status(404).json({ message: "One or more buses not found" });
    }

    // ❗️ Check if any of the buses are already on an ongoing trip
    const ongoingTrips = await trips.findAll({
      where: {
        trip_status: "Ongoing",
        id: { [Op.ne]: trip_id }, // exclude the current trip
      },
      include: {
        model: buses,
        where: {
          id: { [Op.in]: bus_ids },
        },
        through: { attributes: [] },
      },
      transaction,
    });

    if (ongoingTrips.length > 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "One or more buses are already in an ongoing trip" });
    }

    // Check if buses are already assigned to this trip
    const existingAssignments = await tripBuses.findAll({
      where: { trip_id, bus_id: { [Op.in]: bus_ids } },
      transaction,
    });

    const alreadyAssignedBusIds = existingAssignments.map(
      (record) => record.bus_id
    );
    const newBusIds = bus_ids.filter(
      (bus_id) => !alreadyAssignedBusIds.includes(bus_id)
    );

    if (newBusIds.length === 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "All buses are already assigned to this trip" });
    }

    // Assign new buses to the trip
    const tripBusRecords = newBusIds.map((bus_id) => ({ trip_id, bus_id }));
    await tripBuses.bulkCreate(tripBusRecords, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: "Buses assigned to trip successfully",
      assignedBuses: newBusIds,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Error assigning buses to trip:", err);
    next(err);
  }
}

async function removeBusFromTrip(req, res, next) {
  const { trip_id, bus_id } = req.params;

  const transaction = await sequelize.transaction();

  try {
    // Check if the trip exists
    const trip = await trips.findByPk(trip_id, { transaction });
    if (!trip) {
      await transaction.rollback();
      return res.status(404).json({ message: "Trip not found" });
    }

    // Check if the bus is assigned to the trip
    const tripBusEntry = await tripBuses.findOne({
      where: { trip_id, bus_id },
      transaction,
    });

    if (!tripBusEntry) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ message: "Bus is not assigned to this trip" });
    }

    // Remove the bus from the trip
    await tripBuses.destroy({ where: { trip_id, bus_id }, transaction });

    // Check if there are any buses left for the trip
    const remainingBuses = await tripBuses.count({
      where: { trip_id },
      transaction,
    });

    if (remainingBuses === 0) {
      await trips.destroy({ where: { id: trip_id }, transaction });
      await transaction.commit();
      return res
        .status(200)
        .json({ message: "Bus removed, and trip deleted as no buses remain" });
    }

    await transaction.commit();

    return res
      .status(200)
      .json({ message: "Bus removed from trip successfully" });
  } catch (err) {
    await transaction.rollback();
    console.error("Error removing bus from trip:", err);
    next(err);
  }
}

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getAllTripsForOwner,
  removeBusFromTrip,
  assignBusesToTrip,
};
