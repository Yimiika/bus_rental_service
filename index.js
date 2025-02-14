const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
require("dotenv").config();

const { passport, sessionMiddleware } = require("./authentication/auth"); // Import session middleware
const rateLimiter = require("./middleware/rateLimiter");
const authRoute = require("./routes/auth");
//const usersRoute = require("./routes/users");
//const busesRoute = require("./routes/buses");
//const tripsRoute = require("./routes/trips");
//const paymentsRoute = require("./routes/payments");
//const verifyOwner = require("./middleware/verifyOwner");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.set("views", "views");
app.set("view engine", "ejs");

// Routes
app.use("/", authRoute);
// app.use("/users", passport.authenticate("jwt", { session: false }), usersRoute);
// app.use(
//   "/buses",
//   passport.authenticate("jwt", { session: false }),
//   verifyOwner,
//   busesRoute
// );
// app.use("/trips", passport.authenticate("jwt", { session: false }), tripsRoute);
// app.use(
//   "/payments",
//   passport.authenticate("jwt", { session: false }),
//   paymentsRoute
// );

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

module.exports = app;
