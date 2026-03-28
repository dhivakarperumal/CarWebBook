import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

// Example API calls
export const getBookings = (uid) => api.get("/bookings", { params: { uid } });
export const createBooking = (bookingData) => api.post("/bookings/create", bookingData);


export default api;
