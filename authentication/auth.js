const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const { users } = require("../models");
const { ownerDetails } = require("../models");
const { isTokenRevoked } = require("../middleware/blacklist");
const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

require("sequelize");
require("dotenv").config();

//Create session middleware
// const sessionMiddleware = session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: true,
//   cookie: { maxAge: 60 * 60 * 1000 },
// });

const checkRevokedToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token && isTokenRevoked(token)) {
    return res
      .status(401)
      .json({ message: "Token has been revoked. Please log in again." });
  }

  next();
};

// Passport Session Setup (for session-based authentication)
// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await users.findByPk(id);
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });

// JWT Authentication Strategy
passport.use(
  new JWTstrategy(
    {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    },
    async (token, done) => {
      try {
        const user = await users.findOne({ where: { id: token.user.id } });
        if (!user) return done(null, false);
        // console.log(token);
        return done(null, { id: user.id, role: user.role });
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google Authentication Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        //console.log(profile);
        let user = await users.findOne({
          where: { email_address: profile.emails[0].value },
        });

        if (!user) {
          // Create new user if not found
          user = await users.create({
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            email_address: profile.emails[0].value,
            role: "User",
            password: "OAuthUser",
            //googleId: profile.id,
          });
          //console.log(user);
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Signup Strategy
const allowedRoles = ["admin", "user", "owner"];

passport.use(
  "signup",
  new localStrategy(
    {
      usernameField: "email_address",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, email_address, password, done) => {
      const transaction = await users.sequelize.transaction();
      try {
        const { phone_number, first_name, last_name } = req.body;

        // Convert role to lowercase for case insensitivity
        const role = req.body.role ? req.body.role.toLowerCase() : "";

        // Validate role
        if (!allowedRoles.includes(role)) {
          return done(null, false, {
            message: "Invalid role. Allowed roles are Admin, User, or Owner.",
          });
        }

        const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);

        // Check if email or phone already exists
        const [existingEmail, existingPhone] = await Promise.all([
          users.findOne({ where: { email_address } }),
          users.findOne({ where: { phone_number } }),
        ]);

        if (existingEmail)
          return done(null, false, {
            message: "Email address is already in use",
          });
        if (existingPhone)
          return done(null, false, {
            message: "Phone number is already in use",
          });

        // Validate owner details if role is "Owner"
        if (formattedRole === "Owner") {
          if (!req.body.designation) {
            return done(null, false, {
              message: "Designation is required for owners.",
            });
          }

          const validDesignations = ["Company", "Individual"];
          if (!validDesignations.includes(req.body.designation)) {
            return done(null, false, { message: "Invalid designation type." });
          }
        }

        // Create user
        const registeredUser = await users.create(
          {
            email_address,
            password,
            phone_number,
            first_name,
            last_name,
            role: formattedRole,
          },
          { transaction }
        );

        // If the user is an Owner, create an entry in OwnerDetails
        if (formattedRole === "Owner") {
          await ownerDetails.create(
            {
              user_id: registeredUser.id,
              designation: req.body.designation,
              verification_status: "Not Verified",
            },
            { transaction }
          );
        }

        await transaction.commit();
        return done(null, registeredUser, {
          message: "User registered successfully",
        });
      } catch (error) {
        await transaction.rollback();
        return done(error);
      }
    }
  )
);

// Login Strategy

passport.use(
  "login",
  new localStrategy(
    {
      usernameField: "email_address",
      passwordField: "password",
    },
    async (email_address, password, done) => {
      try {
        const user = await users.findOne({ where: { email_address } });

        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        // Compare passwords using the method in the model
        const isValidPassword = await user.validatePassword(password);

        if (!isValidPassword) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user, { message: "Logged in Successfully" });
      } catch (error) {
        return done(error);
      }
    }
  )
);

const optionalAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    req.user = user || null;
    next();
  })(req, res, next);
};

module.exports = {
  // sessionMiddleware,
  passport,
  checkRevokedToken,
  optionalAuth,
};
