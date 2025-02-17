const { users, ownerDetails } = require("../models");
const { Op } = require("sequelize");

// Get all users with filtering, pagination, and sorting
function formatRole(role) {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

const VALID_ROLES = ["Admin", "Owner", "User"];

async function getAllUsers(req, res, next) {
  try {
    const {
      cursor,
      user_id = "",
      email_address = "",
      last_name = "",
      first_name = "",
      phone_number = "",
      role = "",
      sort = "createdAt",
      order = "DESC",
      ...invalidKeys
    } = req.query;

    if (Object.keys(invalidKeys).length > 0) {
      return res.status(400).json({
        message: "Invalid search key(s) provided",
        invalidKeys: Object.keys(invalidKeys),
      });
    }

    let whereCondition = {};

    // Filtering conditions
    if (user_id) whereCondition.id = { [Op.eq]: user_id };
    if (email_address)
      whereCondition.email_address = { [Op.iLike]: `%${email_address}%` };
    if (last_name) whereCondition.last_name = { [Op.iLike]: `%${last_name}%` };
    if (first_name)
      whereCondition.first_name = { [Op.iLike]: `%${first_name}%` };
    if (phone_number)
      whereCondition.phone_number = { [Op.iLike]: `%${phone_number}%` };
    if (role) {
      const formattedRole = formatRole(role);

      if (!VALID_ROLES.includes(formattedRole)) {
        return res.status(400).json({
          message: `Invalid role provided. Allowed values: ${VALID_ROLES.join(
            ", "
          )}`,
        });
      }

      whereCondition.role = formattedRole;
    }

    // Cursor-based pagination (only if id filter isn't used)
    if (cursor && !user_id) {
      whereCondition.user_id = { [Op.gt]: cursor };
    }

    // Validate sorting fields
    const validSortFields = ["createdAt", "updatedAt"];
    const sortField = validSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Fetch users with owner details
    const userList = await users.findAll({
      where: whereCondition,
      order: [[sortField, sortOrder]],
      limit: 20,
      include: [
        {
          model: ownerDetails,
          attributes: ["designation", "verification_status"],
          required: false,
        },
      ],
    });

    if (userList.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json({
      users: userList.map((user) => ({
        user_id: user.id,
        last_name: user.last_name,
        first_name: user.first_name,
        email_address: user.email_address,
        phone_number: user.phone_number,
        role: user.role,
        ownerDetails: user.ownerDetail
          ? {
              designation: user.ownerDetail.designation,
              verification_status: user.ownerDetail.verification_status,
            }
          : null, // Attach owner details if available
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    next(err);
  }
}

// Function to update owner verification status
async function updateOwnerStatus(req, res, next) {
  try {
    const { id } = req.params;
    let { verification_status } = req.body;

    // console.log(id);

    // Convert verification_status to lowercase and compare
    if (verification_status.toLowerCase() !== "verified") {
      return res.status(400).json({
        message:
          "Invalid verification status. Status can only be updated to 'Verified'.",
      });
    }

    const owner = await ownerDetails.findOne({
      where: { user_id: id },
    });

    if (!owner) {
      return res.status(404).json({ message: "Owner details not found." });
    }

    if (owner.verification_status.toLowerCase() === "verified") {
      return res.status(400).json({ message: "Owner is already verified." });
    }

    // Update the verification status
    owner.verification_status = "Verified";
    await owner.save();

    return res.status(200).json({
      message: "Owner verified successfully.",
      owner,
    });
  } catch (error) {
    console.error("Error updating owner state:", error);
    next(error);
  }
}

// Update user details
async function editUserDetails(req, res, next) {
  try {
    const { id } = req.params;
    const allowedFields = [
      "phone_number",
      "first_name",
      "last_name",
      "designation",
    ];
    const updates = Object.keys(req.body);

    const isValidUpdate = updates.every((field) =>
      allowedFields.includes(field)
    );

    if (!isValidUpdate) {
      return res.status(400).json({ message: "Invalid fields for update" });
    }

    const user = await users.findByPk(id, {
      include: [
        {
          model: ownerDetails,
          attributes: ["designation", "verification_status"],
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update(req.body);

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        user_id: user.id,
        last_name: user.last_name,
        first_name: user.first_name,
        email_address: user.email_address,
        phone_number: user.phone_number,
        role: user.role,
        ownerDetails: user.ownerDetails
          ? {
              designation: user.ownerDetails.designation,
              verification_status: user.ownerDetails.verification_status,
            }
          : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("Error updating user:", err);
    next(err);
  }
}

// Delete user
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await users.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Prevent deletion if the user is an admin
    if (user.role.toLowerCase() === "admin") {
      return res
        .status(403)
        .json({ message: "Admin users cannot be deleted." });
    }
    await user.destroy();

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    next(err);
  }
}

module.exports = {
  getAllUsers,
  updateOwnerStatus,
  editUserDetails,
  deleteUser,
};
