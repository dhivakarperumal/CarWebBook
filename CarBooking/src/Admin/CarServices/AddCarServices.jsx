import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate, useParams } from "react-router-dom";

/* Static Options */
const serviceTypes = [
  "General Service",
  "Oil Change",
  "Engine Repair",
  "Brake Repair",
];

const statusList = [
  "Pending",
  "In Progress",
  "Waiting for Parts",
  "Completed",
];

const AddServices = () => {
  const { id } = useParams(); // undefined = ADD, value = EDIT
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [mechanics, setMechanics] = useState([]);

  const [form, setForm] = useState({
    carNumber: "",
    customerName: "",
    mobileNumber: "",
    serviceType: "",
    mechanic: "",
    status: "Pending",
    startTime: "",
    endTime: "",
    spareParts: "",
    estimatedCost: "",
    notes: "",
    carServiceId: "",
  });

  /* Load existing service for EDIT */
  useEffect(() => {
    if (!isEdit) return;
    const fetchService = async () => {
      try {
        const res = await api.get(`/car-services/${id}`);
        setForm({ ...res.data, estimatedCost: res.data.estimatedCost || '' });
      } catch (err) {
        console.error(err);
        alert('Failed to load service');
        navigate('/admin/carservices');
      }
    };
    fetchService();
  }, [id, isEdit, navigate]);

  /* Fetch Mechanics from staff table */
  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const res = await api.get('/staff');
        const list = res.data
          .filter((emp) => emp.role === 'Mechanic')
          .map((emp) => emp.name);
        setMechanics(list);
      } catch (err) {
        console.error('Failed to fetch mechanics', err);
      }
    };
    fetchMechanics();
  }, []);

  /* 🔁 Handle Change */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* Submit (ADD / UPDATE) */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        carNumber: form.carNumber,
        customerName: form.customerName,
        mobileNumber: form.mobileNumber,
        serviceType: form.serviceType,
        mechanic: form.mechanic,
        status: form.status,
        startTime: form.startTime,
        endTime: form.endTime,
        spareParts: form.spareParts,
        estimatedCost: Number(form.estimatedCost || 0),
        notes: form.notes,
      };

      if (isEdit) {
        await api.put(`/car-services/${id}`, payload);
        alert(`Service Updated (${form.carServiceId})`);
      } else {
        const res = await api.post('/car-services', payload);
        alert(`Car Service Added 🚗 (${res.data.carServiceId})`);
      }

      navigate('/admin/carservices');
    } catch (err) {
      console.error(err);
      alert('Operation failed ❌');
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="p-0 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {isEdit
            ? `Edit Car Service (${form.carServiceId})`
            : "Add Car Service"}
        </h2>
       
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow"
      >
        <Input
          label="Car Number"
          name="carNumber"
          placeholder="Enter Car Number"
          value={form.carNumber}
          onChange={handleChange}
          className={inputClass}
        />

        <Input
          label="Customer Name"
          name="customerName"
          placeholder="Enter customer name"
          value={form.customerName}
          onChange={handleChange}
          className={inputClass}
        />

        <Input
          label="Mobile Number"
          name="mobileNumber"
          placeholder="Enter 10-digit mobile number"
          value={form.mobileNumber}
          onChange={handleChange}
          className={inputClass}
          pattern="[0-9]{10}"
        />

        <Select
          label="Service Type"
          name="serviceType"
          value={form.serviceType}
          onChange={handleChange}
          className={inputClass}
          options={serviceTypes}
        />

        <Select
          label="Assign Mechanic"
          name="mechanic"
          value={form.mechanic}
          onChange={handleChange}
          className={inputClass}
          options={mechanics}
        />

        <Select
          label="Service Status"
          name="status"
          value={form.status}
          onChange={handleChange}
          className={inputClass}
          options={statusList}
        />

        <Input
          type="datetime-local"
          label="Repair Start Time"
          name="startTime"
          placeholder="Enter start time"
          value={form.startTime}
          onChange={handleChange}
          className={inputClass}
        />

        <Input
          type="datetime-local"
          label="Repair End Time"
          name="endTime"
          placeholder="Enter end time"
          value={form.endTime}
          onChange={handleChange}
          className={inputClass}
        />

        <Textarea
          label="Spare Parts Used / Bought"
          name="spareParts"
          placeholder="Enter spare parts used or bought..."
          value={form.spareParts}
          onChange={handleChange}
          className={inputClass}
        />

        <Input
          type="number"
          label="Estimated Cost (₹)"
          placeholder="Enter estimated cost in ₹"
          name="estimatedCost"
          value={form.estimatedCost}
          onChange={handleChange}
          className={inputClass}
        />

        <Input
          label="Additional Notes"
          name="notes"
          placeholder="Enter any additional notes..."
          value={form.notes}
          onChange={handleChange}
          className={inputClass}
        />

        {/* Actions */}
        <div className="md:col-span-2 flex justify-end gap-4">
          

          <button
            type="button"
            onClick={() => navigate("/admin/carservices")}
            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            className={`px-6 py-2 rounded text-white ${
              loading
                ? "bg-gray-400"
                : isEdit
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-black hover:bg-orange-500"
            }`}
          >
            {loading
              ? "Saving..."
              : isEdit
              ? "Update Service"
              : "Save Service"}
          </button>
        </div>
      </form>
    </div>
  );
};

/* 🔁 Reusable Components */

 const labelClass = "text-sm font-semibold text-gray-800 mb-1";
const inputClass ="w-full bg-white rounded-lg border border-gray-300 px-5 py-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition";


const Input = ({ label, ...props }) => (
  <div>
    <label className={labelClass}>{label}</label>
    <input
      {...props}
      className={inputClass}
      required
    />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div>
    <label className={labelClass}>{label}</label>
    <select
      {...props}
      className={inputClass}
      required
    >
      <option value={labelClass}>Select</option>
      {options.map((op) => (
        <option key={op} value={op}>
          {op}
        </option>
      ))}
    </select>
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="md:col-span-2">
    <label className={labelClass}>{label}</label>
    <textarea
      {...props}
      className={inputClass}
    />
  </div>
);

export default AddServices;
