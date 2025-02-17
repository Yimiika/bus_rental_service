const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { addToBlacklist } = require("../middleware/blacklist");

require("dotenv").config();

const authRouter = express.Router();

authRouter.post("/signup", async (req, res, next) => {
  passport.authenticate("signup", { session: false }, (err, user, info) => {
    if (err) {
      // console.log(err);
      return res.status(500).json({ error: "An internal error occurred" });
    }

    if (!user) {
      return res.status(409).json({ error: info.message });
    }

    res.status(201).json({
      message: info.message,
    });
  })(req, res, next);
});

authRouter.post("/login", (req, res, next) => {
  passport.authenticate("login", (err, user, info) => {
    if (err) {
      console.error("Login Error:", err);
      return res.status(500).json({ error: "An internal error occurred" });
    }

    if (!user) {
      return res.status(401).json({ error: info.message });
    }

    // Successful login
    req.login(user, { session: false }, async (loginError) => {
      if (loginError) {
        console.error("Login Processing Error:", loginError);
        return next(loginError);
      }

      const body = { id: user.id };
      const token = jwt.sign({ user: body }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      return res.json({ token });
    });
  })(req, res, next);
});

authRouter.post("/logout", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    addToBlacklist(token, expiresIn);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error processing token" });
  }
});

// Redirect to Google for authentication
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Handle Google OAuth callback
authRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Generate JWT token for authenticated user
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email_address },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.redirect(`http://localhost:3000?token=${token}`);
  }
);

module.exports = authRouter;
