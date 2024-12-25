const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/'); // Store files in the 'images' directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage: storage });

exports.get = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      include: {
        category: true, // Include category relationship
      },
    });
    // Add image URL to each book
    const booksWithUrls = books.map(book => ({
      ...book,
      pictureUrl: book.picture ? `${req.protocol}://${req.get('host')}/images/${book.picture}` : null,
    }));
    res.json(booksWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await prisma.book.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        category: true, // Include category relationship
      },
    });
    if (book) {
      book.pictureUrl = book.picture ? `${req.protocol}://${req.get('host')}/images/${book.picture}` : null;
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  // Use upload.single middleware to handle file upload
  upload.single('picture')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { title, author, categoryId } = req.body;
    const picture = req.file ? req.file.filename : null; // Get filename if uploaded

    try {
      const book = await prisma.book.create({
        data: {
          title,
          author,
          categoryId: categoryId ? parseInt(categoryId) : null,
          picture, // Store filename in the database
        },
      });
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

exports.update = async (req, res) => {
  upload.single('picture')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { id } = req.params;
    const { title, author, categoryId } = req.body;
    const picture = req.file ? req.file.filename : null;

    try {
      const book = await prisma.book.update({
        where: {
          id: parseInt(id),
        },
        data: {
          title,
          author,
          categoryId: categoryId ? parseInt(categoryId) : null,
          picture, // Update filename if a new file is uploaded
        },
      });
      res.json(book);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await prisma.book.delete({
      where: {
        id: parseInt(id),
      },
    });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
