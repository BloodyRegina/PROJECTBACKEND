const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const bookCategories = await prisma.bookCategory.findMany({
      include: {
        book: true,
        category: true,
      },
    });
    res.json(bookCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.add = async (req, res) => {
  const { book_id, category_id } = req.body;
  if (!book_id || !category_id) {
    return res.status(400).json({ error: "book_id and category_id are required" });
  }
  try {
    const newBookCategory = await prisma.bookCategory.create({
      data: {
        book_id: book_id.toString(),
        category_id: category_id.toString(),
      },
    });
    res.json(newBookCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }
  try {
    const deletedBookCategory = await prisma.bookCategory.delete({
      where: { id: id.toString() },
    });
    res.json(deletedBookCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
