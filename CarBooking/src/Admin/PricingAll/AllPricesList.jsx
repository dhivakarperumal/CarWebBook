import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import toast from "react-hot-toast";
import {
  LayoutGrid,
  Plus,
  Search,
  Trash2,
  Pencil,
} from "lucide-react";
import { FaTable } from "react-icons/fa";
import Pagination from "../../Components/Pagination";

const ITEMS_PER_PAGE = 8;

const PricingList = () => {
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  /* 🔹 Fetch */
  const fetchPackages = async () => {
    try {
      const res = await api.get("/pricing_packages");
      setPackages(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load packages");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  /* 🔹 Delete */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this package?")) return;

    try {
      await api.delete(`/pricing_packages/${id}`);
      toast.success("Package deleted");
      fetchPackages();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) =>
      pkg.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [packages, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredPackages.length / ITEMS_PER_PAGE);
  const paginatedPackages = filteredPackages.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading pricing packages...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto pb-5">
      <div>

        {/* 🔹 HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

          {/* 🔹 SEARCH */}
          <div className="relative w-full lg:w-92">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search package..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-[45px] w-full pl-9 pr-3 py-3 border border-gray-300 bg-white
               rounded-md text-sm shadow-sm
               focus:ring-2 focus:ring-black outline-none transition"
            />
          </div>

          {/* 🔹 ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">

            {/* 🔹 VIEW TOGGLE */}
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setView("card")}
                className={`flex items-center gap-1 px-3 py-2.5 text-sm transition
        ${view === "card"
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <LayoutGrid size={16} />
                <span className="hidden sm:inline">Card</span>
              </button>

              <button
                onClick={() => setView("table")}
                className={`flex items-center gap-1 px-3 py-2.5 text-sm transition border-l
        ${view === "table"
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <FaTable size={16} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* 🔹 ADD BUTTON */}
            <button
              onClick={() => navigate("/admin/addprice")}
              className="inline-flex items-center gap-2
              bg-black text-white
              px-4 h-10
              rounded-md text-sm font-medium
              hover:bg-gray-900
              active:scale-95
              focus:outline-none focus:ring-2 focus:ring-black/40
              transition"
            >
              <span className="flex items-center justify-center w-5 h-5">
                <Plus size={16} />
              </span>

              <span className="hidden sm:inline">Add New Pricing</span>
            </button>

          </div>
        </div>

        {/* 🔹 CARD VIEW */}
        {view === "card" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-10">
            {paginatedPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="border border-gray-300 rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-md">{pkg.title}</h3>
                  <span className="text-[10px] uppercase font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded">
                    {pkg.place || "home"}
                  </span>
                </div>

                <p className="text-sm font-medium mt-1">
                  ₹{Number(pkg.price || 0).toLocaleString()}
                </p>

                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  {pkg.features?.slice(0, 3).map((f, i) => (
                    <li key={i}>✔ {f}</li>
                  ))}
                  {pkg.features?.length > 3 && (
                    <li className="text-gray-400">
                      +{pkg.features.length - 3} more
                    </li>
                  )}
                </ul>

                <div className="flex justify-end gap-3 mt-3">
                  <button
                    onClick={() =>
                      navigate(`/admin/addprice/${pkg.id}`, { state: pkg })
                    }
                    className="p-3 rounded-full border border-gray-300 transition"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="p-3 rounded-full border border-gray-300 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {filteredPackages.length === 0 && (
              <p className="text-gray-500 col-span-full text-center py-10">
                No packages found
              </p>
            )}
          </div>
        )}

        {/* 🔹 TABLE VIEW */}
        {view === "table" && (
          <div className="overflow-x-auto mt-10 bg-white rounded-2xl shadow-sm border border-gray-200">
            <table className="w-full text-md">
              <thead className="bg-[#020617] text-white">
                <tr>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">S No</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Title</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Place</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Time</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Price</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Features</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPackages.map((pkg, i) => (
                  <tr key={pkg.id} className="border-t border-gray-300 hover:bg-gray-50">
                    <td className="px-4 py-4">{i + 1}</td>
                    <td className="px-4 py-4">{pkg.title}</td>
                    <td className="px-4 py-4 font-semibold capitalize text-gray-700">
                      {pkg.place || "Home"}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-gray-600">
                      {pkg.time || "-"}
                    </td>
                    <td className="px-4 py-4">
                      ₹{Number(pkg.price || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      {pkg.features?.length || 0}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/admin/addprice/${pkg.id}`, { state: pkg })
                          }
                          className="p-3 rounded-full border border-gray-300 transition"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(pkg.id)}
                          className="p-3 rounded-full border border-gray-300 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}

                {filteredPackages.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center p-6 text-gray-500">
                      No packages found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default PricingList;