const rateLimiter = require("express-rate-limit");

const limiter = rateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  limit: 2, // Allow only 2 requests per day
  message: { message: "Users can only retrieve two blogs daily" },
  keyGenerator: (req, res) => req.ip, // Identify users by IP address
});

module.exports = limiter;
