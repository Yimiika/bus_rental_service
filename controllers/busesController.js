const { Op } = require("sequelize");
const { buses, ownerDetails, messages, trips } = require("../models");

async function getAllBuses(req, res, next) {
  try {
    const {
      cursor,
      bus_id = "",
      vehicle_registration_number = "",
      vehicle_identification_number = "",
      bus_capacity = "",
      price_min = "",
      price_max = "",
      vehicle_type = "",
      // verification_status = "",
      owner_id = "",
      sort = "createdAt",
      order = "desc",
      limit = 20,
      available_days = "",
      ...invalidKeys
    } = req.query;

    // prevents unexpected query from causing errors
    if (Object.keys(invalidKeys).length > 0) {
      res.status(400).json({
        messages: "Invalid search keys provided",
        invalidKeys: Object.keys(invalidKeys),
      });
    }

    let whereCondition = {};

    // conditions for filtering
    if (bus_id) whereCondition.id = { [Op.eq]: bus_id };
    if (vehicle_registration_number) {
      whereCondition.vehicle_registration_number = {
        [Op.iLike]: `%${vehicle_registration_number}%`,
      };
    }
    if (vehicle_identification_number) {
      whereCondition.vehicle_identification_number = {
        [Op.iLike]: `%${vehicle_identification_number}%`,
      };
    }
    if (bus_capacity) whereCondition.bus_capacity = { [Op.eq]: bus_capacity };
    if (price_min)
      whereCondition.price_per_day = { [Op.gte]: parseInt(price_min) };
    if (price_max) {
      whereCondition.price_per_day = {
        ...whereCondition.price_per_day,
        [Op.lte]: parseInt(price_max),
      };
    }
    // if(verification_status) {
    //   const validStatus = ["Verified", "Not Verified"]
    //   if(!validStatus.includes(verification_status)){
    //     return res.status(400).json({
    //       message: `Invalid verification status. Allowed values: ${validStatus.join(", ")}`,
    //     });
    //   }
    //   whereCondition.verification_status = verification_status
    // }
    if (vehicle_type) {
      const validTypes = ["Luxury Van", "Basic Coaster"];
      if (!validTypes.includes(vehicle_type)) {
        return res.status(400).json({
          message: `Invalid vehicle Type given. Allowed values: ${validTypes.join(
            ", "
          )}`,
        });
      }
    }

    // Filter by any of the available days
    if (available_days) {
      const days = available_days
        .toLowerCase()
        .split(",")
        .map((d) => d.trim());

      const allowedDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];

      const invalidDays = days.filter((day) => !allowedDays.includes(day));
      if (invalidDays.length > 0) {
        return res.status(400).json({
          message: `Invalid available_days provided. Allowed values: ${allowedDays.join(
            ", "
          )}`,
          invalidDays,
        });
      }

      whereCondition[Op.or] = days.map((day) => ({
        [`available_${day}`]: true,
      }));
    }

    // pagination with cursor
    if (cursor && !bus_id) {
      whereCondition.id = { [Op.gt]: cursor };
    }

    const validSortFields = ["createdAt", "updatedAt", "price_per_day"];
    const sortFields = validSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    const busList = await buses.findAll({
      where: whereCondition,
      order: [[sortFields, sortOrder]],
      limit: parseInt(limit),
      include: [
        {
          model: trips,
          as: "trips",
          attributes: ["trip_status", "createdAt"],
          required: false,
          where: {
            [Op.or]: [{ trip_status: "Completed" }, { id: { [Op.is]: null } }],
          },
        },
        {
          model: ownerDetails,
          as: "ownerDetails",
          attributes: ["designation"],
          required: false,
        },
      ],
    });

    if (busList.length === 0) {
      return res.status(404).json({ message: "No buses found" });
    }

    const response = busList.map((bus) => {
      // sort trips (if any) and take the most recent
      const latestTrip = bus.trips?.length
        ? [...bus.trips].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )[0]
        : null;

      return {
        bus_id: bus.id,
        vehicle_registration_number: bus.vehicle_registration_number,
        vehicle_identification_number: bus.vehicle_identification_number,
        bus_capacity: bus.bus_capacity,
        verification_status: bus.verification_status,
        price_per_day: bus.price_per_day,
        vehicle_type: bus.vehicle_type,
        available_days: {
          monday: bus.available_monday,
          tuesday: bus.available_tuesday,
          wednesday: bus.available_wednesday,
          thursday: bus.available_thursday,
          friday: bus.available_friday,
          saturday: bus.available_saturday,
          sunday: bus.available_sunday,
        },
        ownerDetails: bus.ownerDetails
          ? {
              designation: bus.ownerDetails.designation,
              // verification_status: bus.ownerDetails.verification_status,
            }
          : null,
        latest_trip: latestTrip
          ? {
              id: latestTrip.id,
              status: latestTrip.trip_status,
            }
          : null,
        createdAt: bus.createdAt,
        updatedAt: bus.updatedAt,
      };
    });
    return res.status(200).json({ buses: response });
  } catch (error) {
    console.error("Error getting all buses:", error);
    next(error);
  }
}

