const db = require("../config/db");

/* GET ALL SERVICES */
const getServices = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM services ORDER BY id DESC");

    const services = rows.map((s) => ({
      ...s,
      supportedBrands: s.supportedBrands ? JSON.parse(s.supportedBrands) : [],
      sparePartsIncluded: s.sparePartsIncluded
        ? JSON.parse(s.sparePartsIncluded)
        : [],
    }));

    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

/* GET SINGLE SERVICE */
const getService = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query("SELECT * FROM services WHERE id=?", [id]);

    if (!rows.length) {
      return res.status(404).json({ message: "Service not found" });
    }

    const s = rows[0];

    res.json({
      ...s,
      supportedBrands: s.supportedBrands ? JSON.parse(s.supportedBrands) : [],
      sparePartsIncluded: s.sparePartsIncluded
        ? JSON.parse(s.sparePartsIncluded)
        : [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch service" });
  }
};

/* CREATE SERVICE */
const addService = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      bigDescription,
      icon,
      image,
      supportedBrands,
      sparePartsIncluded,
      status,
    } = req.body;

    await db.query(
      `INSERT INTO services 
      (name, price, description, bigDescription, icon, image, supportedBrands, sparePartsIncluded, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        price,
        description,
        bigDescription,
        icon,
        image,
        JSON.stringify(supportedBrands),
        JSON.stringify(sparePartsIncluded),
        status,
      ]
    );

    res.json({ message: "Service added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create service" });
  }
};

/* UPDATE SERVICE */
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      description,
      bigDescription,
      icon,
      image,
      supportedBrands,
      sparePartsIncluded,
      status,
    } = req.body;

    await db.query(
      `UPDATE services 
       SET name=?, price=?, description=?, bigDescription=?, icon=?, image=?, supportedBrands=?, sparePartsIncluded=?, status=? 
       WHERE id=?`,
      [
        name,
        price,
        description,
        bigDescription,
        icon,
        image,
        JSON.stringify(supportedBrands),
        JSON.stringify(sparePartsIncluded),
        status,
        id,
      ]
    );

    res.json({ message: "Service updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update service" });
  }
};

/* DELETE SERVICE */
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM services WHERE id=?", [id]);

    res.json({ message: "Service deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete service" });
  }
};

module.exports = {
  getServices,
  getService,
  addService,
  updateService,
  deleteService,
};