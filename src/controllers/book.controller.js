const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/"); // Store files in the 'images' directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Get all books with reviews and categories
exports.get = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        reviews: {
          include: {
            user: true, // Include user details in reviews
          },
        },
      },
    });

    const booksWithUrls = books.map((book) => ({
      _id: book.book_id.toString(),
      title: book.title,
      author: book.author,
      publish_year: book.publish_year,
      description: book.description,
      book_photo: book.book_photo
        ? `${req.protocol}://${req.get("host")}/images/${book.book_photo}`
        : null,
      summary: book.summary,
      categories: book.categories.map((cat) => cat.category),
      reviews: book.reviews.map((review) => ({
        review_id: review.review_id.toString(),
        user: {
          user_id: review.user.user_id.toString(),
          username: review.user.username,
          email: review.user.email,
        },
        rating: review.rating,
        comment: review.comment,
        review_date: review.review_date,
      })),
    }));

    res.json(booksWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single book by ID with reviews and categories
exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await prisma.book.findUnique({
      where: { book_id: id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        reviews: {
          include: {
            user: true, // Include user details in reviews
          },
        },
      },
    });

    if (book) {
      const bookWithUrl = {
        _id: book.book_id.toString(),
        title: book.title,
        author: book.author,
        publish_year: book.publish_year,
        description: book.description,
        book_photo: book.book_photo
          ? `${req.protocol}://${req.get("host")}/images/${book.book_photo}`
          : null,
        summary: book.summary,
        categories: book.categories.map((cat) => cat.category),
        reviews: book.reviews.map((review) => ({
          review_id: review.review_id.toString(),
          user: {
            user_id: review.user.user_id.toString(),
            username: review.user.username,
            email: review.user.email,
          },
          rating: review.rating,
          comment: review.comment,
          review_date: review.review_date,
        })),
      };
      res.json(bookWithUrl);
    } else {
      res.status(404).json({ error: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new book with categories
exports.create = async (req, res) => {
  upload.single("book_photo")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { title, author, publish_year, description, summary } = req.body;
    const category_ids = req.body.categories.split(",");
    const book_photo = req.file ? req.file.filename : null;

    try {
      const book = await prisma.book.create({
        data: {
          title,
          author,
          publish_year: parseInt(publish_year),
          description,
          summary,
          book_photo,
          categories: {
            create: category_ids.map((id) => ({ category_id: id })),
          },
        },
      });

      const bookResponse = {
        _id: book.book_id.toString(),
        title: book.title,
        author: book.author,
        publish_year: book.publish_year,
        description: book.description,
        book_photo: book.book_photo
          ? `${req.protocol}://${req.get("host")}/images/${book.book_photo}`
          : null,
        summary: book.summary,
      };

      res.json(bookResponse);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

// Update a book with categories
exports.update = async (req, res) => {
  upload.single("book_photo")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { id } = req.params;
    const { description, summary, category_ids } = req.body;
    const book_photo = req.file ? req.file.filename : null;

    try {
      const book = await prisma.book.update({
        where: { book_id: id },
        data: {
          description,
          summary,
          book_photo,
          categories: {
            deleteMany: {}, // Clear existing categories
            create: category_ids.map((id) => ({ category_id: id })),
          },
        },
      });

      const bookResponse = {
        _id: book.book_id.toString(),
        title: book.title,
        author: book.author,
        publish_year: book.publish_year,
        description: book.description,
        book_photo: book.book_photo
          ? `${req.protocol}://${req.get("host")}/images/${book.book_photo}`
          : null,
        summary: book.summary,
      };

      res.json(bookResponse);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

// Delete a book and its associated reviews
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    // Delete associated reviews first
    await prisma.review.deleteMany({
      where: { book_id: id },
    });

    // Then delete the book
    const book = await prisma.book.delete({
      where: { book_id: id },
    });

    const bookResponse = {
      _id: book.book_id.toString(),
      title: book.title,
      author: book.author,
      publish_year: book.publish_year,
      description: book.description,
      book_photo: book.book_photo
        ? `${req.protocol}://${req.get("host")}/images/${book.book_photo}`
        : null,
      summary: book.summary,
    };

    res.json(bookResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};