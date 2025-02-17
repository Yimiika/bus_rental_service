require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  dialect: "postgres",
};

// console.log("DB User:", dbConfig.user);
// console.log("DB Password:", process.env.DB_PASSWORD);
// console.log("DB Name:", process.env.DB_DATABASE);
// console.log("DB Host:", process.env.DB_HOST);

module.exports = dbConfig;
