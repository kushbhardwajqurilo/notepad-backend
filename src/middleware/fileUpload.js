const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "./public/files",
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const filename = "file" + uniqueSuffix + fileExtension;
    req.file_path = filename;
    cb(null, filename);
  },
});

// const fileFilter = (req, file, cb) => {
// //   const allowedTypes = /jpeg|jpg|png|pdf|/;
//   const extname = allowedTypes.test(
//     path.extname(file.originalname).toLowerCase(),
//   );
//   const mimetype = allowedTypes.test(file.mimetype);

//   // if (extname && mimetype) {
//   //     return cb(null, true);
//   // } else {
//   //     cb(new Error('Only images and PDFs are allowed!'));
//   // }
// };

const upload = multer({
  storage: storage,
  //   fileFilter: fileFilter,
});

module.exports = upload;
