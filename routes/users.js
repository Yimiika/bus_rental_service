const express = require("express");
const userController = require("../controllers/userControllers");
const userRouter = express.Router();

userRouter.get("/", userController.getAllUsers);
userRouter.put("/verify/:id", userController.updateOwnerStatus);
userRouter.put("/edit/:id", userController.editUserDetails);
userRouter.delete("/:id", userController.deleteUser);

module.exports = userRouter;
