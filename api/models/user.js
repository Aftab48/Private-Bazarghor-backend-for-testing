const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const { ACTIONS, JOB_TYPE } = require("../../config/constants/common");
const bcrypt = require("bcrypt");
const mongoosePaginate = require("mongoose-paginate-v2");
var idValidator = require("mongoose-id-validator");
const _ = require("lodash");
const { fileSchema } = require("../helpers/utils/commonSchema");

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

const schema = new Schema(
  {
    firstName: { type: String }, // First name of the user.
    lastName: { type: String }, // Last name of the user.
    mobNo: { type: String }, // Mobile No of User
    email: { type: String, index: true }, // Name of User
    isActive: { type: Boolean, default: true, index: true }, //isActive
    mobVerify: {
      code: String,
      expireTime: Date,
    },
    tempRegister: {
      type: Boolean,
      default: false,
    },
    mobVerifiedAt: {
      type: Date,
      default: null,
    },
    resetPassword: {
      code: String,
      expireTime: Date,
    },

    customFields: { type: Object },
    mobVerifiedAt: { type: Date }, // Mobile no verified date (ISO format)
    passwords: [
      {
        pass: { type: String }, //bcrypt password
        salt: { type: String }, //password salt
        createdAt: { type: Date }, //password created date
        isActive: { type: Boolean, default: false }, // this password is currently active or not
        reset: {
          token: { type: String }, //reset password token
          email: { type: String }, //email
          salt: { type: String }, //password salt
          when: { type: Date }, // when reset password was created (ISO)
        },
      },
    ],
    roles: [
      {
        roleId: {
          type: Schema.Types.ObjectId,
        },
        code: {
          type: String,
        },
      },
    ],
    gender: {
      enum: ["male", "female", "other"],
      type: String,
    },

    tz: { type: String, default: "Asia/Kolkata" }, //user Timezone
    utcOffset: { type: String }, //user timezone offset
    dob: { type: Date },
    cityNm: { type: String }, //user city Name
    shopaddress: { type: String }, //user shop address
    shopname: { type: String }, //user shop name
    pincode: { type: String }, //user pincode
    vehicleNo: { type: String }, //user vehicle No
    driverLicenseNo: { type: String }, //user driver license No
    profileCompleted: { type: Number, min: 0, max: 100, default: 0 }, // how much user's profile is completed.
    tokens: [
      {
        token: { type: String },
        validateTill: { type: Date },
        refreshToken: { type: String },
        deviceDetail: { type: String },
      },
    ],

    offNotification: { type: Boolean, default: false },
    canChangePass: { type: Boolean, default: true }, // can change password for employer and staff added by admin
    lastLogin: { type: Date },
    deletedAt: { type: Date, index: true, index: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      index: true,
      // ref: "user"
    },
    updatedBy: [
      {
        type: Schema.Types.ObjectId,
        // ref: "user"
      },
    ],
    deletedBy: {
      type: Schema.Types.ObjectId,
      // ref: "user"
    },

    profileId: {
      type: Schema.Types.ObjectId,
      // ref: "file"
    },

    status: { type: Number },
    profilePicture: fileSchema,

    vehicleDetails: {
      vehicleNo: { type: String },
      driverLicenseNo: { type: String },
      vehiclePictures: { type: [fileSchema], default: [] },
    },
    storeDetails: {
      storeName: { type: String },
      storeAddress: { type: String },
      storePictures: { type: [fileSchema], default: [] },
    },
    customerAddress: [
      {
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        landmark: { type: String },
        addressType: {
          type: String,
          enum: ["home", "office", "other"],
          default: "home",
        },
        isDefault: { type: Boolean, default: false },
      },
    ],
    termsAndCondition: { type: Boolean, default: false },
    approvalStatus: { type: Number },
    consentAgree: { type: Boolean, default: false },
    isPrimaryAdmin: { type: Boolean, default: false },
    tempRegistration: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

schema.pre("save", async function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.firstName || this.lastName) {
    this.name = `${this?.firstName ? `${this?.firstName} ` : ""}${
      this?.lastName || ""
    }`;
  }
  if (this.passwords && this.passwords.length > 0) {
    const pass = await bcrypt.hash(this.passwords[0].pass, 8);
    const obj = {
      pass: pass,
      salt: pass.slice(7, 29),
      isActive: true,
      createdAt: new Date(),
    };
    this.passwords = obj;
  }

  next();
});

schema.pre(["find", "findOne"], async function (next) {
  this.getQuery().deletedAt = { $exists: false };
  this.getQuery().deletedBy = { $exists: false };
  next();
});

schema.pre("findOneAndUpdate", async function (next) {
  if (this._update?.firstName || this._update?.lastName) {
    this._update.name = `${
      this?._update?.firstName ? `${this?._update?.firstName} ` : ""
    }${this?._update?.lastName || ""}`;
  }

  next();
});

schema.plugin(mongoosePaginate);
schema.plugin(idValidator);

schema.methods.isPasswordMatch = async function (password) {
  const user = this;
  if (user?.passwords?.length !== 0) {
    let matchPassword = _.find(user?.passwords, { isActive: true });
    return await bcrypt.compare(password, matchPassword?.pass);
  }
  return false;
};

// const user = mongoose.model("user", schema, "user");
const user = mongoose.model("User", schema, "user");
module.exports = user;
