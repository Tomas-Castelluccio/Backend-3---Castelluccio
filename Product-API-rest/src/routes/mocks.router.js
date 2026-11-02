const express = require("express");
const router = express.Router();
const { generateUsers, generateProducts } = require("../services/mocking.service");
const container = require("../di/container");
const UsersModel = require("../models/users.model");

router.get("/mockingproducts", (req, res) => {
  const products = Array.from({ length: 100 }, (_, index) => ({
    id: `mock-${index + 1}`,
    title: `Producto de prueba ${index + 1}`,
    description: `Descripción del producto de prueba ${index + 1}`,
    price: Number((Math.random() * 1000 + 1).toFixed(2)),
    thumbnail: [],
    code: `MOCK-${index + 1}`,
    stock: Math.floor(Math.random() * 100) + 1,
    category: "mock",
    status: true,
  }));

  res.json(products);
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
  const productsCount = Number(body.products ?? req.query.products);

  if (
    !Number.isSafeInteger(usersCount) ||
    !Number.isSafeInteger(productsCount) ||
    usersCount < 0 ||
    productsCount < 0 ||
    usersCount + productsCount === 0 ||
    usersCount > 1000 ||
    productsCount > 1000
  ) {
    return res.status(400).json({
      message: "users y products deben ser enteros entre 0 y 1000, y al menos uno debe ser mayor que 0",
    });
  }

  try {
    const users = await generateUsers(usersCount);
    const insertedUsers = users.length ? await UsersModel.insertMany(users) : [];

    const products = generateProducts(productsCount);
    const insertedProducts = [];
    for (const product of products) {
      insertedProducts.push(await container.productsRepository.create(product));
    }

    res.status(201).json({
      message: "Datos generados e insertados correctamente",
      users: insertedUsers.length,
      products: insertedProducts.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
