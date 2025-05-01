const rateLimit = require("express-rate-limit");

// Basic rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message:
      "Too many contact form submissions from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
  keyGenerator: (req) => {
    // Use IP + email as the key to prevent multiple submissions from same user
    return req.ip + (req.body.email || "");
  },
});

module.exports = contactLimiter;
