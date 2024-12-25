const express = require('express');
const app = express.Router();
const controller = require('../controllers/category.controller');

// Define routes
app.get("/", controller.get); // Get all categories
app.get("/:id", controller.getById); // Get a category by ID
app.post("/", controller.create); // Create a new category
app.put("/:id", controller.update); // Update a category by ID
app.delete("/:id", controller.delete); // Delete a category by ID

module.exports = app;
