const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const firstNames = ["Ana", "Bruno", "Camila", "Diego", "Elena", "Facundo", "Julia", "Mateo"];
const lastNames = ["García", "Pérez", "López", "Martínez", "Gómez", "Fernández", "Sosa", "Romero"];
const productNames = ["Teclado", "Mouse", "Monitor", "Auriculares", "Webcam", "Parlante"];

const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

const generateUsers = async (quantity) => {
  const password = await bcrypt.hash("coder123", 10);
  const batchId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return Array.from({ length: quantity }, (_, index) => {
    const first_name = getRandomItem(firstNames);
    const last_name = getRandomItem(lastNames);

    return {
      _id: new mongoose.Types.ObjectId().toString(),
      first_name,
      last_name,
      email: `user${batchId}-${index + 1}@example.com`,
      age: Math.floor(Math.random() * 63) + 18,
      password,
      role: Math.random() < 0.5 ? "user" : "admin",
      products: [],
      __v: 0,
    };
  });
};

const generateProducts = (quantity) =>
  Array.from({ length: quantity }, (_, index) => ({
    title: `${getRandomItem(productNames)} de prueba ${index + 1}`,
    description: `Descripción del producto de prueba ${index + 1}`,
    price: Number((Math.random() * 1000 + 1).toFixed(2)),
    thumbnail: [],
    code: `MOCK-${Date.now()}-${index + 1}`,
    stock: Math.floor(Math.random() * 100) + 1,
    category: "mock",
    status: true,
  }));

module.exports = { generateUsers, generateProducts };
