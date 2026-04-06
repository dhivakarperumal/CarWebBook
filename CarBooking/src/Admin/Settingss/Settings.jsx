import React from "react";
import {
  FaUserCog,
  FaBell,
  FaUsers,
  FaCogs,
  FaFileInvoice,
  FaStar,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const SettingCard = ({ icon, title, desc, path }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-blue-100 text-blue-600 text-xl">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-gray-500 text-sm">{desc}</p>
        </div>
      </div>

      <button
        onClick={() => navigate(path)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm"
      >
        Manage
      </button>
    </div>
  );
};

const Settings = () => {
  return (
    <div className="space-y-5">

      <h2 className="text-2xl font-semibold"></h2>

    


      <SettingCard
        icon={<FaUsers />}
        title="User Management"
        desc="Manage user roles, permissions, and accounts."
        path="/admin/customers"
      />


      <SettingCard
        icon={<FaUsers />}
        title="Service Areas"
        desc="Manage user roles, permissions, and accounts."
        path="/admin/service-areas"
      />

      <SettingCard
        icon={<FaCogs />}
        title="Prices List"
        desc="Configure general system preferences."
        path="/admin/priceslist"
      />

      <SettingCard
        icon={<FaFileInvoice />}
        title="Services"
        desc="Set up and manage services."
        path="/admin/serviceslist"
      />


      <SettingCard
        icon={<FaStar />}
        title="Customer Reviews & Ratings"
        desc="View and manage customer feedback, service ratings, and complaints."
        path="/admin/settings/reviews"
      />

    </div>
  );
};

export default Settings;

