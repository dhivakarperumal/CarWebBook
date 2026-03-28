import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Saves address for user if not duplicate
 * Throws Error("DUPLICATE_ADDRESS") if already exists
 */
export const saveUserAddress = async (uid, address) => {
  if (!uid) throw new Error("NO_USER");

  const {
    fullName,
    phone,
    street,
    city,
    state,
    pinCode,
    email = "",
    country = "India",
  } = address;

  if (!fullName || !phone || !street || !city || !state || !pinCode) {
    throw new Error("INVALID_ADDRESS");
  }

  const ref = collection(db, "users", uid, "addresses");

  // 🔍 DUPLICATE CHECK (same logic as ManageAddress)
  const q = query(
    ref,
    where("phone", "==", phone),
    where("street", "==", street),
    where("pinCode", "==", pinCode)
  );

  const snap = await getDocs(q);

  if (!snap.empty) {
    throw new Error("DUPLICATE_ADDRESS");
  }

  // ✅ SAVE ADDRESS
  await addDoc(ref, {
    fullName,
    phone,
    email,
    street,
    city,
    state,
    pinCode,
    country,
    createdAt: serverTimestamp(),
  });
};