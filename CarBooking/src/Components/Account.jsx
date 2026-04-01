import { useEffect, useState } from "react";
import PersonalInfo from "./PersonalInfo";
import PageHeader from "./PageHeader";
import MyOrders from "./MyOrders";
import ManageAddress from "./ManageAddress";
import ServiceStatus from "./ServiceStatus";
import History from "./History";
import PageContainer from "./PageContainer";
import { useLocation } from "react-router-dom";

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
    address: "Manage Address",
    servicestatus: "Service Status",
    history: "Service History",
  };

  const renderComponent = () => {
    switch (activeTab) {
      case "servicestatus":
        return <ServiceStatus />;
      case "personal":
        return <PersonalInfo />;
      case "orders":
        return <MyOrders />;
      case "address":
        return <ManageAddress />;
      case "history":
        return <History />;
      default:
        return <ServiceStatus />;
    }
  };

  return (
    <>
      <PageHeader title={titleMap[activeTab]} />

      <div className="min-h-screen bg-black text-white py-10">
        <PageContainer className="overflow-visible">
          {/* ===== MOBILE TABS ===== */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4 hide-scrollbar">
            {[
              ["servicestatus", "Service"],
              ["personal", "Profile"],
              ["orders", "Orders"],
              ["history", "History"],
              ["address", "Address"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold
                  ${
                    activeTab === key
                      ? "bg-sky-500 text-black"
                      : "bg-slate-800 text-white"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

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
