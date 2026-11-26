const { AppError } = require("../errors/app-error");

class AdoptionsService {
  constructor(adoptionsRepository, usersRepository, petsRepository) {
    this.adoptionsRepository = adoptionsRepository;
    this.usersRepository = usersRepository;
    this.petsRepository = petsRepository;
  }

  getAll() {
    return this.adoptionsRepository.findAll();
  }

  async getById(id) {
    if (!id) throw AppError.badRequest("ID de adopción requerido");
    const adoption = await this.adoptionsRepository.findById(id);
    if (!adoption) throw AppError.notFound("Adopción no encontrada");
    return adoption;
  }

  async create(userId, petId) {
    if (!userId || !petId) throw AppError.badRequest("IDs de usuario y mascota requeridos");

    const [user, pet] = await Promise.all([
      this.usersRepository.findById(userId),
      this.petsRepository.findById(petId),
    ]);
    if (!user) throw AppError.notFound("Usuario no encontrado");
    if (!pet) throw AppError.notFound("Mascota no encontrada");
    if (pet.adopted) throw AppError.conflict("La mascota ya fue adoptada");

    const adoption = await this.adoptionsRepository.create(userId, petId);
    await this.petsRepository.markAdopted(petId);
    await this.usersRepository.addPet(userId, petId);
    return adoption;
  }
}

module.exports = AdoptionsService;
