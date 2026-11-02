const express = require("express");
const router = express.Router();
const container = require("../di/container");
const { requireAuth } = require("../middleware/auth.middleware");
const { adminOnly } = require("../middleware/authorization.middleware");

const usersController = container.usersController;

const selfOrAdmin = (req, res, next) => {
  const currentUserId = (req.user._id || req.user.id).toString();
  if (
    req.user.role === "admin" ||
    currentUserId.toLowerCase() === req.params.uid.toLowerCase()
  ) {
    return next();
  }
  return res.status(403).json({ message: "Solo podés consultar tu propio usuario" });
};

router.get("/", requireAuth, adminOnly, usersController.getAllUsers);
router.get("/:uid", requireAuth, selfOrAdmin, usersController.getUserById);
router.post("/", requireAuth, adminOnly, usersController.createUser);
router.put("/:uid", requireAuth, adminOnly, usersController.updateUser);
router.delete("/:uid", requireAuth, adminOnly, usersController.deleteUser);

module.exports = router;
