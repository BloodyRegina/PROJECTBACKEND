const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.get = async (req, res) => {
  try {
    const userBooks = await prisma.userBook.findMany({
      include: {
        user: true, // Include user details
        book: true, // Include book details
      },
    });
    res.json(userBooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  try {
    const userBook = await prisma.userBook.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        user: true, // Include user details
        book: true, // Include book details
      },
    });
    if (userBook) {
      res.json(userBook);
    } else {
      res.status(404).json({ error: "UserBook not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  const { user_id, book_id, status } = req.body;
  try {
    const userBook = await prisma.userBook.create({
      data: {
        user_id: parseInt(user_id),
        book_id: parseInt(book_id),
        status,
      },
    });
    res.status(201).json(userBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const userBook = await prisma.userBook.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status,
      },
    });
    res.json(userBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const userBook = await prisma.userBook.delete({
      where: {
        id: parseInt(id),
      },
    });
    res.json(userBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
