import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import toast from "react-hot-toast";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa",
  "Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
  "Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir",
  "Ladakh","Puducherry",
];

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  pinCode: "",
  state: "",
  country: "India",
};

const ManageAddress = () => {
  const [form, setForm] = useState(initialForm);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const user = auth.currentUser;

  /* ================= FETCH ADDRESSES ================= */
  const fetchAddresses = async () => {
    if (!user) return;

    const snap = await getDocs(
      collection(db, "users", user.uid, "addresses")
    );

    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setAddresses(list);
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ================= DUPLICATE CHECK ================= */
  const isDuplicate = async () => {
    const q = query(
      collection(db, "users", user.uid, "addresses"),
      where("phone", "==", form.phone),
      where("street", "==", form.street),
      where("pinCode", "==", form.pinCode)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      if (editId && snap.docs[0].id === editId) return false;
      return true;
    }

    return false;
  };

  /* ================= ADD / UPDATE ================= */
  const handleSave = async () => {
    if (!user) return toast.error("Please login");

    const { fullName, phone, street, city, pinCode, state } = form;
    if (!fullName || !phone || !street || !city || !pinCode || !state)
      return toast.error("Fill all required fields");

    try {
      setLoading(true);

      if (await isDuplicate()) {
        return toast.error("Duplicate address already exists");
      }

      if (editId) {
        await updateDoc(
          doc(db, "users", user.uid, "addresses", editId),
          { ...form }
        );
        toast.success("Address updated");
      } else {
        await addDoc(
          collection(db, "users", user.uid, "addresses"),
          { ...form, createdAt: serverTimestamp() }
        );
        toast.success("Address added");
      }

      setForm(initialForm);
      setEditId(null);
      fetchAddresses();
    } catch {
      toast.error("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (addr) => {
    setForm(addr);
    setEditId(addr.id);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;

    await deleteDoc(doc(db, "users", user.uid, "addresses", id));
    toast.success("Address deleted");
    fetchAddresses();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-sky-400">
        Manage Address
      </h2>

      {/* ================= SAVED ADDRESSES ================= */}
      {addresses.length > 0 && (
        <div className="space-y-4 mb-8">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-black border border-slate-700 rounded-xl p-4"
            >
              <p className="font-semibold">{addr.fullName}</p>
              <p className="text-sm text-slate-400">
                {addr.street}, {addr.city}, {addr.state} - {addr.pinCode}
              </p>
              <p className="text-sm text-slate-400">
                {addr.phone}
              </p>

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleEdit(addr)}
                  className="px-4 py-1.5 rounded bg-sky-500 text-black text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="px-4 py-1.5 rounded bg-red-500 text-black text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= ADDRESS FORM ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {["fullName","phone","email","street","city","pinCode"].map((f) => (
          <input
            key={f}
            name={f}
            value={form[f]}
            onChange={handleChange}
            placeholder={f.replace(/([A-Z])/g," $1")}
            className="p-3 rounded-lg bg-black border border-slate-700
                       focus:ring-2 focus:ring-sky-500 outline-none"
          />
        ))}

        <select
          name="state"
          value={form.state}
          onChange={handleChange}
          className="p-3 rounded-lg bg-black border border-slate-700"
        >
          <option value="">Select State</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <input
          value="India"
          disabled
          className="p-3 rounded-lg bg-slate-900 border border-slate-700
                     text-slate-400 cursor-not-allowed"
        />
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 rounded-lg font-semibold
                     bg-sky-500 text-black hover:bg-sky-400 transition"
        >
          {editId ? "Update Address" : "Add Address"}
        </button>

        <button
          onClick={() => {
            setForm(initialForm);
            setEditId(null);
          }}
          className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ManageAddress;