const db = require('../config/db.js');

/* ➕ ADD TO CART */
exports.addToCart = async (req, res) => {
  const { userId, productId, sku, name, price, image, quantity } = req.body;

  try {
    // Check if item already in cart
    const [existing] = await db.query(
      'SELECT * FROM cart WHERE userId = ? AND productId = ? AND sku = ?',
      [userId, productId, sku]
    );

    if (existing.length > 0) {
      // Update quantity
      const newQty = existing[0].quantity + quantity;
      await db.query(
        'UPDATE cart SET quantity = ? WHERE id = ?',
        [newQty, existing[0].id]
      );
    } else {
      // Insert new item
      await db.query(
        'INSERT INTO cart (userId, productId, sku, name, price, image, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, productId, sku, name, price, image, quantity]
      );
    }

    res.json({ message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ message: 'Error adding to cart', error: err.message });
  }
};

/* 📋 GET CART ITEMS */
exports.getCart = async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM cart WHERE userId = ?', [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cart', error: err.message });
  }
};

/* ✏️ UPDATE CART ITEM */
exports.updateCartItem = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    await db.query('UPDATE cart SET quantity = ? WHERE id = ?', [quantity, id]);
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating cart', error: err.message });
  }
};

/* ❌ REMOVE CART ITEM */
exports.removeCartItem = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM cart WHERE id = ?', [id]);
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing item', error: err.message });
  }
};

/* 🗑️ CLEAR CART */
exports.clearCart = async (req, res) => {
  const { userId } = req.params;

  try {
    await db.query('DELETE FROM cart WHERE userId = ?', [userId]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Error clearing cart', error: err.message });
  }
};