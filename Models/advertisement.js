const mongoose = require("mongoose");
const adSchema = new mongoose.Schema(
  {
    imagesUrls: [{ type: String }],
    previewImageUrl: { type: String },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      default: "smartphone",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    ownerName: {
      type: String,
      required: true,
    },
    contactPhoneNumber: {
      type: Number,
      required: true,
      minLength: 10,
    },
    location: {
      latitude: {
        type: Number,
        default: 51.5079,
      },
      longitude: {
        type: Number,
        default: 0.0877,
      },
    },
  },
  { timestamps: true }
);

//Hide images buffer
adSchema.methods.toJSON = function () {
  const ad = this;
  const adObj = ad.toObject();
  delete adObj.previewImage;
  return adObj;
};

module.exports = mongoose.model("Ad", adSchema);
