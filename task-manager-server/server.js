
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Connect to local MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/taskmanager")
  .then(() => console.log("MongoDB connected"))
  .catch((err) =>
    console.log("MongoDB connection error:", err.message)
  );

// Define Task Schema
const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Ongoing", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", TaskSchema);

// GET: Fetch all tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch tasks." });
  }
});

// POST: Create a task
app.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required.",
      });
    }

    const task = await Task.create({ title: title.trim() });
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Could not create task." });
  }
});

// PATCH: Update task status
app.patch("/tasks/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Pending", "Ongoing", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid task status." });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update task." });
  }
});

// DELETE: Delete a task
app.delete("/tasks/:id", async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete task." });
  }
});

// Start server after database connection succeeds
const PORT = 5000;

mongoose.connection.once("open", () => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
