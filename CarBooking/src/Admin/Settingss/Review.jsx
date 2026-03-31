import React, { useEffect, useState } from "react";
import {
    FaStar,
    FaTrash,
    FaPlus,
    FaArrowLeft,
    FaImage,
    FaCheckCircle,
    FaSearch,
    FaEdit,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";

const ReviewsSettings = () => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);

    const [form, setForm] = useState({
        name: "",
        rating: 0,
        message: "",
        image: "",
    });

    /* ================= FETCH ================= */
    const fetchReviews = async () => {
        try {
            const res = await api.get("/reviews");
            setReviews(res.data);
        } catch {
            toast.error("Failed to load reviews");
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    /* ================= IMAGE ================= */
const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const options = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(file, options);

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        image: reader.result,
      }));
    };

    reader.readAsDataURL(compressedFile);
  } catch (error) {
    console.error("Image compression failed:", error);
    toast.error("Image upload failed");
  }
};

    const handleSubmit = async (e) => {
  e.preventDefault();

  if (!Number(form.rating)) {
    toast.error("Please select rating");
    return;
  }

  try {
    if (editId) {
      await api.put(`/reviews/${editId}`, {
        name: form.name,
        rating: Number(form.rating),
        message: form.message,
        image: form.image || "",
      });

      toast.success("Review updated successfully");
    } else {
      await api.post("/reviews", {
        name: form.name,
        rating: Number(form.rating),
        message: form.message,
        image: form.image || "",
      });

      toast.success("Review added successfully");
    }

    // RESET STATE AFTER SUCCESS
    setForm({
      name: "",
      rating: 0,
      message: "",
      image: "",
    });
    setEditId(null);
    setShowModal(false);
    fetchReviews();
  } catch (error) {
    console.error("Review submit error:", error);
    toast.error("Something went wrong");
  }
};


    const handleEdit = (review) => {
        setEditId(review.id);
        setForm({
            name: review.name,
            rating: review.rating,
            message: review.message,
            image: review.image || "",
        });
        setShowModal(true);
    };


    /* ================= DELETE ================= */
    const handleDelete = async (id) => {
        if (!window.confirm("Delete this review?")) return;
        try {
            await api.delete(`/reviews/${id}`);
            toast.success("Deleted");
            fetchReviews();
        } catch {
            toast.error("Delete failed");
        }
    };

    /* ================= TOGGLE STATUS ================= */
    const toggleStatus = async (id, status) => {
        try {
            await api.put(`/reviews/${id}/status`, {
                status: !status,
            });
            fetchReviews();
        } catch {
            toast.error("Status update failed");
        }
    };

    const filtered = reviews.filter(
        (r) =>
            r.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.message?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="text-white bg-black rounded-full px-3 py-2 hover:underline flex items-center gap-1"
                >
                    <FaArrowLeft /> Back
                </button>

            </div>

            {/* SEARCH + ADD */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative w-full max-w-sm">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search reviews..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-gray-300 shadow focus:ring-2 focus:ring-gray-900 focus:outline-none"
                    />
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="bg-black hover:bg-orange-500 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow"
                >
                    <FaPlus /> Add Review
                </button>
            </div>

            {/* LIST */}
            <div className="grid gap-4">
                {filtered.map((r) => (
                    <div
                        key={r.id}
                        className="bg-white rounded-2xl shadow hover:shadow-lg transition p-5 flex gap-4"
                    >
                        {/* IMAGE */}
                        {r.image ? (
                            <img
                                src={r.image}
                                alt=""
                                className="w-16 h-16 rounded-full object-cover border"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <FaImage className="text-gray-400" />
                            </div>
                        )}

                        {/* CONTENT */}
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <div>
                                    <h3 className="font-semibold">{r.name}</h3>
                                    <div className="flex gap-1 mt-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <FaStar
                                                key={i}
                                                className={
                                                    i <= r.rating
                                                        ? "text-yellow-400"
                                                        : "text-gray-300"
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* ACTIONS */}
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleStatus(r.id, r.status)}
                                        className={`text-xl ${r.status ? "text-green-600" : "text-gray-400"
                                            }`}
                                        title={r.status ? "Approved" : "Pending"}
                                    >
                                        <FaCheckCircle />
                                    </button>

                                    <button
                                        onClick={() => handleEdit(r)}
                                        className="text-blue-600 hover:text-blue-700"
                                    >
                                        <FaEdit />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-700 mt-2">
                                {r.message}
                            </p>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <p className="text-center text-gray-500">
                        No reviews found
                    </p>
                )}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4"
                    >
                        <h3 className="text-lg font-semibold">
                            {editId ? "Edit Review" : "Add Review"}
                        </h3>
                        <label htmlFor="patientName">Part Name</label>

                        <input
                            type="text"
                            placeholder="Patient name"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            required
                        />
                        <label htmlFor="image">Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload} className="w-full border border-gray-300 rounded-lg px-4 py-2"
                        />

                        {form.image && (
                            <img
                                src={form.image}
                                alt=""
                                className="w-20 h-20 rounded-full"
                            />
                        )}
                        <br />

                        <label htmlFor="rating">Rating</label>
                        {/* STARS */}
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <FaStar
                                    key={i}
                                    onClick={() => setForm({ ...form, rating: Number(i) })}
                                    className={`cursor-pointer text-xl ${i <= form.rating
                                            ? "text-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                        <label htmlFor="message">Messages</label>

                        <textarea
                            placeholder="Review message"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            value={form.message}
                            onChange={(e) =>
                                setForm({ ...form, message: e.target.value })
                            }
                            required
                        />

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="border border-gray-300 px-4 py-2 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button className="bg-black hover:bg-orange-500 text-white px-4 py-2 rounded-lg">
                                {editId ? "Update" : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>

    );
};

export default ReviewsSettings;
