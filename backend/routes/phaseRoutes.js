// routes/phaseRoutes.js
const express = require("express");
const router = express.Router();
const Phase = require("../models/phaseModel");
const Chat = require("../models/chatModel");

// Route to add a new phase within a chat with ordered phase
router.post("/:chatId/phases", async (req, res) => {
  const { chatId } = req.params;
  const { phaseName } = req.body;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Get the current number of phases to determine the order of the new phase
    const phaseCount = await Phase.countDocuments({ chatId });
    const newPhase = new Phase({ phaseName, chatId, order: phaseCount + 1 });
    await newPhase.save();

    res
      .status(201)
      .json({ message: "Phase added successfully", phase: newPhase });
      console.log("added phase");
      
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to delete a phase and update order of remaining phases
router.delete("/:chatId/phases/:phaseId", async (req, res) => {
  const { phaseId } = req.params;

  try {
    const phase = await Phase.findById(phaseId);
    if (!phase) {
      return res.status(404).json({ message: "Phase not found" });
    }

    const tasks = await Task.find({ phaseId });
    const incompleteTasks = tasks.some((task) => task.status !== "completed");

    if (incompleteTasks) {
      return res
        .status(400)
        .json({ message: "Cannot delete phase until all tasks are completed" });
    }

    await phase.remove();

    // Reorder remaining phases
    await Phase.updateMany(
      { chatId: phase.chatId, order: { $gt: phase.order } },
      { $inc: { order: -1 } }
    );

    res.json({ message: "Phase deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/:chatId/phases", async (req, res) => {
    const { chatId } = req.params;
  
    try {
      const phases = await Phase.find({ chatId }).sort({ order: 1 }).populate("chatId");
      if (!phases) {
        return res.status(404).json({ message: "No phases found for this chat" });
      }
      res.json({ phases });
      console.log('phases',phases);
    } catch (error) {
      console.error("Error fetching phases:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  
  

module.exports = router;