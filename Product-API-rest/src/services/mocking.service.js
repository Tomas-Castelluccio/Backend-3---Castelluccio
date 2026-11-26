const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const firstNames = ["Ana", "Bruno", "Camila", "Diego", "Elena", "Facundo", "Julia", "Mateo"];
const lastNames = ["García", "Pérez", "López", "Martínez", "Gómez", "Fernández", "Sosa", "Romero"];
const petNames = ["Luna", "Milo", "Nala", "Toby", "Mora", "Simba", "Olivia", "Rocky"];
const petBreeds = ["mestizo", "labrador", "caniche", "siamés", "persa", "beagle"];
const petSpecies = ["perro", "gato"];

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
      pets: [],
      __v: 0,
    };
  });
};

const generatePets = (quantity) =>
  Array.from({ length: quantity }, (_, index) => ({
    name: getRandomItem(petNames),
    species: getRandomItem(petSpecies),
    breed: getRandomItem(petBreeds),
    age: Math.floor(Math.random() * 15) + 1,
    adopted: false,
  }));

module.exports = { generateUsers, generatePets };