async function getBus(req, res, next) {
  try {
    const bus_id = req.params.id;

    if (!bus_id) {
      return res.status(400).json({ message: "Bus ID is Invalid" });
    }

    // get the details of the bus and owner's information
    const Bus = await buses.findOne({
      where: { id: bus_id },
      include: [
        {
          model: ownerDetails,
          as: "ownerDetails",
          attributes: ["designation"],
          required: false,
        },
      ],
    });

    if (!Bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const availableDaysList = [];
    if (Bus.available_monday) availableDaysList.push("Monday");
    if (Bus.available_tuesday) availableDaysList.push("Tuesday");
    if (Bus.available_wednesday) availableDaysList.push("Wednesday");
    if (Bus.available_thursday) availableDaysList.push("Thursday");
    if (Bus.available_friday) availableDaysList.push("Friday");
    if (Bus.available_saturday) availableDaysList.push("Saturday");
    if (Bus.available_sunday) availableDaysList.push("Sunday");

    return res.status(200).json({
      bus_id: Bus.id,
      vehicle_identification_number: Bus.vehicle_identification_number,
      vehicle_registration_number: Bus.vehicle_registration_number,
      bus_capacity: Bus.bus_capacity,
      price_per_day: Bus.price_per_day,
      // commission: Bus.commission,
      vehicle_type: Bus.vehicle_type,
      // verification_status: Bus.verification_status,
      // location: Bus.latitude !== null && Bus.longitude !== null ? {
      //   latitude: Bus.latitude,
      //   longitude: Bus.longitude
      // }: null,
      available_days: {
        monday: Bus.available_monday,
        tuesday: Bus.available_tuesday,
        wednesday: Bus.available_wednesday,
        thursday: Bus.available_thursday,
        friday: Bus.available_friday,
        saturday: Bus.available_saturday,
        sunday: Bus.available_sunday,
      },
      available_days_list: availableDaysList,
      ownerDetails: Bus.ownerDetails
        ? {
            designation: Bus.ownerDetails.designation,
            // verification_status: Bus.ownerDetails.verification_status
          }
        : null,
      createdAt: Bus.created_at,
      updatedAt: Bus.updated_at,
    });
  } catch (error) {
    console.error("Error occured getting bus details:", error);
    next(error);
  }
}

async function addBus(req, res, next) {
  try {
    // from the verifyOwner middleware get the owner ID authenticated user
    const ownerId = req.user.id;

    const owner = await ownerDetails.findOne({ where: { user_id: ownerId } });
    if (!owner) {
      return res.status(403).json({
        status: 403,
        message: "Owner is not registered",
      });
    }

    const {
      vehicle_identification_number,
      vehicle_registration_number,
      vehicle_type,
      bus_capacity,
      price_per_day,
      // longitude,
      // latitude,
      // commission,
      // verification_status,
      available_monday,
      available_tuesday,
      available_wednesday,
      available_thursday,
      available_friday,
      available_saturday,
      available_sunday,
    } = req.body;

    console.log("Request Body:", req.body);

    if (
      // !vehicle_identification_number ||
      // !verification_status ||
      // !vehicle_registration_number ||
      // !vehicle_type ||
      // !bus_capacity ||
      // !price_per_day
      // ||!longitude
      // ||!latitude
      // ||!commission
      typeof vehicle_identification_number !== "string" ||
      typeof vehicle_registration_number !== "string" ||
      !["Luxury Van", "Basic Coaster"].includes(vehicle_type) ||
      typeof bus_capacity !== "number" ||
      typeof price_per_day !== "number"
    ) {
      return res.status(400).json({
        status: 400,
        message: "Required fields are missing",
      });
    }

    const newBus = await buses.create({
      vehicle_identification_number,
      vehicle_registration_number,
      vehicle_type,
      // verification_status: verification_status || "Not Verified",
      bus_capacity,
      price_per_day,
      // longitude,
      // latitude,
      // commission,
      owner_id: owner.id,
      available_monday: available_monday || false,
      available_tuesday: available_tuesday || false,
      available_wednesday: available_wednesday || false,
      available_thursday: available_thursday || false,
      available_friday: available_friday || false,
      available_saturday: available_saturday || false,
      available_sunday: available_sunday || false,
    });

    return res.status(201).json({
      status: 201,
      message: "Bus listed successfully",
      data: newBus,
    });
  } catch (error) {
    console.error("Error occured while adding bus", error);
    return res.status(500).json({ status: 500, message: "Server error" });
  }
}

const allowedFields = [
  "vehicle_registration_number",
  "vehicle_identification_number",
  "bus_capacity",
  // "longitude",
  // "latitude",
  "price_per_day",
  // "commission",
  "vehicle_type",
  // "verification_status",
  "available_monday",
  "available_tuesday",
  "available_wednesday",
  "available_thursday",
  "available_friday",
  "available_saturday",
  "available_sunday",
];

async function updateBusDetails(req, res, next) {
  try {
    const userId = req.user.id;
    const busId = req.params.id;

    // get bus using its ID
    const Bus = await buses.findByPk(busId);
    if (!Bus) {
      return res.status(404).json({
        messsage: "Bus Not Found",
      });
    }

    // get bus owner using iD
    const owner = await ownerDetails.findOne({ where: { id: Bus.owner_id } });

    // confirm if user is an admin or owner
    const isOwner = owner && owner.user_id === userId;
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        status: 403,
        message: "Bus Update is permitted by only Owners or Admin",
      });
    }

    const updateFields = {};
    for (const key in req.body) {
      if (allowedFields.includes(key)) {
        updateFields[key] = req.body[key];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Invalid field to be updated",
      });
    }

    await Bus.update(updateFields);

    return res.status(200).json({
      status: 200,
      message: "Bus details successfully updated",
      updatedBus: Bus,
    });
  } catch (error) {
    console.error("Error occured during bus update:", error);
    next(error);
  }
}

