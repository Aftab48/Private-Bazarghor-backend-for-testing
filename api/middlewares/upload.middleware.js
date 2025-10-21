const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// ensure upload folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// for now: local upload, later you can switch to s3/cloudinary easily
const upload = multer({ storage });

// ✅ Middleware to handle vendor files (profile and shop pictures)
const uploadVendorFiles = upload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "storePicture", maxCount: 1 },
]);

// ✅ Middleware to handle delivery partner files (vehicle pictures only)
const uploadDeliveryPartnerFiles = upload.fields([
  { name: "vehiclePictures", maxCount: 2 },
]);

module.exports = { uploadVendorFiles, uploadDeliveryPartnerFiles };
