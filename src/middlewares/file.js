const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Le decimos a multer que guarde los ficheros en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "videojuegos-users",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
  },
});

// Middleware de subida: lo usaremos en las rutas con upload.single("image")
const upload = multer({ storage });

module.exports = { upload };
