const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var idValidator = require("mongoose-id-validator");
const myCustomLabels = {
  totalDocs: "itemCount",
  docs: "data",
  limit: "perPage",
  page: "currentPage",
  nextPage: "next",
  prevPage: "prev",
  totalPages: "pageCount",
  pagingCounter: "slNo",
  meta: "paginator",
};
mongoosePaginate.paginate.options = {
  customLabels: myCustomLabels,
};
const Schema = mongoose.Schema;
const schema = new Schema(
  {
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
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);
schema.pre("save", async function (next) {
  this.isActive = true;
  next();
});

schema.pre("findOne", function (next) {
  this.getQuery().deletedAt = { $exists: false };
  next();
});
schema.pre("find", function (next) {
  this.getQuery().deletedAt = { $exists: false };
  next();
});
schema.method("toJSON", function () {
  const { __v, ...object } = this.toObject();
  return object;
});
schema.plugin(mongoosePaginate);
schema.plugin(idValidator);

// const file = mongoose.model("file", schema, "file");

const file = mongoose.model("File", schema, "file");
module.exports = file;
