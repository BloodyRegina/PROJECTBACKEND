const express = require('express');
const app = express.Router();
const controller = require('../controllers/category.controller');

// define routes here
app.get("/", controller.get);
app.get("/:id",controller.getById);


module.exports = app;