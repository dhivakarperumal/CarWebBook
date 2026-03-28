import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Reduce product stock after successful payment
 * - Reduces totalStock
 * - Reduces matching variant.stock
 * - Uses Firestore transaction (safe against race conditions)
 */
export const reduceStockAfterPurchase = async (cartItems) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("EMPTY_CART");
  }

  await runTransaction(db, async (transaction) => {
    for (const item of cartItems) {
      /**
       * REQUIRED FIELDS in cart item:
       * item.docId        -> product document id
       * item.quantity     -> quantity purchased
       * item.sku OR item.variantSku
       */

      if (!item.docId || !item.quantity) {
        throw new Error("INVALID_CART_ITEM");
      }

      const productRef = doc(db, "products", item.docId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const product = productSnap.data();

      /* ===== TOTAL STOCK CHECK ===== */
      if (
        typeof product.totalStock !== "number" ||
        product.totalStock < item.quantity
      ) {
        throw new Error(`OUT_OF_STOCK: ${item.name}`);
      }

      /* ===== VARIANT STOCK UPDATE ===== */
      let variantUpdated = false;

      const updatedVariants = Array.isArray(product.variants)
        ? product.variants.map((v) => {
            // match by SKU (recommended)
            if (
              v.sku === item.sku ||
              v.sku === item.variantSku
            ) {
              if (v.stock < item.quantity) {
                throw new Error(
                  `VARIANT_OUT_OF_STOCK: ${item.name}`
                );
              }

              variantUpdated = true;
              return {
                ...v,
                stock: v.stock - item.quantity,
              };
            }

            return v;
          })
        : [];

      // If variants exist but no matching SKU found
      if (product.variants?.length && !variantUpdated) {
        throw new Error(`VARIANT_NOT_FOUND: ${item.name}`);
      }

      /* ===== UPDATE PRODUCT ===== */
      transaction.update(productRef, {
        totalStock: product.totalStock - item.quantity,
        variants: updatedVariants,
        updatedAt: serverTimestamp(),
      });
    }
  });
};