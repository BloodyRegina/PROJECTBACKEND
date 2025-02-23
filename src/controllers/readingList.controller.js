const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all reading lists with book and user details
exports.getAll = async (req, res) => {
  try {
    const readingLists = await prisma.readingList.findMany({
      include: {
        book: {
          include: {
            reviews: true, // Include reviews for the book
          },
        },
        user: true,
      },
    });
    res.json(readingLists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reading lists by user ID with book details
exports.getByUserId = async (req, res) => {
  const { user_id } = req.params;
  try {
    const readingList = await prisma.readingList.findMany({
      where: { user_id },
      include: {
        book: {
          include: {
            reviews: true, // Include reviews for the book
          },
        },
      },
    });
    res.json(readingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new reading list entry
exports.add = async (req, res) => {
  const { user_id, book_id, status, review, finish_date, start_date } = req.body;
  try {
    const newReadingList = await prisma.readingList.create({
      data: {
        user_id,
        book_id,
        status,
        review,
        finish_date: finish_date ? new Date(finish_date) : null,
        start_date: start_date ? new Date(start_date) : null,
      },
    });

    // If a review is provided, create a review entry
    if (review) {
      await prisma.review.create({
        data: {
          user_id,
          book_id,
          comment: review,
          rating: 0, // Default rating (can be updated later)
        },
      });

      // Update review count and average rating in the Book model
      await updateBookReviewStats(book_id);
    }

    res.json(newReadingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a reading list entry
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

    // If a review is provided, update or create a review entry
    if (review) {
      await prisma.review.upsert({
        where: { user_id_book_id: { user_id, book_id } },
        update: { comment: review },
        create: {
          user_id,
          book_id,
          comment: review,
          rating: 0, // Default rating (can be updated later)
        },
      });

      // Update review count and average rating in the Book model
      await updateBookReviewStats(book_id);
    }

    res.json(updatedReadingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark a reading list entry as completed
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

// Update a review in a reading list entry
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

    // Update or create a review entry
    const readingList = await prisma.readingList.findUnique({
      where: { id },
    });

    if (readingList) {
      await prisma.review.upsert({
        where: { user_id_book_id: { user_id: readingList.user_id, book_id: readingList.book_id } },
        update: { comment: review },
        create: {
          user_id: readingList.user_id,
          book_id: readingList.book_id,
          comment: review,
          rating: 0, // Default rating (can be updated later)
        },
      });

      // Update review count and average rating in the Book model
      await updateBookReviewStats(readingList.book_id);
    }

    res.json({
      message: "Review updated",
      updatedReadingList,
    });
  } catch (error) {
    res.status(404).json({ error: "Reading list entry not found" });
  }
};

// Delete a reading list entry
exports.delete = async (req, res) => {
  const { user_id, book_id } = req.params;
  try {
    // Delete associated review if it exists
    await prisma.review.deleteMany({
      where: { user_id, book_id },
    });

    // Delete the reading list entry
    const deletedReadingList = await prisma.readingList.delete({
      where: { user_id_book_id: { user_id, book_id } },
    });

    // Update review count and average rating in the Book model
    await updateBookReviewStats(book_id);

    res.json(deletedReadingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to update review count and average rating in the Book model
async function updateBookReviewStats(book_id) {
  const reviews = await prisma.review.findMany({
    where: { book_id },
  });

  const reviewCount = reviews.length;
  const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  const averageRating = reviewCount > 0 ? totalRating / reviewCount : null;

  await prisma.book.update({
    where: { book_id },
    data: {
      review_count: reviewCount,
      average_rating: averageRating,
    },
  });
}