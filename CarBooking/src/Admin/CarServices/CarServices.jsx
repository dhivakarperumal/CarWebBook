import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaSearch,FaEye,FaSpinner } from "react-icons/fa";
import { FaCar, FaClock, FaCheckCircle, FaTools } from "react-icons/fa";
import Pagination from "../../Components/Pagination";

const ITEMS_PER_PAGE = 8;

const mechanicsList = ["Ramesh", "Suresh", "Karthik", "Manoj"];
const statusList = ["Pending", "In Progress", "Waiting for Parts", "Completed"];

const CarServices = () => {
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    mechanic: "",
  });
  const [selectedService, setSelectedService] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  /* Fetch services */
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/car-services');
        setServices(res.data);
      } catch (err) {
        console.error('Failed to load services', err);
      }
    };
    fetchServices();
  }, []);


  /* Filters */
  const filteredServices = services.filter((s) => {
    return (
      (!filters.search ||
        s.carNumber?.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.customerName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.carServiceId?.toLowerCase().includes(filters.search.toLowerCase())) &&
      (!filters.status || s.status === filters.status) &&
      (!filters.mechanic || s.mechanic === filters.mechanic)
    );
  });
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* Cards */
  const total = services.length;
  const completed = services.filter((s) => s.status === "Completed").length;
  const inProgress = services.filter((s) => s.status === "In Progress").length;
  const pending = services.filter((s) => s.status === "Pending").length;

  /* Delete */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    try {
      await api.delete(`/car-services/${id}`);
      setServices(services.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete service");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold"></h2>
        <button
          onClick={() => navigate("/admin/addcarservies")}
          className="bg-black hover:bg-orange-600 text-white px-5 py-3 rounded-lg font-semibold shadow"
        >
          + Add Car Service
        </button>
      </div>

      {/* Cards */}
     
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">

  <Card
    title="Total Services"
    value={total}
    icon={<FaCar size={18} />}
    color="text-blue-600"
  />

  <Card
    title="Completed"
    value={completed}
    icon={<FaCheckCircle size={18} />}
    color="text-green-600"
  />

  <Card
    title="In Progress"
    value={inProgress}
    icon={<FaSpinner size={18} />}
    color="text-orange-500"
  />

  <Card
    title="Pending"
    value={pending}
    icon={<FaClock size={18} />}
    color="text-yellow-500"
  />

</div>

    

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 justify-between items-center">
        <div>

        
        <input
          placeholder="Search SEV Car Customer"
          className="w-full
    rounded-lg
    border border-gray-200
    pl-10 px-4 py-4
    text-sm
    shadow-sm
    focus:outline-none
    focus:ring-2
    focus:ring-gray-900/40
    focus:border-gray-500
    transition
    bg-white"
          onChange={(e) =>
            setFilters({ ...filters, search: e.target.value })
          }
        />

        </div>

       <div className="flex items-center gap-3">
         <select
          className="rounded-lg
    border border-gray-200
    pl-10 px-4 py-3
    text-sm
    shadow-sm
    focus:outline-none
    focus:ring-2
    focus:ring-gray-900/40
    focus:border-gray-500
    transition
    bg-white"
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
        >
          <option value="">All Status</option>
          {statusList.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select
          className="rounded-lg
    border border-gray-200
    pl-10 px-4 py-3
    text-sm
    shadow-sm
    focus:outline-none
    focus:ring-2
    focus:ring-gray-900/40
    focus:border-gray-500
    transition
    bg-white"
          onChange={(e) =>
            setFilters({ ...filters, mechanic: e.target.value })
          }
        >
          <option value="">All Mechanics</option>
          {mechanicsList.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
       </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-4 text-left">Service ID</th>
                <th className="px-4 py-4 text-left">Car No</th>
                <th className="px-4 py-4 text-left">Customer</th>
                <th className="px-4 py-4 text-left">Mechanic</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-left">Cost</th>
                <th className="px-4 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedServices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-500">
                    No services found
                  </td>
                </tr>
              ) : (
                paginatedServices.map((s) => (
                  <tr key={s.id} className="border-t border-gray-300 hover:bg-gray-50">
                    <td className="px-4 py-4 font-semibold">{s.carServiceId}</td>
                    <td className="px-4 py-4">{s.carNumber}</td>
                    <td className="px-4 py-4">{s.customerName}</td>
                    <td className="px-4 py-4">{s.mechanic}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          s.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : s.status === "In Progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">₹{s.estimatedCost || 0}</td>
                    <td className="px-4 py-4 flex justify-start gap-3">
                      <button
                        onClick={() => setSelectedService(s)}
                        className="bg-amber-500 text-white p-2 rounded-lg"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/addcarservies/${s.id}`)}
                        className="bg-green-600 text-white p-2 rounded-lg"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="bg-red-600 text-white p-2 rounded-lg"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* View Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-lg w-full">
            <h3 className="text-xl font-bold mb-4">Service Details</h3>

            <div className="space-y-2 text-sm">
              <p><b>Service ID:</b> {selectedService.carServiceId}</p>
              <p><b>Car Number:</b> {selectedService.carNumber}</p>
              <p><b>Customer:</b> {selectedService.customerName}</p>
              <p><b>Mobile:</b> {selectedService.mobileNumber}</p>
              <p><b>Service Type:</b> {selectedService.serviceType}</p>
              <p><b>Mechanic:</b> {selectedService.mechanic}</p>
              <p><b>Status:</b> {selectedService.status}</p>
              <p><b>Cost:</b> ₹{selectedService.estimatedCost}</p>
              <p><b>Notes:</b> {selectedService.notes || "-"}</p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedService(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Card Component */
const Card = ({ title, value, icon, color = "text-blue-600" }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
    
    {/* TOP ROW */}
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500 font-medium">
        {title}
      </p>

      <div className={`p-2 rounded-lg bg-gray-100 ${color}`}>
        {icon}
      </div>
    </div>

    {/* VALUE */}
    <h3 className="mt-3 text-3xl font-semibold text-gray-900">
      {value}
    </h3>

  </div>
);



export default CarServices;
