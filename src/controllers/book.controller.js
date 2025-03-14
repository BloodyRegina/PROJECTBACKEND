const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require("multer");
const path = require("path");


// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = file.fieldname === "book_photo" ? "images/" : "html_books/";
    
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// ใช้ `diskStorage` แทน `buffer`
const upload = multer({ storage: storage }).fields([
  { name: "book_photo", maxCount: 1 },
  { name: "html_content", maxCount: 1 },
]);

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
      added_to_list_count:book.added_to_list_count,
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
      html_content: book.html_content
        ? `${req.protocol}://${req.get("host")}/html_books/${book.html_content}`
        : null, // Include HTML file URL
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
        reviews: {
          include: {
            user: {
              select: {
                user_id: true,
                username: true,
                email: true,
                picture: true, // ดึง picture มาแน่ๆ
              },
            },
          },
        },
      },
    });
    
    console.log(book.reviews);
    
    if (book) {
      const bookWithUrl = {
        book_id: book.book_id.toString(),
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
            pictureUrl: review.user.picture
              ? `${req.protocol}://${req.get("host")}/userpictures/${review.user.picture}`
              : null,
          },
          rating: review.rating,
          comment: review.comment,
          review_date: review.review_date,
        })),
        html_content: book.html_content
          ? `${req.protocol}://${req.get("host")}/html_books/${book.html_content}`
          : null,
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
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { title, author, publish_year, description, summary, categories } = req.body;

    // ดึงค่าไฟล์ที่อัปโหลด
    const book_photo = req.files["book_photo"] ? req.files["book_photo"][0].filename : null;
    const html_content = req.files["html_content"] ? req.files["html_content"][0].filename : null;

    // ตรวจสอบ categories (เผื่อกรณีไม่ได้ส่งมา)
    const category_ids = categories ? categories.split(",") : [];

    try {
      const book = await prisma.book.create({
        data: {
          title,
          author,
          publish_year: parseInt(publish_year),
          description,
          summary,
          book_photo,
          html_content,
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
        book_photo: book_photo ? `${req.protocol}://${req.get("host")}/images/${book_photo}` : null,
        summary: book.summary,
        html_content: html_content ? `${req.protocol}://${req.get("host")}/html_books/${html_content}` : null,
      };
      console.log("Uploaded files:", req.files);
      res.json(bookResponse);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

exports.update = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { id } = req.params;
    const { title, author, publish_year, description, summary, categories } = req.body;

    // ดึงค่าไฟล์ที่อัปโหลด
    const book_photo = req.files["book_photo"] ? req.files["book_photo"][0].filename : null;
    const html_content = req.files["html_content"] ? req.files["html_content"][0].filename : null;

    // ตรวจสอบ categories (เผื่อกรณีไม่ได้ส่งมา)
    const category_ids = categories ? categories.split(",") : [];

    try {
      const book = await prisma.book.update({
        where: { book_id: id },
        data: {
          title,
          author,
          publish_year: publish_year ? parseInt(publish_year) : undefined,
          description,
          summary,
          book_photo,
          html_content,
          categories: {
            deleteMany: {},
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
        html_content: book.html_content
          ? `${req.protocol}://${req.get("host")}/html_books/${book.html_content}`
          : null,
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

    const books = await prisma.book.findMany({
      where: {
        AND: filters,
      },
      orderBy: {
        title: "asc",
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
      html_content: book.html_content
        ? `${req.protocol}://${req.get("host")}/html_books/${book.html_content}`
        : null, // Include HTML file URL
    }));

    res.json(booksWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.review.deleteMany({
      where: { book_id: id },
    });

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
      html_content: book.html_content
        ? `${req.protocol}://${req.get("host")}/html_books/${book.html_content}`
        : null, // Include HTML file URL
    };

    res.json(bookResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTopBooks = async (req, res) => {
  const { limit } = req.query;

  try {
    const topBooks = await prisma.book.findMany({
      orderBy: [
        { added_to_list_count: "desc" },
        { review_count: "desc" },
      ],
      take: parseInt(limit) || 10,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        reviews: {
          include: {
            user: true,
          },
        },
      },
    });

    const booksWithUrls = topBooks.map((book) => ({
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
      html_content: book.html_content
        ? `${req.protocol}://${req.get("host")}/html_books/${book.html_content}`
        : null, // Include HTML file URL
    }));

    res.json(booksWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTopRatingBooks = async (req, res) => {
  const { limit } = req.query;

  try {
    const topBooks = await prisma.book.findMany({
      orderBy: [
        { average_rating: "desc" },
        { review_count: "desc" },
      ],
      take: parseInt(limit) || 10,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        reviews: {
          include: {
            user: true,
          },
        },
      },
    });

    const booksWithUrls = topBooks.map((book) => ({
      _id: book.book_id.toString(),
      title: book.title,
      author: book.author,
      publish_year: book.publish_year,
      description: book.description,
      book_photo: book.book_photo
        ? `${req.protocol}://${req.get("host")}/images/${book.book_photo}`
        : null,
      summary: book.summary,
      averageRating: book.average_rating,
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
      html_content: book.html_content
        ? `${req.protocol}://${req.get("host")}/html_books/${book.html_content}`
        : null, // Include HTML file URL
    }));

    res.json(booksWithUrls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// exports.addReview and exports.incrementAddedToListCount remain unchanged

exports.addReview = async (req, res) => {
  const { book_id, user_id, rating, comment } = req.body;

  // แปลง rating จาก string เป็น integer
  const ratingInt = parseInt(rating, 10);
  
  if (isNaN(ratingInt)) {
    return res.status(400).json({ error: "Invalid rating value. Must be an integer." });
  }
  
  try {
    const review = await prisma.review.create({
      data: {
        book: {
          connect: { book_id },
        },
        user: {
          connect: { user_id },
        },
        rating: ratingInt,
        comment,
      },
      include: { user: true }, // ✅ ดึงข้อมูล user มาพร้อมกัน
    });

    // ✅ ตรวจสอบว่ามี user หรือไม่ แล้วแปลง picture เป็น URL
    if (review.user) {
      review.user.pictureUrl = review.user.picture
        ? `${req.protocol}://${req.get("host")}/userpictures/${review.user.picture}`
        : null;
    }

    // อัพเดทค่า review_count และ average_rating ของหนังสือ
    const book = await prisma.book.update({
      where: { book_id },
      data: {
        review_count: { increment: 1 },
        average_rating: await calculateAverageRating(book_id),
      },
    });

    res.json({ review, book });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ฟังก์ชันเพื่อคำนวณค่าเฉลี่ยของคะแนน
async function calculateAverageRating(book_id) {
  const reviews = await prisma.review.findMany({
    where: { book_id },
    select: { rating: true },
  });

  const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = totalRating / reviews.length;

  return averageRating;
}

exports.incrementAddedToListCount = async (req, res) => {
  const { id } = req.params; // รับ book_id จาก URL parameters

  try {
    const book = await prisma.book.update({
      where: { book_id: id },
      data: {
        added_to_list_count: {
          increment: 1, // เพิ่มค่า added_to_list_count ขึ้น 1
        },
      },
    });

    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};