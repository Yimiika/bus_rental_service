require("dotenv").config();
const dbConfig = require("../dbConfig");
const { Sequelize, DataTypes } = require("sequelize");

// const sequelize = new Sequelize(
//   dbConfig.database,
//   dbConfig.user,
//   dbConfig.password,
//   {
//     host: dbConfig.host,
//     port: dbConfig.port,
//     dialect: dbConfig.dialect,
//     logging: false,
//   }
// );

const sequelize = new Sequelize(process.env.DIRECT_URL, {
  dialect: "postgres",
  logging: false,
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connected to database successfully");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Adding models
db.buses = require("./buses")(sequelize, DataTypes);
db.trips = require("./trips")(sequelize, DataTypes);
db.tripBuses = require("./tripBuses")(sequelize, DataTypes);
db.ownerDetails = require("./ownerDetails")(sequelize, DataTypes);
db.users = require("./users")(sequelize, DataTypes);
db.payments = require("./payments")(sequelize, DataTypes);
db.messages = require("./messages")(sequelize, DataTypes);
db.ratings = require("./ratings")(sequelize, DataTypes);

// Define relationships

// Owners belong to Users (One-to-One)
db.users.hasOne(db.ownerDetails, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
});
db.ownerDetails.belongsTo(db.users, { foreignKey: "user_id" });

// OwnerDetails has many Buses (One-to-Many)
db.ownerDetails.hasMany(db.buses, {
  foreignKey: "owner_id",
  onDelete: "CASCADE",
});
db.buses.belongsTo(db.ownerDetails, {
  foreignKey: "owner_id",
  as: "ownerDetails",
});

// Buses & Trips (Many-to-Many via tripBuses)
//db.buses.belongsToMany(db.trips, { through: db.tripBuses });
//db.trips.belongsToMany(db.buses, { through: db.tripBuses });
db.buses.belongsToMany(db.trips, {
  through: db.tripBuses,
  foreignKey: "bus_id",
});
db.trips.belongsToMany(db.buses, {
  through: db.tripBuses,
  foreignKey: "trip_id",
});

// Trips has many TripBuses (One-to-Many)
db.trips.hasMany(db.tripBuses, { foreignKey: "trip_id", as: "tripBuses" });
db.tripBuses.belongsTo(db.trips, { foreignKey: "trip_id" });

// TripBuses belongs to Buses
db.tripBuses.belongsTo(db.buses, { foreignKey: "bus_id", as: "buses" });

// Users have many Trips (One-to-Many)
db.users.hasMany(db.trips, { foreignKey: "user_id", onDelete: "CASCADE" });
db.trips.belongsTo(db.users, { foreignKey: "user_id" });

// Payments belong to Trips (One-to-One)
db.payments.belongsTo(db.trips, { foreignKey: "trip_id" });
db.trips.hasOne(db.payments, { foreignKey: "trip_id" });

// Messages are linked to Users (One-to-Many)
db.users.hasMany(db.messages, { foreignKey: "user_id", onDelete: "CASCADE" });
db.messages.belongsTo(db.users, { foreignKey: "user_id" });

//Users have many ratings (One-to-Many)
db.users.hasMany(db.ratings, { foreignKey: "rater_id", as: "given_ratings" });
db.users.hasMany(db.ratings, {
  foreignKey: "rated_id",
  as: "received_ratings",
});

db.trips.hasMany(db.ratings, { foreignKey: "trip_id", as: "trip_ratings" });

db.ratings.belongsTo(db.trips, { foreignKey: "trip_id", as: "trip" });
db.ratings.belongsTo(db.users, { foreignKey: "rater_id", as: "rater" });
db.ratings.belongsTo(db.users, { foreignKey: "rated_id", as: "rated" });

// Sync all models
db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database & tables synced");
  })
  .catch((err) => {
    console.error("Unable to sync database & tables:", err);
  });

module.exports = db;
