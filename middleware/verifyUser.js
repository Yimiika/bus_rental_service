const { users } = require("../models");

async function verifyUser(req, res, next) {
  try {

    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(403)
        .json({ status: 403, message: "Unauthorized access" });
    }

    const userData = await users.findOne({ where: { id: userId } }); // Sequelize query

    if (!userData || userData.role.toLowerCase() !== "user") {
      return res.status(403).json({
        status: 403,
        message: "Only user are authorized to access this resource.",
      });
    }

    next();
  } catch (err) {
    console.error("Error verifying user:", err);
    return res.status(500).json({ status: 500, message: "Server error" });
  }
}

module.exports = verifyUser;
