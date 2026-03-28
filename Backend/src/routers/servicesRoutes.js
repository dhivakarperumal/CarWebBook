const express = require("express");

const {
  getServices,
  getService,
  addService,
  updateService,
  deleteService,
} = require("../controllers/servicesController");

const router = express.Router();

router.get("/", getServices);
router.get("/:id", getService);
router.post("/", addService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

module.exports = router;