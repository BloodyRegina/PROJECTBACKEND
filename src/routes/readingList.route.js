const express = require('express');
const app = express.Router();
const controller = require('../controllers/readingList.controller');

// Routes
app.get('/', controller.getAll);
app.get('/:user_id', controller.getByUserId);
app.post('/', controller.add);
app.put('/:user_id/:book_id', controller.update);
app.delete('/:user_id/:book_id', controller.delete);
app.patch("/:id/finish", controller.finishReading);
app.patch("/:id/review", controller.updateReview);
module.exports = app;
