import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

// Example API calls
export const getBookings = (uid) => api.get("/bookings", { params: { uid } });
export const createBooking = (bookingData) => api.post("/bookings/create", bookingData);
export const getAllServices = (uid) => api.get("/all-services", { params: { uid } });

// Appointment APIs
export const createAppointment = (appointmentData) => api.post("/appointments/create", appointmentData);
export const getMyAppointments = (uid) => api.get("/appointments/my", { params: { uid } });
export const getAllAppointments = () => api.get("/appointments/all");
export const updateAppointment = (id, data) => api.put(`/appointments/${id}`, data);

export default api;
