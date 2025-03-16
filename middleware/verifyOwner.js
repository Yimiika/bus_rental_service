const { users } = require("../models");

async function verifyOwner(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(403)
        .json({ status: 403, message: "Unauthorized access" });
    }

    const userData = await users.findOne({ where: { id: userId } }); // Sequelize query

    if (!userData || userData.role.toLowerCase() !== "owner") {
      return res.status(403).json({
        status: 403,
        message: "Only owners are authorized to access this resource.",
      });
    }

    next();
  } catch (err) {
    console.error("Error verifying owner:", err);
    return res.status(500).json({ status: 500, message: "Server error" });
  }
}

module.exports = verifyOwner;
