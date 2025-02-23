const express = require('express');
const app = express.Router();
const controller = require('../controllers/readingList.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Routes
app.get('/', authMiddleware.authenticate, controller.getAll);
app.get('/:user_id', authMiddleware.authenticate, controller.getByUserId);
app.post('/', authMiddleware.authenticate, controller.add);
app.put('/:user_id/:book_id', authMiddleware.authenticate, controller.update);
app.delete('/:user_id/:book_id', authMiddleware.authenticate, controller.delete);

// New routes
app.patch("/:id/finish", authMiddleware.authenticate, controller.finishReading);
app.patch("/:id/review", authMiddleware.authenticate, controller.updateReview);

module.exports = app;