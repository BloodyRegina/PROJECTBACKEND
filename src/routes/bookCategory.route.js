const express = require('express');
const app = express.Router();
const controller = require('../controllers/bookCategory.controller');

// Routes
app.get('/', controller.getAll);
app.post('/', controller.add);
app.delete('/:book_id/:category_id', controller.delete);

module.exports = app;
