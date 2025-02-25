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
            reviews: {
              include: {
                user: true,
              },
            },
          },
        },
        user: true,
      },
    });

    const formattedReadingList = readingList.map((entry) => ({
      id: entry.id.toString(),
      user_id: entry.user_id.toString(),
      book_id: entry.book_id.toString(),
      status: entry.status,
      add_date: entry.add_date,
      start_date: entry.start_date,
      finish_date: entry.finish_date,
      book: entry.book
        ? {
            book_id: entry.book.book_id.toString(),
            title: entry.book.title,
            author: entry.book.author,
            publish_year: entry.book.publish_year,
            description: entry.book.description,
            book_photo: entry.book.book_photo
              ? `${req.protocol}://${req.get("host")}/images/${entry.book.book_photo}`
              : null,
            summary: entry.book.summary,
            added_to_list_count: entry.book.added_to_list_count,
            average_rating: entry.book.average_rating,
            review_count: entry.book.review_count,
            html_content: entry.book.html_content
              ? `${req.protocol}://${req.get("host")}/html_books/${entry.book.html_content}`
              : null,
            reviews: entry.book.reviews.map((review) => ({
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
          }
        : null,
      user: entry.user
        ? {
            user_id: entry.user.user_id.toString(),
            username: entry.user.username,
            email: entry.user.email,
            picture: entry.user.picture
              ? `${req.protocol}://${req.get("host")}/profile_pictures/${entry.user.picture}`
              : null,
            created_at: entry.user.created_at,
            updated_at: entry.user.updated_at,
          }
        : null,
    }));

    res.json(formattedReadingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Add a new reading list entry
exports.add = async (req, res) => {
  try {
    console.log("📌 Received request body:", req.body); // ดูค่าที่ส่งมาว่าครบไหม

    const { user_id, book_id, status, finish_date, start_date } = req.body;

    if (!user_id || !book_id) {
      return res.status(400).json({ error: "Missing user_id or book_id" });
    }

    const newReadingList = await prisma.readingList.create({
      data: {
        user_id,
        book_id,
        status: status || "reading",
        start_date: start_date ? new Date(start_date) : new Date(),
        finish_date: finish_date ? new Date(finish_date) : null,
      },
    });

    res.json(newReadingList);
  } catch (error) {
    console.error("❌ Error in adding to reading list:", error);
    res.status(500).json({ error: error.message });
  }
};



// Update a reading list entry
exports.update = async (req, res) => {
  const { user_id, book_id } = req.params;
  const { status, finish_date, start_date } = req.body;
  try {
    const updatedReadingList = await prisma.readingList.update({
      where: { user_id_book_id: { user_id, book_id } },
      data: {
        status,
        finish_date: finish_date ? new Date(finish_date) : null,
        start_date: start_date ? new Date(start_date) : null,
      },
    });
    res.json(updatedReadingList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.startReading = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedReadingList = await prisma.readingList.update({
      where: { id },
      data: {
        status: "READING",
        start_date: new Date(),
      },
    });
    res.json({
      message: "Status updated to reading",
      updatedReadingList,
    });
  } catch (error) {
    res.status(404).json({ error: "Reading list entry not found or invalid id" });
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

// Delete a reading list entry
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

// Function to find fastest readers
exports.findFastestReaders = async (req, res) => {
  try {
    const readingLists = await prisma.readingList.findMany({
      where: {
        finish_date: {
          not: null,
        },
      },
      include: {
        user: true,
      },
    });

    const userReadingTimes = {};
    readingLists.forEach((list) => {
      if (list.start_date && list.finish_date) {
        const timeDiff = list.finish_date.getTime() - list.start_date.getTime();
        const userId = list.user_id;

        if (!userReadingTimes[userId]) {
          userReadingTimes[userId] = {
            totalTime: 0,
            count: 0,
            username: list.user.username,
          };
        }

        userReadingTimes[userId].totalTime += timeDiff;
        userReadingTimes[userId].count++;
      }
    });

    const userAverageTimes = Object.entries(userReadingTimes).map(
      ([userId, data]) => ({
        userId,
        averageTime: data.totalTime / data.count,
        username: data.username,
      })
    );

    userAverageTimes.sort((a, b) => a.averageTime - b.averageTime);

    res.json(userAverageTimes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};