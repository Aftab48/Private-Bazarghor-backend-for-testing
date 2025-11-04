// Product Categories
const PRODUCT_CATEGORIES = {
  ELECTRONICS: "Electronics",
  FASHION: "Fashion",
  HOME_GARDEN: "Home & Garden",
  SPORTS: "Sports",
  BOOKS: "Books",
  GROCERY: "Grocery",
  KITCHEN_DINING: "Kitchen & Dining",
  BEAUTY_PERSONAL_CARE: "Beauty & Personal Care",
  TOYS_GAMES: "Toys & Games",
  HEALTH_WELLNESS: "Health & Wellness",
  AUTOMOTIVE: "Automotive",
  PET_SUPPLIES: "Pet Supplies",
};

// Product Subcategories
const PRODUCT_SUBCATEGORIES = {
  // Electronics
  SMARTPHONES: "Smartphones",
  LAPTOPS: "Laptops",
  TABLETS: "Tablets",
  ACCESSORIES: "Accessories",
  AUDIO: "Audio",
  CAMERAS: "Cameras",
  TV: "TV & Home Entertainment",
  
  // Fashion
  MEN: "Men",
  WOMEN: "Women",
  KIDS: "Kids",
  FOOTWEAR: "Footwear",
  WATCHES: "Watches",
  JEWELRY: "Jewelry",
  BAGS: "Bags & Luggage",
  
  // Home & Garden
  FURNITURE: "Furniture",
  DECOR: "Home Decor",
  GARDENING: "Gardening",
  LIGHTING: "Lighting",
  BATH: "Bath",
  KITCHEN: "Kitchen",
  
  // Sports
  FITNESS: "Fitness",
  OUTDOOR: "Outdoor Sports",
  INDOOR: "Indoor Sports",
  SPORTSWEAR: "Sportswear",
  
  // Books
  FICTION: "Fiction",
  NON_FICTION: "Non-Fiction",
  EDUCATIONAL: "Educational",
  COMICS: "Comics",
  
  // Grocery
  FOOD: "Food Items",
  BEVERAGES: "Beverages",
  SNACKS: "Snacks",
  SPICES: "Spices & Condiments",
  
  // Kitchen & Dining
  COOKWARE: "Cookware",
  DINING: "Dining & Serving",
  STORAGE: "Storage",
  
  // Beauty & Personal Care
  SKINCARE: "Skincare",
  HAIRCARE: "Haircare",
  MAKEUP: "Makeup",
  FRAGRANCE: "Fragrance",
  
  // Toys & Games
  ACTION_FIGURES: "Action Figures",
  PUZZLES: "Puzzles",
  BOARD_GAMES: "Board Games",
  EDUCATIONAL_TOYS: "Educational Toys",
  
  // Health & Wellness
  SUPPLEMENTS: "Supplements",
  FITNESS_EQUIPMENT: "Fitness Equipment",
  PERSONAL_CARE: "Personal Care Appliances",
  
  // Automotive
  CAR_ACCESSORIES: "Car Accessories",
  BIKE_ACCESSORIES: "Bike Accessories",
  MAINTENANCE: "Maintenance",
  
  // Pet Supplies
  DOG: "Dog Supplies",
  CAT: "Cat Supplies",
  BIRD: "Bird Supplies",
  FISH: "Fish Supplies",
};

// Product Status
const PRODUCT_STATUS = {
  IN_STOCK: "in_stock",
  OUT_OF_STOCK: "out_of_stock",
  LOW_STOCK: "low_stock",
};

// All available categories as array
const CATEGORIES_LIST = Object.values(PRODUCT_CATEGORIES);

// All available subcategories as array
const SUBCATEGORIES_LIST = Object.values(PRODUCT_SUBCATEGORIES);

module.exports = {
  PRODUCT_CATEGORIES,
  PRODUCT_SUBCATEGORIES,
  PRODUCT_STATUS,
  CATEGORIES_LIST,
  SUBCATEGORIES_LIST,
};

