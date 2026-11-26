const AdoptionsDao = require("../dao/adoptions.dao");

class AdoptionsRepository {
  constructor(adoptionsDao) {
    this.adoptionsDao = adoptionsDao || new AdoptionsDao();
  }

  findAll() {
    return this.adoptionsDao.getAll();
  }

  findById(id) {
    return this.adoptionsDao.getById(id);
  }

  create(ownerId, petId) {
    return this.adoptionsDao.create(ownerId, petId);
  }
}

module.exports = AdoptionsRepository;
