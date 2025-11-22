const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const UPLOAD_DIR = path.join(__dirname, "../../uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const USE_S3 = (process.env.UPLOAD_MODE || "").toLowerCase() === "s3";
const S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_REGION = process.env.S3_REGION;
const S3_BASE_PREFIX = process.env.S3_BASE_PREFIX || ""; // optional root prefix

let storage;
if (USE_S3) {
  storage = multer.memoryStorage();
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
}

const upload = multer({ storage });

let s3;
if (USE_S3) {
  s3 = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

function resolveEntityType(req) {
  const base = req.baseUrl || "";
  if (base.includes("/vendors") || base.includes("/products")) return "vendor";
  if (base.includes("/delivery-partner")) return "delivery-partner";
  if (base.includes("/customers")) return "customer";
  return "misc";
}

function buildS3Key(req, fieldName, originalName) {
  const entity = resolveEntityType(req);
  const userId = req.user || `temp-${Date.now()}`;
  const ts = Date.now();
  if (entity === "vendor") {
    if (fieldName === "productImages")
      return `${entity}/${userId}/products/${ts}-${originalName}`;
    if (fieldName === "storePictures")
      return `${entity}/${userId}/store/${ts}-${originalName}`;
    if (fieldName === "profilePicture")
      return `${entity}/${userId}/profile/${ts}-${originalName}`;
  }
  if (entity === "delivery-partner") {
    if (["vehicleFront", "vehicleBack"].includes(fieldName))
      return `${entity}/${userId}/vehicle/${ts}-${originalName}`;
    if (fieldName === "profilePicture")
      return `${entity}/${userId}/profile/${ts}-${originalName}`;
  }
  if (entity === "customer") {
    if (fieldName === "profilePicture")
      return `${entity}/${userId}/profile/${ts}-${originalName}`;
  }
  return `${entity}/${userId}/${fieldName}/${ts}-${originalName}`;
}

async function uploadBuffersToS3(req, res, next) {
  if (!USE_S3) return next();
  if (!req.files || !S3_BUCKET) return next();

  try {
    const fileGroups = Object.values(req.files).flat();
    for (const f of fileGroups) {
      const key = [S3_BASE_PREFIX, buildS3Key(req, f.fieldname, f.originalname)]
        .filter(Boolean)
        .join("/")
        .replace(/\/+/g, "/");
      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: f.buffer,
          ContentType: f.mimetype,
        })
      );
      f.s3Key = key;
      f.s3Bucket = S3_BUCKET;
      f.s3Region = S3_REGION;
    }
    next();
  } catch (err) {
    logger.error("S3 upload error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to upload files to S3" });
  }
}

// Field definitions (unchanged)
const uploadVendorFiles = [
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "storePictures", maxCount: 1 },
  ]),
  uploadBuffersToS3,
];

const uploadDeliveryPartnerFiles = [
  upload.fields([
    { name: "vehicleFront", maxCount: 1 },
    { name: "vehicleBack", maxCount: 1 },
    { name: "profilePicture", maxCount: 1 },
  ]),
  uploadBuffersToS3,
];

const uploadCustomerFiles = [
  upload.fields([{ name: "profilePicture", maxCount: 1 }]),
  uploadBuffersToS3,
];

const uploadAdminProfile = [
  upload.fields([{ name: "profilePicture", maxCount: 1 }]),
  uploadBuffersToS3,
];

const uploadProductImages = [
  upload.fields([{ name: "productImages", maxCount: 4 }]),
  uploadBuffersToS3,
];

module.exports = {
  uploadVendorFiles,
  uploadDeliveryPartnerFiles,
  uploadCustomerFiles,
  uploadAdminProfile,
  uploadProductImages,
  upload,
};
