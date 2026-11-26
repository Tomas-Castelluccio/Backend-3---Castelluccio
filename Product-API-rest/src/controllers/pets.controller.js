class PetsController {
  constructor(petsService) {
    this.petsService = petsService;
  }

  getPets = async (req, res, next) => {
    try {
      res.json(await this.petsService.getAllPets());
    } catch (error) {
      next(error);
    }
  };
}

module.exports = PetsController;
