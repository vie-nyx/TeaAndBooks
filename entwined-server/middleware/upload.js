const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const fs = require("fs");

const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== "demo";

/*
=================================
POST IMAGE UPLOAD (for posts)
=================================
*/

let postStorage;

if (useCloudinary) {
  postStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "entwined/posts",
      allowed_formats: ["jpg", "jpeg", "png", "webp"]
    }
  });
} else {
  postStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "../uploads/posts");
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
    }
  });
}

const uploadImage = multer({
  storage: postStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/*
=================================
CHAT FILE UPLOAD (images + pdf + epub)
=================================
*/

let chatStorage;

if (useCloudinary) {
  chatStorage = new CloudinaryStorage({
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
} else {
  chatStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(ext);
      const dir = path.join(__dirname, "../uploads", isImage ? "images" : "files");
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
    }
  });
}

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