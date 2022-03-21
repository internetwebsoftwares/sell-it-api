const mongoose = require("mongoose");
const reportSchema = new mongoose.Schema(
  {
    adId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    addTitle: {
      type: String,
      required: true,
    },
    addLink: {
      type: String,
      required: true,
    },
    reportedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reportSubject: {
      type: String,
      required: true,
    },
    customElements: {
      type: String,
      required: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
