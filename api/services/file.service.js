const fs = require("fs");
const path = require("path");

const UPLOAD_MODE = process.env.UPLOAD_MODE || "local";
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
const S3_REGION = process.env.S3_REGION;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const FileService = {
  generateFileObject(file) {
    if (!file) return null;
    if (file.s3Key && file.s3Bucket) {
      return {
        nm: path.basename(file.s3Key),
        oriNm: file.originalname,
        uri: `https://${file.s3Bucket}.s3.${
          file.s3Region || S3_REGION
        }.amazonaws.com/${file.s3Key}`,
        mimeType: file.mimetype,
        size: file.size,
        sts: 2,
        storage: "s3",
        bucket: file.s3Bucket,
        key: file.s3Key,
      };
    }
    return {
      nm: file.filename,
      oriNm: file.originalname,
      uri:
        UPLOAD_MODE === "local"
          ? `/uploads/${file.filename}`
          : file.path || file.url,
      mimeType: file.mimetype,
      size: file.size,
      sts: 2, // uploaded
    };
  },

  deleteUploadedFiles(files) {
    try {
      if (!files) return;
      Object.keys(files).forEach((key) => {
        files[key].forEach((f) => {
          const filePath = path.join(UPLOAD_DIR, f.filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      });
    } catch (err) {
      logger.error("Error deleting uploaded files:", err);
    }
  },

  deleteSingleFile(fileName) {
    try {
      if (!fileName) return;
      const filePath = path.join(UPLOAD_DIR, fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      logger.error("Error deleting single file:", err);
    }
  },
};

module.exports = FileService;
