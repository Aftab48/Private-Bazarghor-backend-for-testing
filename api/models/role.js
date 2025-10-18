const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
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
const schema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    canDel: {
      type: Boolean,
      default: true,
      required: true,
      alias: "canDelete",
    },
    isUnq: {
      type: Boolean,
      default: false,
      alias: "isUnique",
    },
    deletedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);
schema.plugin(mongoosePaginate);

schema.pre(["find", "findOne"], async function (next) {
  this.getQuery().deletedAt = { $exists: false };
  next();
});
const Role = mongoose.model("Role", schema, "role");
module.exports = { Role };
