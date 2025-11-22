const Store = require("../models/store");
const mongoose = require("mongoose");
const logger = require("../helpers/utils/logger");
const mapplsService = require("./map-pls.service");

const toggleVendorStoreOpenClose = async (req) => {
  const paramVendorId =
    req.params.vendorId || req.query.vendorId || req.body.vendorId;

  let loggedInVendorId = req.user;
  if (loggedInVendorId && typeof loggedInVendorId === "object") {
    loggedInVendorId = loggedInVendorId._id || loggedInVendorId.id || null;
  }

  const vendorId = paramVendorId || loggedInVendorId;
  const { id } = req.params;
  const { isOpen } = req.body;

  if (typeof isOpen !== "boolean") {
    return { success: false, error: "isOpen must be true/false" };
  }

  if (!vendorId) return { success: false, error: "vendorId is required" };
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    return { success: false, error: "Invalid vendorId" };
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, error: "Invalid store id" };
  }

  try {
    const store = await Store.findOneAndUpdate(
      { _id: id, vendorId, deletedAt: null },
      { isStoreOpen: isOpen },
      { new: true }
    ).select("storeName isStoreOpen");

    if (!store) return { success: false, notFound: true };

    return {
      success: true,
      message: `Store has been ${isOpen ? "opened" : "closed"} successfully`,
      data: store,
    };
  } catch (err) {
    logger.error("Vendor: Store open/close update error:", err);
    return { success: false, error: err.message };
  }
};

const getStoresByAdmin = async (req) => {
  const { page = 1, limit = 10, search, isApproved, category } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { storeName: { $regex: search, $options: "i" } },
      { storeAddress: { $regex: search, $options: "i" } },
      { storeCode: { $regex: search, $options: "i" } },
    ];
  }

  if (isApproved !== undefined) query.isApproved = isApproved === "true";
  if (category) query.category = category;

  try {
    const stores = await Store.paginate(query, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      select:
        "storeName storeAddress storeCode description category rating isStoreOpen isApproved location",
      populate: [
        {
          path: "vendorId",
          select: "firstName lastName email mobNo",
        },
      ],
      lean: true,
    });

    stores.docs = stores.docs?.map((store) => ({
      _id: store._id,
      storeCode: store.storeCode,
      storeName: store.storeName,
      storeAddress: store.storeAddress,
      description: store.description,
      category: store.category,
      rating: store.rating,

      isApproved: store.isApproved,
      isStoreOpen: store.isStoreOpen,
      location: store.location || { lat: null, lng: null },

      vendor: store.vendorId
        ? {
            id: store.vendorId._id,
            name: `${store.vendorId.firstName} ${store.vendorId.lastName}`,
            email: store.vendorId.email,
            mobNo: store.vendorId.mobNo,
          }
        : null,
    }));

    return { success: true, data: stores };
  } catch (err) {
    logger.error("Admin: Get stores error:", err);
    return { success: false, error: err.message };
  }
};

const getStoreByIdByAdmin = async (req) => {
  const { id } = req.params;
  logger.debug("Getting store by ID:", id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, error: "Invalid store ID" };
  }

  try {
    const store = await Store.findById(id)
      .select(
        "storeCode storeName storeAddress description category rating isApproved isStoreOpen vendorId deliveryAvailable deliveryRadius minOrderValue storePictures location"
      )
      .populate("vendorId", "firstName lastName email mobNo")
      .lean();

    if (!store) {
      return { success: false, notFound: true };
    }

    const formattedStore = {
      _id: store._id,
      storeCode: store.storeCode,
      storeName: store.storeName,
      storeAddress: store.storeAddress,
      description: store.description,
      category: store.category,
      rating: store.rating,
      isApproved: store.isApproved,
      isStoreOpen: store.isStoreOpen,

      deliveryAvailable: store.deliveryAvailable,
      deliveryRadius: store.deliveryRadius,
      minOrderValue: store.minOrderValue,

      storePictures: store.storePictures || [],
      location: store.location || { lat: null, lng: null },

      vendor: store.vendorId
        ? {
            id: store.vendorId._id,
            name: `${store.vendorId.firstName} ${store.vendorId.lastName}`,
            email: store.vendorId.email,
            mobNo: store.vendorId.mobNo,
          }
        : null,
    };

    return { success: true, data: formattedStore };
  } catch (err) {
    logger.error("Admin: Get store details error:", err);
    return { success: false, error: err.message };
  }
};

