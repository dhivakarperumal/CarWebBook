import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

const AddServiceType = () => {
  const [serviceType, setServiceType] = useState("");
  const [serviceList, setServiceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("form"); // 🔥 NEW

  const serviceRef = collection(db, "serviceTypes");

  const fetchServices = async () => {
    const q = query(serviceRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setServiceList(data);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!serviceType.trim()) return alert("Please enter service type");

    const exists = serviceList.some(
      (s) => s.name.toLowerCase() === serviceType.trim().toLowerCase()
    );

    if (exists) return alert("Service type already exists");

    try {
      setLoading(true);
      await addDoc(serviceRef, {
        name: serviceType.trim(),
        createdAt: serverTimestamp(),
      });
      setServiceType("");
      fetchServices();
      setView("list"); // 🔥 switch to list after add
    } catch (error) {
      console.error(error);
      alert("Failed to add service type");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service type?")) return;
    await deleteDoc(doc(db, "serviceTypes", id));
    fetchServices();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Service Types</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setView("form")}
            className={`px-4 py-2 rounded ${
              view === "form"
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
          >
            Add Service
          </button>

          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded ${
              view === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
          >
            Service List
          </button>
        </div>
      </div>

      {/* FORM VIEW */}
      {view === "form" && (
        <form
          onSubmit={handleSubmit}
          className="flex gap-3 bg-white p-4 rounded shadow"
        >
          <input
            type="text"
            placeholder="Enter service type"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="flex-1 border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </form>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <ul className="bg-white rounded shadow divide-y">
          {serviceList.length === 0 && (
            <li className="p-4 text-gray-500 text-center">
              No service types found
            </li>
          )}

          {serviceList.map((service) => (
            <li
              key={service.id}
              className="px-4 py-3 flex justify-between items-center"
            >
              <span className="font-medium">{service.name}</span>
              <button
                onClick={() => handleDelete(service.id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddServiceType;

