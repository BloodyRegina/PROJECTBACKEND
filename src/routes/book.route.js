const express = require('express');
const app = express.Router();
const controller = require('../controllers/book.controller');

// Define routes
app.get("/", controller.get);
app.get("/:id", controller.getById);
app.post("/", controller.create);
app.put("/:id", controller.update);
app.delete("/:id", controller.delete);
app.get('/:title/:author/:publish_year', controller.searchBooks);
module.exports = app;
