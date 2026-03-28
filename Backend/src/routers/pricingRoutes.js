const express = require("express");

const {
  getAllPackages,
  getSinglePackage,
  addPackage,
  editPackage,
  removePackage,
} = require("../controllers/pricingController");

const router = express.Router();

router.get("/", getAllPackages);
router.get("/:id", getSinglePackage);
router.post("/", addPackage);
router.put("/:id", editPackage);
router.delete("/:id", removePackage);

module.exports = router;