const updateStoreByAdmin = async (req) => {
  const { id } = req.params;

  // ✅ Ensure body exists
  if (!req.body || typeof req.body !== "object") {
    return { success: false, error: "Invalid request body" };
  }

  const allowedFields = [
    "storeName",
    "storeAddress",
    "description",
    "category",
    "deliveryAvailable",
    "deliveryRadius",
    "minOrderValue",
    "rating",
    "isStoreOpen",
    "isApproved",
  ];

  const updateData = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  if (req.body.location) {
    const lat = Number(req.body.location.lat);
    const lng = Number(req.body.location.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      updateData.location = { lat, lng };
    }
  }

  if (
    updateData.storeAddress &&
    (!updateData.location ||
      updateData.location.lat === undefined ||
      updateData.location.lng === undefined)
  ) {
    const resolvedLocation = await mapplsService
      .resolveCoordinatesFromAddress({
        address: updateData.storeAddress,
        city: req.body.city || req.body.cityNm,
        state: req.body.state,
        pincode: req.body.pincode,
      })
      .catch(() => null);

    if (resolvedLocation?.lat && resolvedLocation?.lng) {
      updateData.location = {
        lat: resolvedLocation.lat,
        lng: resolvedLocation.lng,
      };
    }
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: "No valid fields provided to update" };
  }

  try {
    const updatedStore = await Store.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select(Object.keys(updateData).join(" "));

    if (!updatedStore) return { success: false, notFound: true };

    return { success: true, data: updatedStore };
  } catch (err) {
    logger.error("Admin: Store update error:", err);
    return { success: false, error: err.message };
  }
};

const getOpenStoresForCustomer = async (req) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    minRating,
    deliveryAvailable,
  } = req.query;

  const query = {
    isApproved: true,
    isStoreOpen: true,
    deletedAt: null,
  };

  // Add search filters
  if (search) {
    query.$or = [
      { storeName: { $regex: search, $options: "i" } },
      { storeAddress: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  // Add category filter
  if (category) {
    query.category = category;
  }

  // Add rating filter
  if (minRating) {
    query.rating = { $gte: parseFloat(minRating) };
  }

  // Add delivery filter
  if (deliveryAvailable !== undefined) {
    query.deliveryAvailable = deliveryAvailable === "true";
  }

  try {
    const stores = await Store.paginate(query, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { rating: -1, createdAt: -1 }, // Sort by rating first, then by newest
      select:
        "storeName storeAddress category rating isStoreOpen deliveryAvailable deliveryRadius minOrderValue storePictures location",
      lean: true,
    });

    // Format the response
    stores.docs = stores.docs?.map((store) => ({
      _id: store._id,
      storeName: store.storeName,
      storeAddress: store.storeAddress,
      category: store.category,
      rating: store.rating,
      isStoreOpen: store.isStoreOpen,
      deliveryAvailable: store.deliveryAvailable,
      deliveryRadius: store.deliveryRadius,
      minOrderValue: store.minOrderValue,
      storePictures: store.storePictures || [],
      location: store.location || { lat: null, lng: null },
    }));

    return { success: true, data: stores };
  } catch (err) {
    logger.error("Customer: Get open stores error:", err);
    return { success: false, error: err.message };
  }
};

module.exports = {
  toggleVendorStoreOpenClose,
  getStoresByAdmin,
  getStoreByIdByAdmin,
  updateStoreByAdmin,
  getOpenStoresForCustomer,
};
