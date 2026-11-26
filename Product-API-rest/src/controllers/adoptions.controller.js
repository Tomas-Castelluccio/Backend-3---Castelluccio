class AdoptionsController {
  constructor(adoptionsService) {
    this.adoptionsService = adoptionsService;
  }

  getAll = async (req, res, next) => {
    try {
      res.json(await this.adoptionsService.getAll());
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      res.json(await this.adoptionsService.getById(req.params.aid));
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const adoption = await this.adoptionsService.create(req.params.uid, req.params.pid);
      res.status(201).json({ status: "success", adoption });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AdoptionsController;
