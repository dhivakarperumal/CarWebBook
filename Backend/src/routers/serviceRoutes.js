const express = require("express");
const {
  addService,
  getServices,
  getServiceById,
  updateService,
  deleteService
} = require("../controllers/serviceController.js");

const router = express.Router();

router.post("/", addService);
router.get("/", getServices);
router.get("/:id", getServiceById);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

module.exports = router;