class PetsService {
  constructor(petsRepository) {
    this.petsRepository = petsRepository;
  }

  getAllPets() {
    return this.petsRepository.findAll();
  }
}

module.exports = PetsService;
