const mongoose = require("mongoose");
const phaseModel = mongoose.Schema({
  phaseName: { type: String, required: true, trim: true },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  order: { type: Number, required: true }, // to maintain phase order within chat
});

const Phase = mongoose.model("Phase", phaseModel);
module.exports = Phase;