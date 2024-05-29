const multer = require('multer');
const path = require('path');

// Tentukan tempat penyimpanan sementara untuk file yang diupload
const storage = multer.memoryStorage();

const avatar = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
});

module.exports = avatar;
