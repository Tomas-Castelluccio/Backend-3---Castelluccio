const express = require("express");
const container = require("../di/container");

const createAdoptionRouter = (adoptionsController = container.adoptionsController) => {
  const router = express.Router();
  router.get("/", adoptionsController.getAll);
  router.get("/:aid", adoptionsController.getById);
  router.post("/:uid/:pid", adoptionsController.create);
  return router;
};

module.exports = createAdoptionRouter();
module.exports.createAdoptionRouter = createAdoptionRouter;
