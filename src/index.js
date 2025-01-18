const express = require('express')
const app = express()

// get port number from environment settings
require('dotenv').config()
const port = process.env.PORT || 3000

const bodyParser = require('body-parser')
const cors = require('cors')
const booksRoute = require('./routes/book.route')
const categoriesRoute = require('./routes/category.route');
const registersRoute = require('./routes/register.route')
const readingListRoute = require('./routes/readingList.route')
const bookCategoryRoute = require('./routes/bookCategory.route')

app.use('/images', express.static('images'));
app.use('/userpictures', express.static('userpictures'));
// CORS cross origin resource sharing
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))

//path url
// app.[method]()
// match localhost:4000/
app.get("/", (req, res) =>{
    res.send("Sawatdee")
})

app.use("/books", booksRoute)
app.use("/categories", categoriesRoute);
app.use("/registers", registersRoute)
app.use("/readings", readingListRoute)
app.use("/bookcategories", bookCategoryRoute)
app.listen(port, () => {
    console.log("App started at port: " + port)
})