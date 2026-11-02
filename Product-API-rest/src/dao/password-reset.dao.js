const PasswordResetModel = require("../models/password-reset.model");

class PasswordResetDao {
  async create(data) {
    return PasswordResetModel.create(data);
  }

  async findActiveByTokenHash(hash) {
    return PasswordResetModel.findOne({ token: hash, used: false }).lean();
  }

  async markAsUsed(id) {
    const record = await PasswordResetModel.findOneAndUpdate(
      { _id: id, used: false, expiresAt: { $gt: new Date() } },
      { used: true },
      { new: true }
    );
    if (!record) throw new Error("El enlace ya fue utilizado o expiró");
    return record;
  }

  async deleteActiveByEmail(email) {
    await PasswordResetModel.deleteMany({ email: email.toLowerCase(), used: false });
  }
}

module.exports = PasswordResetDao;
