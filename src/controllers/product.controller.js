const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/'); // Store files in the 'images' directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop()); 
  }
});

const upload = multer({ storage: storage });

exports.get = async (req, res) => {
  const products = await prisma.product.findMany({
    include: {
      Category: true,
    },
  });
  // Add image URL to each product
  const productsWithUrls = products.map(product => ({
    ...product,
    pictureUrl: product.picture ? `${req.protocol}://${req.get('host')}/images/${product.picture}` : null
  }));
  res.json(productsWithUrls);
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: {
      id: parseInt(id),
    },
    include: {
      Category: true,
    },
  });
  // Add image URL to the product
  if (product) {
    product.pictureUrl = product.picture ? `${req.protocol}://${req.get('host')}/images/${product.picture}` : null;
  }
  res.json(product);
};


exports.create = async (req, res) => {
  // Use upload.single middleware to handle file upload
  upload.single('picture')(req, res, async (err) => { 
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { category_id, name, price, description, unit_in_stock } = req.body;
    const picture = req.file ? req.file.filename : null; // Get filename if uploaded

    try {
      const product = await prisma.product.create({
        data: {
          category_id: parseInt(category_id),
          name,
          price: parseFloat(price),
          description,
          unit_in_stock: parseInt(unit_in_stock),
          picture, // Store filename in the database
        },
      });
      res.json(product);
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
    const { category_id, name, price, description, unit_in_stock } = req.body;
    const picture = req.file ? req.file.filename : null;

    try {
      const product = await prisma.product.update({
        where: {
          id: parseInt(id),
        },
        data: {
          category_id: parseInt(category_id),
          name,
          price: parseFloat(price),
          description,
          unit_in_stock: parseInt(unit_in_stock),
          picture, // Update filename if a new file is uploaded
        },
      });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};


exports.delete = async (req, res) => {
  const { id } = req.params;
  const product = await prisma.product.delete({
    where: {
      id: parseInt(id),
    },
  });
  res.json(product);
};
