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

exports.get = async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    const booksWithUrls = books.map((book) => ({
      _id: book.book_id.toString(), // เปลี่ยน book_id เป็น _id
      title: book.title,
      author: book.author,
      publish_year: book.publish_year,
      description: book.description,
      book_photo: book.book_photo
        ? `${req.protocol}://${req.get("host")}/images/${book.book_photo}`
        : null,
      summary: book.summary,
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
      where: { book_id: id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (book) {
      const bookWithUrl = {
        _id: book.book_id.toString(), // เปลี่ยน book_id เป็น _id
        title: book.title,
        author: book.author,
        publish_year: book.publish_year,
        description: book.description,
        book_photo: book.book_photo
          ? `${req.protocol}://${req.get("host")}/images/${book.book_photo}`
          : null,
        summary: book.summary,
      };
      res.json(bookWithUrl);
    } else {
      res.status(404).json({ error: "Book not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  upload.single("book_photo")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { description, summary } = req.body;
    const category_ids = req.body.categories.split(","); // แปลง String "5,6" เป็น Array
    const book_photo = req.file ? req.file.filename : null;

    try {
      const book = await prisma.book.create({
        data: {
          description,
          summary,
          book_photo,
          categories: {
            create: category_ids.map((id) => ({ category_id: id })),
          },
        },
      });

      const bookResponse = {
        _id: book.book_id.toString(), // เปลี่ยน book_id เป็น _id
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
        _id: book.book_id.toString(), // เปลี่ยน book_id เป็น _id
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

exports.searchBooks = async (req, res) => {
  const { title, author, publish_year } = req.params;

  try {
    // สร้างเงื่อนไขแบบ Dynamic
    const filters = [];

    if (title && title !== "default") {
      filters.push({
        title: {
          startsWith: title,
        },
      });
    }

    if (author && author !== "default") {
      filters.push({
        author: {
          startsWith: author,
        },
      });
    }

    if (publish_year && publish_year !== "default") {
      filters.push({
        publish_year: parseInt(publish_year),
      });
    }

    // ส่ง query โดยใช้เงื่อนไขที่กรองแล้ว
    const books = await prisma.book.findMany({
      where: {
        AND: filters,
      },
      orderBy: {
        title: "asc",
      },
    });

    const booksWithUrls = books.map((book) => ({
      _id: book.book_id.toString(), // เปลี่ยน book_id เป็น _id
      title: book.title,
      author: book.author,
      publish_year: book.publish_year,
      description: book.description,
      book_photo: book.book_photo
        ? `${req.protocol}://${req.get("host")}/images/${book.book_photo}`
        : null,
      summary: book.summary,
    }));

    res.json(booksWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await prisma.book.delete({
      where: { book_id: id },
    });

    const bookResponse = {
      _id: book.book_id.toString(), // เปลี่ยน book_id เป็น _id
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
