const PetsDao = require("../dao/pets.dao");

class PetsRepository {
  constructor(petsDao) {
    this.petsDao = petsDao || new PetsDao();
  }

  async findAll() {
    const docs = await this.petsDao.getAll();
    return docs.map((doc) => this.#toEntity(doc));
  }

  async findById(id) {
    const doc = await this.petsDao.getById(id);
    return this.#toEntity(doc);
  }

  markAdopted(id) {
    return this.petsDao.markAdopted(id);
  }

  async createMany(petsData) {
    const docs = await this.petsDao.createMany(petsData);
    return docs.map((doc) => this.#toEntity(doc));
  }

  async create(petData) {
    return this.#toEntity(await this.petsDao.create(petData));
  }

  #toEntity(doc) {
    if (!doc) return null;
    return {
      id: (doc._id || doc.id).toString(),
      name: doc.name,
      species: doc.species,
      breed: doc.breed,
      age: doc.age,
      adopted: doc.adopted,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

module.exports = PetsRepository;
