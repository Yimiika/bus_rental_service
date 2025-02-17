const { users } = require("../models");

async function verifyAdmin(req, res, next) {
  try {
    const userId = req.user?.id;
    // console.log(req.user);
    if (!userId) {
      //   console.log(userId);
      return res
        .status(403)
        .json({ status: 403, message: "Unauthorized access" });
    }

    const userData = await users.findOne({ where: { id: userId } });
    // console.log(userData);
    if (!userData || userData.role !== "Admin") {
      //   console.log(userData.role);
      return res.status(403).json({
        status: 403,
        message: "Only admins are authorized to access this resource.",
      });
    }

    next();
  } catch (err) {
    console.error("Error verifying admin:", err);
    return res.status(500).json({ status: 500, message: "Server error" });
  }
}

module.exports = verifyAdmin;
