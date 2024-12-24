const express = require("express");
const app = express.Router();
const controller = require('../controllers/customer.controller');

app.get("/", controller.get);

app.get("/:id", controller.getById);

app.get("/name/:name", controller.getname);

app.post("/",  controller.post);

app.put("/:id",  controller.put);

app.patch("/:id",  controller.patch);
app.delete("/:id",  controller.delete);
module.exports = app;