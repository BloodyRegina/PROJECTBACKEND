const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'userpictures/'); // Store files in the 'images' directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop()); 
  }
});

const upload = multer({ storage: storage });

exports.get = async (req, res) => {
  const users = await prisma.user.findMany();
  // Add image URL to each user
  const usersWithUrls = users.map(user => ({
    ...user,
    pictureUrl: user.picture ? `${req.protocol}://${req.get('host')}/userpictures/${user.picture}` : null
  }));
  res.json(usersWithUrls);
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: {
      id: parseInt(id),
    },
  });
  // Add image URL to the user
  if (user) {
    user.pictureUrl = user.picture ? `${req.protocol}://${req.get('host')}/userpictures/${user.picture}` : null;
  }
  res.json(user);
};

exports.create = async (req, res) => {
  // Use upload.single middleware to handle file upload
  upload.single('picture')(req, res, async (err) => { 
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { name, email, password } = req.body;
    const picture = req.file ? req.file.filename : null; // Get filename if uploaded

    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password,
          picture, // Store filename in the database
        },
      });
      res.json(user);
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
    const { name, email, password } = req.body;
    const picture = req.file ? req.file.filename : null;

    try {
      const user = await prisma.user.update({
        where: {
          id: parseInt(id),
        },
        data: {
          name,
          email,
          password,
          picture, // Update filename if a new file is uploaded
        },
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.delete({
    where: {
      id: parseInt(id),
    },
  });
  res.json(user);
};
