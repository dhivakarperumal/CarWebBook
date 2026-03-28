const db = require("../config/db.js");

/* ➕ ADD SERVICE */
exports.addService = async (req, res) => {
  const {
    name,
    price,
    description,
    bigDescription,
    icon,
    image,
    supportedBrands,
    sparePartsIncluded,
    status
  } = req.body;

  const code = "SE" + Math.floor(100 + Math.random() * 900);

  const sql = `
    INSERT INTO services 
    (code, name, price, description, bigDescription, icon, image, supportedBrands, sparePartsIncluded, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  try {
    const [result] = await db.query(sql, [
      code,
      name,
      price,
      description,
      bigDescription,
      icon,
      image,
      JSON.stringify(supportedBrands),
      JSON.stringify(sparePartsIncluded),
      status
    ]);
    res.json({ message: "Service Added ✅", id: result.insertId });
  } catch (err) {
    res.status(500).json(err);
  }
};

/* 📄 GET ALL */
exports.getServices = async (req, res) => {
  try {
    const [data] = await db.query("SELECT * FROM services");
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
};

/* 🔍 GET ONE */
exports.getServiceById = async (req, res) => {
  const id = req.params.id;

  try {
    const [data] = await db.query("SELECT * FROM services WHERE id=?", [id]);
    res.json(data[0]);
  } catch (err) {
    res.status(500).json(err);
  }
};

/* 🔄 UPDATE */
exports.updateService = async (req, res) => {
  const id = req.params.id;
  const {
    name,
    price,
    description,
    bigDescription,
    icon,
    image,
    supportedBrands,
    sparePartsIncluded,
    status
  } = req.body;

  const sql = `
    UPDATE services SET 
    name=?, price=?, description=?, bigDescription=?, icon=?, image=?, 
    supportedBrands=?, sparePartsIncluded=?, status=?, updatedAt=NOW() 
    WHERE id=?
  `;

  try {
    await db.query(sql, [
      name,
      price,
      description,
      bigDescription,
      icon,
      image,
      JSON.stringify(supportedBrands),
      JSON.stringify(sparePartsIncluded),
      status,
      id
    ]);
    res.json({ message: "Service Updated ✅" });
  } catch (err) {
    res.status(500).json(err);
  }
};

/* ❌ DELETE */
exports.deleteService = async (req, res) => {
  const id = req.params.id;

  try {
    await db.query("DELETE FROM services WHERE id=?", [id]);
    res.json({ message: "Service Deleted 🗑️" });
  } catch (err) {
    res.status(500).json(err);
  }
};