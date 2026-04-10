import { useEffect, useState } from "react";
import PersonalInfo from "./PersonalInfo";
import PageHeader from "./PageHeader";
import MyOrders from "./MyOrders";
import ManageAddress from "./ManageAddress";
import ServiceStatus from "./ServiceStatus";
import History from "./History";
import VehicleBookings from "./VehicleBookings";
import PageContainer from "./PageContainer";
import SetPassword from "./SetPassword";
import { useLocation } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";

const Account = () => {
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(
    location.state?.tab || "servicestatus",
  );

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const titleMap = {
    personal: "Personal Information",
    orders: "My Orders",
    "vehicle-bookings": "Vehicle Bookings",
    address: "Manage Address",
    servicestatus: "Service Status",
    history: "Service History",
    password: "Set Password",
  };

  const tabs = [
    ["servicestatus", "Service"],
    ["personal", "Profile"],
    ["orders", "Orders"],
    ["vehicle-bookings", "Vehicles"],
    ["history", "History"],
    ["address", "Address"],
    ["password", "Password"],
  ];

  const renderComponent = () => {
    switch (activeTab) {
      case "servicestatus":
        return <ServiceStatus />;
      case "personal":
        return <PersonalInfo />;
      case "orders":
        return <MyOrders />;
      case "vehicle-bookings":
        return <VehicleBookings />;
      case "address":
        return <ManageAddress />;
      case "history":
        return <History />;
      case "password":
        return <SetPassword />;
      default:
        return <ServiceStatus />;
    }
  };

  const MobileDropdown = ({ activeTab, setActiveTab, tabs }) => {
    const [open, setOpen] = useState(false);

    const activeLabel =
      tabs.find(([key]) => key === activeTab)?.[1] || "Select Section";

    return (
      <div className="md:hidden mb-4 relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex justify-between items-center px-4 py-3 rounded-xl 
        bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 
        text-white border border-sky-400/30 shadow-md"
        >
          <span className="font-semibold">{activeLabel}</span>

          <FiChevronDown
            className={`transition-transform duration-300 ${open ? "rotate-180" : ""
              }`}
            size={20}
          />
        </button>

        {open && (
          <div className="absolute w-full mt-2 rounded-xl overflow-hidden 
        bg-slate-900 border border-sky-400/20 shadow-xl z-50">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm
                ${activeTab === key
                    ? "bg-gradient-to-r from-sky-500 to-cyan-400 text-black"
                    : "text-white hover:bg-slate-800"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHeader title={titleMap[activeTab]} />

      <div className="min-h-screen bg-black text-white py-10">
        <PageContainer className="overflow-visible">

          <MobileDropdown
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabs={tabs}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {/* ===== DESKTOP SIDEBAR (STICKY WORKING) ===== */}
            <div className="hidden md:block">
              <div
                className="
                  sticky top-24
                  bg-slate-900
                  rounded-2xl
                  p-4
                  space-y-3
                  border border-sky-400
                "
              >
                <SidebarButton
                  active={activeTab === "servicestatus"}
                  onClick={() => setActiveTab("servicestatus")}
                  label="Service Status"
                />
                <SidebarButton
                  active={activeTab === "personal"}
                  onClick={() => setActiveTab("personal")}
                  label="Personal Info"
                />
                <SidebarButton
                  active={activeTab === "orders"}
                  onClick={() => setActiveTab("orders")}
                  label="My Orders"
                />
                <SidebarButton
                  active={activeTab === "vehicle-bookings"}
                  onClick={() => setActiveTab("vehicle-bookings")}
                  label="Vehicle Bookings"
                />
                {/* <SidebarButton
                  active={activeTab === "address"}
                  onClick={() => setActiveTab("address")}
                  label="Manage Address"
                /> */}

                <SidebarButton
                  active={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                  label="History"
                />
                <SidebarButton
                  active={activeTab === "password"}
                  onClick={() => setActiveTab("password")}
                  label="Set Password"
                />
              </div>
            </div>

            {/* ===== RIGHT CONTENT ===== */}
            <div className="md:col-span-3 bg-slate-900 rounded-2xl p-4 sm:p-6 border border-sky-400">
              {renderComponent()}
            </div>
          </div>
        </PageContainer>
      </div>
    </>
  );
};


export default Account;



/* ===== Sidebar Button ===== */
const SidebarButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition
      ${active ? "bg-sky-500 text-black" : "bg-slate-800 hover:bg-slate-700"}`}
  >
    {label}
  </button>
);

