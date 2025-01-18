const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const bookCategories = await prisma.bookCategory.findMany({
      include: { book: true, category: true },
    });
    res.json(bookCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.add = async (req, res) => {
  const { book_id, category_id } = req.body;
  try {
    const newBookCategory = await prisma.bookCategory.create({
      data: {
        book_id: parseInt(book_id),
        category_id: parseInt(category_id),
      },
    });
    res.json(newBookCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  const { book_id, category_id } = req.params;
  try {
    const deletedBookCategory = await prisma.bookCategory.delete({
      where: { book_id_category_id: { book_id: parseInt(book_id), category_id: parseInt(category_id) } },
    });
    res.json(deletedBookCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
