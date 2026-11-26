const express = require("express");
const router = express.Router();
const container = require("../di/container");

router.get("/", container.petsController.getPets);

module.exports = router;
