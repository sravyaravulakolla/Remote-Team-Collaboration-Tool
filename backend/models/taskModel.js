const mongoose = require("mongoose");

const taskModel = mongoose.Schema({
  description: { type: String, required: true, trim: true },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",  // Ensure this references the correct User model
    required: true,
  },
  dueDate: { type: Date, default: null },
  completed: { type: Boolean, default: false },
  status: { type: String, enum: ["pending","in-progress", "completed"], default: "pending" },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  phaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Phase", // Ensure this references the correct Phase model
    required: true,
  },
  order: { type: Number, required: true }, // to maintain task order within phase
});

const Task = mongoose.model("Task", taskModel);
module.exports = Task;
