// routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const Task = require("../models/taskModel");
const Phase = require("../models/phaseModel");
const User = require("../models/userModel");  // Import the User model
// Route to add a new task to a specific phase with ordered tasks
router.post("/:phaseId/tasks", async (req, res) => {
  console.log("Adding task");
  
  const { phaseId } = req.params;
  const {
    description,
    assignedTo,
    dueDate,
    status = "pending",
    chatId,
  } = req.body;

  try {
    const phase = await Phase.findById(phaseId);
    if (!phase) {
      return res.status(404).json({ message: "Phase not found" });
    }

    // Get the current number of tasks in the phase to determine the order
    const taskCount = await Task.countDocuments({ phaseId });
    const newTask = new Task({
      description,
      assignedTo,
      dueDate,
      status,
      chatId,
      phaseId,
      order: taskCount + 1,
    });
    await newTask.save();

    res.status(201).json({ message: "Task added successfully", task: newTask });
    console.log("New task added");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
// Route to delete a task and update order of remaining tasks
router.delete("/:phaseId/tasks/:taskId", async (req, res) => {
  const { phaseId, taskId } = req.params;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Use deleteOne or findByIdAndDelete instead of remove
    await task.deleteOne();  // Or use Task.findByIdAndDelete(taskId);

    // Reorder remaining tasks
    await Task.updateMany(
      { phaseId: task.phaseId, order: { $gt: task.order } },
      { $inc: { order: -1 } }
    );

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:phaseId/tasks", async (req, res) => {
  const { phaseId } = req.params;

  try {
    // Fetch tasks related to the phase (no population yet)
    const tasks = await Task.find({ phaseId }).sort({ order: 1 });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found for this phase" });
    }

    // For each task, fetch the user assigned to the task and add their name
    const tasksWithAssignedToName = await Promise.all(
      tasks.map(async (task) => {
        // Fetch the user assigned to this task
        const user = await User.findById(task.assignedTo).select("name");

        // Dynamically add the assignedToName field to the task
        const taskWithAssignedToName = {
          ...task.toObject(), // Convert Mongoose document to plain object
          assignedToName: user ? user.name : "Unknown" // Add the assignedToName field
        };

        // Return the modified task
        return taskWithAssignedToName;
      })
    );
    console.log(tasksWithAssignedToName);
    // Send the tasks with the assigned user's name included
    res.json({ tasks: tasksWithAssignedToName });
  } catch (error) {
    console.error("Error fetching tasks for phase:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;