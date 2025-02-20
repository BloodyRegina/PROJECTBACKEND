const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require('multer');
const bcrypt = require('bcrypt'); 
const authService = require('../services/auth.service');
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'userpictures/'); // Store files in the 'userpictures' directory
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
    id: user.user_id, // ✅ ใช้ user_id แทน _id
    pictureUrl: user.picture ? `${req.protocol}://${req.get('host')}/userpictures/${user.picture}` : null
  }));
  res.json(usersWithUrls);
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { user_id: id },
  });

  if (user) {
    user.pictureUrl = user.picture
      ? `${req.protocol}://${req.get('host')}/userpictures/${user.picture}`
      : null;
  }
  
  res.json(user || { error: "User not found" });
};


exports.create = async (req, res) => {
  upload.single('picture')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { username, email, password } = req.body;
    const picture = req.file ? req.file.filename : null;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword, 
          picture,
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
    const { username, email, password } = req.body;
    const picture = req.file ? req.file.filename : null;

    try {
      const user = await prisma.user.update({
        where: { user_id: id },
        data: { username, email, password, picture },
      });
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.delete({
      where: { user_id: id },
    });    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // สร้าง JWT 
    const token = authService.generateToken({ userId: user.id });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
