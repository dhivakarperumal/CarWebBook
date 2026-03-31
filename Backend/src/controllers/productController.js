const db = require('../config/db.js');

/* ➕ ADD PRODUCT */
exports.addProduct = async (req, res) => {
  try {
    const {
      id, name, slug, brand, description,
      mrp, offer, offerPrice, tags, warranty, returnPolicy,
      isFeatured, isActive, rating, variants, images, thumbnail, totalStock
    } = req.body;

    const sql = `
      INSERT INTO products 
      (id, name, slug, brand, description, mrp, offer, offerPrice, tags, warranty, returnPolicy,
       isFeatured, isActive, rating, variants, images, thumbnail, totalStock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      id, name, slug, brand, description,
      mrp, offer, offerPrice,
      JSON.stringify(tags),
      JSON.stringify(warranty),
      JSON.stringify(returnPolicy),
      isFeatured ? 1 : 0,
      isActive ? 1 : 0,
      rating,
      JSON.stringify(variants),
      JSON.stringify(images),
      thumbnail,
      totalStock
    ]);
    res.status(201).json({ message: 'Product added', docId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
};

/* ✏️ UPDATE PRODUCT */
exports.updateProduct = async (req, res) => {
  const { docId } = req.params;
  try {
    const {
      id, name, slug, brand, description,
      mrp, offer, offerPrice, tags, warranty, returnPolicy,
      isFeatured, isActive, rating, variants, images, thumbnail, totalStock
    } = req.body;

    const sql = `
      UPDATE products SET
      id=?, name=?, slug=?, brand=?, description=?,
      mrp=?, offer=?, offerPrice=?, tags=?, warranty=?, returnPolicy=?,
      isFeatured=?, isActive=?, rating=?, variants=?, images=?, thumbnail=?, totalStock=?
      WHERE docId=?
    `;
    await db.query(sql, [
      id, name, slug, brand, description,
      mrp, offer, offerPrice,
      JSON.stringify(tags),
      JSON.stringify(warranty),
      JSON.stringify(returnPolicy),
      isFeatured ? 1 : 0,
      isActive ? 1 : 0,
      rating,
      JSON.stringify(variants),
      JSON.stringify(images),
      thumbnail,
      totalStock,
      docId
    ]);
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
};

/* 📄 GET ALL PRODUCTS */
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products');
    // Parse JSON fields
    const parsed = rows.map(p => ({
      ...p,
      tags: tryParse(p.tags, []),
      warranty: tryParse(p.warranty, {}),
      returnPolicy: tryParse(p.returnPolicy, {}),
      variants: tryParse(p.variants, []),
      images: tryParse(p.images, []),
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};

/* 🔍 GET ONE PRODUCT */
exports.getProductById = async (req, res) => {
  const { docId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE docId=?', [docId]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    const p = rows[0];
    res.json({
      ...p,
      tags: tryParse(p.tags, []),
      warranty: tryParse(p.warranty, {}),
      returnPolicy: tryParse(p.returnPolicy, {}),
      variants: tryParse(p.variants, []),
      images: tryParse(p.images, []),
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
};

/* 🔍 GET PRODUCT BY SLUG */
exports.getProductBySlug = async (req, res) => {
  const { slug } = req.params;
  const normalized = slug ? slug.toLowerCase().trim().replace(/-+$/, '') : '';

  try {
    const [rows] = await db.query(
      'SELECT * FROM products WHERE LOWER(slug)=? OR LOWER(slug)=? LIMIT 1',
      [slug?.toLowerCase(), normalized]
    );

    if (!rows.length) return res.status(404).json({ message: 'Product not found' });

    const p = rows[0];
    res.json({
      ...p,
      tags: tryParse(p.tags, []),
      warranty: tryParse(p.warranty, {}),
      returnPolicy: tryParse(p.returnPolicy, {}),
      variants: tryParse(p.variants, []),
      images: tryParse(p.images, []),
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
};

/* ❌ DELETE PRODUCT */
exports.deleteProduct = async (req, res) => {
  const { docId } = req.params;
  try {
    await db.query('DELETE FROM products WHERE docId=?', [docId]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
};

/* 🔄 TOGGLE STATUS */
exports.toggleStatus = async (req, res) => {
  const { docId } = req.params;
  const { isActive } = req.body;
  try {
    await db.query('UPDATE products SET isActive=? WHERE docId=?', [isActive ? 1 : 0, docId]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating status', error: err.message });
  }
};

/* 📦 UPDATE STOCK (variants + totalStock) */
exports.updateStock = async (req, res) => {
  const { docId } = req.params;
  const { variants, totalStock } = req.body;
  try {
    await db.query(
      'UPDATE products SET variants=?, totalStock=? WHERE docId=?',
      [JSON.stringify(variants), totalStock, docId]
    );
    res.json({ message: 'Stock updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating stock', error: err.message });
  }
};

/* 🧾 SAVE BILL / ORDER */
exports.saveBill = async (req, res) => {
  try {
    const { orderId, customer, orderType, shipping, items, subtotal, total, paymentMethod, paymentStatus, status } = req.body;
    const sql = `
      INSERT INTO product_bills 
      (billId, customerName, customerPhone, orderType, paymentMethod, paymentStatus, status, items, totalItems, subTotal, grandTotal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const customerName = customer?.name || '';
    const customerPhone = customer?.phone || '';
    await db.query(sql, [
      orderId, customerName, customerPhone, orderType, paymentMethod, paymentStatus, status,
      JSON.stringify(items), items.length, subtotal, total
    ]);
    res.status(201).json({ message: 'Bill saved', orderId });
  } catch (err) {
    res.status(500).json({ message: 'Error saving bill', error: err.message });
  }
};

/* 📋 GET ALL BILLS */
exports.getAllBills = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM product_bills ORDER BY createdAt DESC');
    const parsed = rows.map(b => ({ ...b, items: tryParse(b.items, []) }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bills', error: err.message });
  }
};

/* HELPER */
function tryParse(val, fallback) {
  try { return typeof val === 'string' ? JSON.parse(val) : val ?? fallback; }
  catch { return fallback; }
}
