const mongoose = require("mongoose");
const adImageSchema = new mongoose.Schema(
  {
    adId: { type: mongoose.Schema.Types.ObjectId, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true },
    images: [{ type: Buffer }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdImage", adImageSchema);
