const mongoose = require("mongoose");

const petsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    species: { type: String, required: true, enum: ["perro", "gato", "conejo", "canario", "cobayo"] },
    breed: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    adopted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("pets", petsSchema);
