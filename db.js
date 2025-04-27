const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    logging: false,
  }
);

// const sequelize = new Sequelize(process.env.DIRECT_URL, {
//   dialect: "postgres",
//   logging: false,
// });

async function connectToDb() {
  try {
    await sequelize.authenticate();
    console.log("Connected to database successfully.");
  } catch (error) {
    console.error("Error connecting to database:", error);
    setTimeout(connectToDb, 5000); // Retry after 5 seconds
  }

  process.on("SIGINT", async () => {
    await disconnectDB();
    process.exit(0);
  });
}

async function disconnectDB() {
  await sequelize.close();
  console.log("Database connection closed.");
}

module.exports = { sequelize, connectToDb, disconnectDB };
