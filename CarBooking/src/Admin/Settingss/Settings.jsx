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
        icon={<FaUserCog />}
        title="Profile Settings"
        desc="Update personal information and change password."
        path="/admin/settings/profile"
      />

      {/* <SettingCard
        icon={<FaBell />}
        title="Notification Settings"
        desc="Configure notification preferences and alerts."
        path="/admin/settings/notifications"
      /> */}

      <SettingCard
        icon={<FaUsers />}
        title="User Management"
        desc="Manage user roles, permissions, and accounts."
        path="/admin/settings/usermanagement"
      />

      {/* <SettingCard
        icon={<FaCogs />}
        title="System Settings"
        desc="Configure general system preferences."
        path="/admin/settings/system"
      /> */}

      {/* <SettingCard
        icon={<FaFileInvoice />}
        title="Billing & Payment"
        desc="Set up and manage billing preferences and payment options."
        path="/admin/settings/billing"
      /> */}

      {/* 🏥 Hospital Reviews Section */}
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

