import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(
    window.innerWidth >= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      const isLg = window.innerWidth >= 1024;
      setIsLargeScreen(isLg);
      if (isLg) setSidebarOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100/35 text-black">

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div
        className={`
          flex flex-col flex-1 min-w-0 min-h-screen
          transition-[margin] duration-300
          ${isLargeScreen ? (sidebarCollapsed ? "lg:ml-20" : "lg:ml-72") : ""}
        `}
      >
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden p-8 sm:p-5 lg:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-5 py-3 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Your Company Name. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
