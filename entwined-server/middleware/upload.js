const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/*
=================================
POST IMAGE UPLOAD (for posts)
=================================
*/

const postStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "entwined/posts",
    allowed_formats: ["jpg", "jpeg", "png", "webp"]
  }
});

const uploadImage = multer({
  storage: postStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/*
=================================
CHAT FILE UPLOAD (images + pdf + epub)
=================================
*/

const chatStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split(".").pop().toLowerCase();

    let folder = "entwined/chat/files";
    let resource_type = "raw";

    // Images
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
      folder = "entwined/chat/images";
      resource_type = "image";
    }

    // PDFs & EPUBs
    if (["pdf", "epub"].includes(ext)) {
      folder = "entwined/chat/files";
      resource_type = "raw";
    }

    return {
      folder,
      resource_type,
      public_id: Date.now() + "-" + file.originalname.replace(/\s+/g, "-")
    };
  }
});

const uploadFile = multer({
  storage: chatStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB for chat files
});

/*
=================================
EXPORTS
=================================
*/

module.exports = {
  uploadImage,
  uploadFile
};