const express = require("express");
const { generateUsers, generatePets } = require("../services/mocking.service");
const container = require("../di/container");

const createMocksRouter = ({ usersRepository, petsRepository }) => {
  const router = express.Router();

  router.get("/mockingpets", (req, res) => {
    res.json(generatePets(100));
  });

  router.get("/mockingusers", async (req, res, next) => {
    try {
      const users = await generateUsers(50);
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  router.post("/generateData", async (req, res, next) => {
    const body = req.body || {};
    const usersCount = Number(body.users ?? req.query.users);
    const petsCount = Number(body.pets ?? req.query.pets);

    if (
      !Number.isSafeInteger(usersCount) ||
      !Number.isSafeInteger(petsCount) ||
      usersCount < 0 ||
      petsCount < 0 ||
      usersCount + petsCount === 0 ||
      usersCount > 1000 ||
      petsCount > 1000
    ) {
      return res.status(400).json({
        message:
          "users y pets deben ser enteros entre 0 y 1000, y al menos uno debe ser mayor que 0",
      });
    }

    try {
      const users = await generateUsers(usersCount);
      const insertedUsers = users.length
        ? await usersRepository.createMany(users)
        : [];

      const pets = generatePets(petsCount);
      const insertedPets = pets.length
        ? await petsRepository.createMany(pets)
        : [];

      res.status(201).json({
        message: "Datos generados e insertados correctamente",
        users: insertedUsers.length,
        pets: insertedPets.length,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};

module.exports = createMocksRouter({
  usersRepository: container.usersRepository,
  petsRepository: container.petsRepository,
});
module.exports.createMocksRouter = createMocksRouter;
