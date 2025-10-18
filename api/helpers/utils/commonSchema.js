const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const fileSchema = {
  nm: { type: String }, // Name
  oriNm: { type: String }, // Original name
  type: { type: String },
  exten: { type: String }, // Extension
  uri: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  sts: { type: Number }, // Status (Processing = 0, Failed = 1, Uploaded = 2)
  dimensions: { height: Number, width: Number },
  preview: { type: String },
  createdBy: {
    type: Schema.Types.ObjectId,
    // ref: "user"
  },
  deletedAt: { type: Date },
  deletedBy: {
    type: Schema.Types.ObjectId,
    // ref: "user"
  },
};

module.exports = {
  fileSchema,
};
