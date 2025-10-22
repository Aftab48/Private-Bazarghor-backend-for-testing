const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;
const User = require("../../models/user");
const { JWT } = require("../../../config/constants/authConstant");

exports.generateToken = async (user, deviceDetail = null) => {
  const payload = {
    id: user._id,
    email: user.email,
    roles: user.roles,
    mobNo: user.mobNo,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: JWT.EXPIRES_IN });
  const refreshToken = jwt.sign(payload, SECRET_KEY, {
    expiresIn: JWT.REFRESH_EXPIRES_IN,
  });

  const validateTill = new Date();
  validateTill.setDate(validateTill.getDate() + 1);

  const tokenObject = {
    token: token,
    validateTill: validateTill,
    refreshToken: refreshToken,
    deviceDetail: deviceDetail || "Unknown Device",
  };

  await User.findByIdAndUpdate(
    user._id,
    { $push: { tokens: tokenObject } },
    { new: true }
  );

  return {
    token,
    refreshToken,
    validateTill,
  };
};

exports.verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findOne({
      _id: decoded.id,
      "tokens.token": token,
      roles: decoded.roles,
      email: decoded.email,
      mobNo: decoded.mobNo,
    }).lean();

    if (!user) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
};

exports.cleanExpiredTokens = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $pull: {
      tokens: {
        validateTill: { $lt: new Date() },
      },
    },
  });
};

exports.removeToken = async (userId, token) => {
  await User.findByIdAndUpdate(userId, {
    $pull: {
      tokens: { token: token },
    },
  });
};

exports.generateRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, SECRET_KEY);

    const user = await User.findOne({
      _id: decoded.id,
      "tokens.refreshToken": refreshToken,
    }).lean();

    if (!user) {
      return null;
    }

    return await this.generateToken(user, "Refreshed Device");
  } catch (error) {
    return null;
  }
};
