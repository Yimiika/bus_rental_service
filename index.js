const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
require("dotenv").config();

const {
  passport,
  //sessionMiddleware,
  checkRevokedToken,
  optionalAuth,
} = require("./authentication/auth");
//const rateLimiter = require("./middleware/rateLimiter");
const authRoute = require("./routes/auth");
const usersRoute = require("./routes/users");
const busesRoute = require("./routes/buses")
const paystackRoute = require("./routes/paystack")
const contactRoute = require("./routes/contacts")

//const tripsRoute = require("./routes/trips");
const paymentsRoute = require("./routes/payment");

const tripsRoute = require("./routes/trips");
const ratingsRoute = require("./routes/ratings");
const getBusesRoute = require("./routes/getBuses")

//const paymentsRoute = require("./routes/payments");
const verifyOwner = require("./middleware/verifyOwner");
const verifyAdmin = require("./middleware/verifyAdmin");
//const cors = require("cors");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

// app.use(sessionMiddleware);
// app.use(passport.initialize());
// app.use(passport.session());

app.set("views", "views");
app.set("view engine", "ejs");

app.use(
  cors({
    // origin: "http://localhost:3000",
    origin: "https://valueride.vercel.app",
    credentials: true,
  })
);

// Routes
app.use("/", authRoute);
app.use(
  "/users",
  passport.authenticate("jwt", { session: false }),
  checkRevokedToken,
  verifyAdmin,
  usersRoute
);
app.use(
  "/ratings",
  passport.authenticate("jwt", { session: false }),
  checkRevokedToken,
  ratingsRoute
);
app.use(
  "/buses",
  passport.authenticate("jwt", { session: false }),
  checkRevokedToken,
  //verifyOwner,
  busesRoute
);

app.use(
  "/getbuses",
  // passport.authenticate("jwt", { session: false }),
  checkRevokedToken,
  //verifyOwner,
  getBusesRoute)

app.use("/bus-rental", contactRoute)
// app.use("/trips", passport.authenticate("jwt", { session: false }), tripsRoute);
app.use(
  "/payments",
  passport.authenticate("jwt", { session: false }),
  paymentsRoute
)

app.use(
  "/paystack",
  // passport.authenticate("jwt", { session: false }),
  paystackRoute
);

app.use("/trips", optionalAuth, tripsRoute);
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
