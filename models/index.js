const dbConfig = require("../config/dbConfig");
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
  }
);

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

// Add models
db.buses = require("./buses")(sequelize, DataTypes);
db.trips = require("./trips")(sequelize, DataTypes);
db.tripBuses = require("./tripBuses")(sequelize, DataTypes);
db.owners = require("./owners")(sequelize, DataTypes);
db.users = require("./users")(sequelize, DataTypes);
db.admins = require("./admins")(sequelize, DataTypes);
db.payments = require("./payments")(sequelize, DataTypes);
db.messages = require("./messages")(sequelize, DataTypes);

// Define relationships
db.buses.belongsToMany(db.trips, { through: db.tripBuses });
db.trips.belongsToMany(db.buses, { through: db.tripBuses });

db.buses.belongsTo(db.owners, { foreignKey: "owner_id" });
db.owners.hasMany(db.buses, { foreignKey: "owner_id" });

db.payments.belongsTo(db.trips, { foreignKey: "trip_id" });
db.trips.hasMany(db.payments, { foreignKey: "trip_id" });

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
