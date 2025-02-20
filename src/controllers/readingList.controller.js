const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const readingLists = await prisma.readingList.findMany({
      include: { book: true, user: true },
    });
    res.json(readingLists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getByUserId = async (req, res) => {
  const { user_id } = req.params;
  try {
    const readingList = await prisma.readingList.findMany({
      where: { user_id: user_id }, // Prisma คาดหวัง String อยู่แล้ว
      include: { book: true },
    });
    res.json(readingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.add = async (req, res) => {
  const { user_id, book_id, status, review, finish_date, start_date } = req.body;
  try {
    const newReadingList = await prisma.readingList.create({
      data: {
        user_id,  // ไม่ต้องใช้ parseInt()
        book_id,
        status,
        review,
        finish_date: finish_date ? new Date(finish_date) : null,
        start_date: start_date ? new Date(start_date) : null,
      },
    });
    res.json(newReadingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.update = async (req, res) => {
  const { user_id, book_id } = req.params;
  const { status, review, finish_date, start_date } = req.body;
  try {
    const updatedReadingList = await prisma.readingList.update({
      where: { user_id_book_id: { user_id, book_id } },
      data: {
        status,
        review,
        finish_date: finish_date ? new Date(finish_date) : null,
        start_date: start_date ? new Date(start_date) : null,
      },
    });
    res.json(updatedReadingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.finishReading = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedReadingList = await prisma.readingList.update({
      where: { id },
      data: {
        status: "COMPLETED",
        finish_date: new Date(),
      },
    });
    res.json({
      message: "Status updated to completed",
      updatedReadingList,
    });
  } catch (error) {
    res.status(404).json({ error: "Reading list entry not found or invalid id" });
  }
};

  
exports.updateReview = async (req, res) => {
  const { id } = req.params;
  const { review } = req.body;

  if (!review) {
    return res.status(400).json({ error: "Review is required" });
  }

  try {
    const updatedReadingList = await prisma.readingList.update({
      where: { id },
      data: { review },
    });

    res.json({
      message: "Review updated",
      updatedReadingList,
    });
  } catch (error) {
    res.status(404).json({ error: "Reading list entry not found" });
  }
};

  

  exports.delete = async (req, res) => {
    const { user_id, book_id } = req.params;
    try {
      const deletedReadingList = await prisma.readingList.delete({
        where: { user_id_book_id: { user_id, book_id } },
      });
      res.json(deletedReadingList);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
