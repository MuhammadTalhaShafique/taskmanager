const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/taskmanager"; // Default for local dev if MONGODB_URI not set

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log(`Connected to MongoDB using: ${mongoURI}`);

    // Start the server only after successful DB connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error with URI:", mongoURI, err);
    process.exit(1); // Exit the process if DB connection fails
  });

// --- Model Definitions ---
// User Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
});

// Todo Model
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Todo = mongoose.model("Todo", todoSchema);

// --- Middleware ---
// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("Auth middleware: No token provided.");
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.name, error.message); // Logging for JWT errors
    res.status(401).json({ error: "Invalid token" });
  }
};

// --- API Routes ---

// == User Routes ==

// Register User  -- THIS ROUTE WAS MISSING AND HAS BEEN RE-ADDED --
app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if required fields are provided
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, and password" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
    await user.save(); // User data saved here

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("User registered successfully:", user.email, user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Error in /api/users/register:", error);
    res.status(500).json({ message: "Server error during user registration" });
  }
});

// Login User
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid credentials (email not found)" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid credentials (password mismatch)" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Error in /api/users/login:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Get User Profile
app.get("/api/users/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error in /api/users/me:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// == Todo Routes ==

// Create Todo -- THIS IS THE VERSION WITH ENHANCED LOGGING --
// (The misleading "// Register User" comment was removed from here)
app.post("/api/todos", auth, async (req, res) => {
  try {
    console.log(`POST /api/todos - User ID from auth: ${req.userId}`);
    console.log(`POST /api/todos - Request body:`, req.body);

    const { title, description } = req.body;

    if (!req.userId) {
      console.error(
        "POST /api/todos - Aborting: req.userId is missing after auth middleware."
      );
      return res
        .status(401)
        .json({ message: "User ID missing, authentication issue." });
    }
    if (!title) {
      console.error(
        "POST /api/todos - Aborting: title is missing from request body."
      );
      return res.status(400).json({ message: "Title is required for a todo." });
    }

    const todo = new Todo({ title, description, user: req.userId });
    await todo.save(); // Todo data saved here
    console.log("POST /api/todos - Todo saved successfully:", todo._id);
    res.status(201).json(todo);
  } catch (error) {
    console.error("POST /api/todos - Error during save operation:", error);
    res.status(500).json({ message: "Server error while creating todo" });
  }
});

// Get All Todos for a User
app.get("/api/todos", auth, async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    console.error("Error in GET /api/todos:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Single Todo
app.get("/api/todos/:id", auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.userId });
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json(todo);
  } catch (error) {
    console.error(`Error in GET /api/todos/${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Todo
app.put("/api/todos/:id", auth, async (req, res) => {
  try {
    const { title, description, completed } = req.body;
    const todo = await Todo.findOne({ _id: req.params.id, user: req.userId });

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    // Only update fields that are provided in the request body
    if (title !== undefined) todo.title = title;
    if (description !== undefined) todo.description = description; // Consider allowing empty string to clear description
    if (completed !== undefined) todo.completed = completed;

    await todo.save(); // Updated todo data saved here
    res.json(todo);
  } catch (error) {
    console.error(`Error in PUT /api/todos/${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Todo
app.delete("/api/todos/:id", auth, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json({ message: "Todo removed" });
  } catch (error) {
    console.error(`Error in DELETE /api/todos/${req.params.id}:`, error);
    res.status(500).json({ message: "Server error" });
  }
});

// NOTE: The duplicate (simpler) app.post("/api/todos", ...) has been removed.
