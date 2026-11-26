const mongoose = require("mongoose");
const PetsModel = require("../models/pets.model");

class PetsDao {
  async getById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return PetsModel.findById(id).lean();
  }

  async getAll() {
    return PetsModel.find().sort({ createdAt: -1 }).lean();
  }

  async markAdopted(id) {
    const pet = await PetsModel.findByIdAndUpdate(
      id,
      { adopted: true },
      { new: true, runValidators: true }
    ).lean();
    if (!pet) throw new Error("Mascota no encontrada");
    return pet;
  }

  async createMany(petsData) {
    const pets = await PetsModel.insertMany(petsData);
    return pets.map((pet) => pet.toObject());
  }

  async create(petData) {
    const pet = await PetsModel.create(petData);
    return pet.toObject();
  }
}

module.exports = PetsDao;
