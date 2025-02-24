const express = require('express');
const app = express.Router();
const controller = require('../controllers/book.controller');
const authMiddleware = require('../middlewares/auth.middleware');
// Define routes
app.get("/", controller.get);
app.get("/:id", controller.getById);
app.post("/", controller.create);
app.put("/:id", controller.update);
app.delete("/:id", controller.delete);
app.get('/search/:title/:author/:publish_year', controller.searchBooks);
app.get('/top-books/top', controller.getTopBooks);
app.get('/top-books/toprating', controller.getTopRatingBooks);

// เส้นทางใหม่สำหรับเพิ่มค่า added_to_list_count
app.put('/increment-added-to-list/:id',authMiddleware.authenticate , controller.incrementAddedToListCount);

// เส้นทางใหม่สำหรับเพิ่มรีวิว
app.post('/add-review',authMiddleware.authenticate ,controller.addReview);

module.exports = app;
