const mongoose = require("mongoose");
const previewImageSchema = new mongoose.Schema(
  {
    adId: { type: mongoose.Schema.Types.ObjectId, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true },
    previewImage: { type: Buffer },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PreviewImage", previewImageSchema);
