const cloudinary = require("../config/cloudinary");

// Borra una imagen de Cloudinary a partir de su public_id
const deleteImgCloudinary = async (publicId) => {
  // Si el usuario no tiene imagen guardada, no hay nada que borrar
  if (!publicId) {
    return;
  }
  await cloudinary.uploader.destroy(publicId);
};

module.exports = { deleteImgCloudinary };
