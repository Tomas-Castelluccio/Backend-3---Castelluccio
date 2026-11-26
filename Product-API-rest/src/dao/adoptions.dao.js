const mongoose = require("mongoose");
const AdoptionsModel = require("../models/adoptions.model");

class AdoptionsDao {
  #isValidId(id) {
    return mongoose.isValidObjectId(id);
  }

  getAll() {
    return AdoptionsModel.find()
      .populate("owner", "first_name last_name email")
      .populate("pet")
      .sort({ createdAt: -1 })
      .lean();
  }

  async getById(id) {
    if (!this.#isValidId(id)) return null;
    return AdoptionsModel.findById(id)
      .populate("owner", "first_name last_name email")
      .populate("pet")
      .lean();
  }

  async create(ownerId, petId) {
    const adoption = await AdoptionsModel.create({ owner: ownerId, pet: petId });
    return AdoptionsModel.findById(adoption._id)
      .populate("owner", "first_name last_name email")
      .populate("pet")
      .lean();
  }
}

module.exports = AdoptionsDao;