async function verifyBuses(req, res, next) {
  try {
    const busId = req.params.id;
    let { verification_status } = req.body;

    verification_status =
      verification_status?.trim().toLowerCase() === "verified"
        ? "Verified"
        : verification_status?.trim().toLowerCase() === "not verified"
        ? "Not Verified"
        : null;

    if (!["Verified", "Not Verified"].includes(verification_status)) {
      return res.status(400).json({
        status: 400,
        message: "Verification is not valid.",
      });
    }

    const Bus = await buses.findByPk(busId);
    if (!Bus) {
      return res.status(404).json({
        status: 404,
        message: "Bus not found",
      });
    }

    // update bus verification status
    await Bus.update({ verification_status });

    const updatedBus = await buses.findByPk(busId);
    return res.status(200).json({
      status: 200,
      message: `Updated Verification status to "${verification_status}"`,
      updatedBus,
    });
  } catch (error) {
    console.error("Error verifying Buses", error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
}

async function deleteBus(req, res, next) {
  try {
    const userId = req.user.id;
    const busId = req.params.id;

    const Bus = await buses.findByPk(busId);
    if (!Bus) {
      return res.status(404).json({
        status: 404,
        message: "Bus not found",
      });
    }

    const owner = await ownerDetails.findOne({ where: { id: Bus.owner_id } });

    const isOwner = owner && owner.user_id === userId;
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        status: 403,
        message: "Only Admin and Owners can delete bus",
      });
    }

    await Bus.destroy();

    return res.status(200).json({
      status: 200,
      message: "Bus deleted successfully",
    });
  } catch (error) {
    console.error("Error occured deleting bus", error);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
}

module.exports = {
  getAllBuses,
  getBus,
  addBus,
  updateBusDetails,
  verifyBuses,
  deleteBus,
};
