import { Facebook, Instagram, Linkedin, Mail } from "lucide-react";
import PageContainer from "./PageContainer";
import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

const links = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Pricing", path: "/pricing" },
  { label: "Services", path: "/services" },
  { label: "Products", path: "/products" },
  { label: "Contact Us", path: "/contact" },
];

export default function Footer() {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

useEffect(() => {
  const fetchServices = async () => {
    try {
      const res = await api.get("/services");

      // show only active services and limit to 6
      const activeServices = (res.data || [])
        .filter((service) => service.status === "active")
        .slice(0, 6);

      setServices(activeServices);
    } catch (error) {
      console.error("Failed to load footer services", error);
    }
  };

  fetchServices();
}, []);

  return (
    <footer className="bg-[#050b14] text-white pt-20">
      <PageContainer>
        <div className="">
          {/* TOP SECTION */}
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12 pb-16 border-b border-white/10">
            {/* LOGO + CONTACT */}
            <div className="space-y-6 flex flex-col items-start">
              <img
                src="/public/logo.png"
                alt="Autobox Logo"
                className="w-40 md:w-48 "
              />

              <div>
                <p className="text-blue-400 font-semibold">Call Us Anytime</p>
                <p className="text-md font-bold mt-2">+91 98765 43210</p>
              </div>

              <div>
                <p className="text-blue-400 font-semibold">
                  Visit Our Location
                </p>
                <p className="text-gray-400 mt-2">
                  17110 116th Ave SE Unit A <br />
                  Renton, WA 98058-5055
                </p>
              </div>
            </div>

            {/* SERVICES */}
            <div>
              <h3 className="text-lg font-bold mb-6">
                Our Services
                <span className="block w-12 h-[2px] bg-blue-500 mt-2"></span>
              </h3>

              <ul className="space-y-4 text-gray-400">
                {services.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => navigate("/services")}
                    className="group flex items-center gap-3 cursor-pointer
      hover:text-blue-400 transition-all duration-300 hover:-translate-y-1"
                  >
                    <span className="text-blue-500 font-bold tracking-[-3px] group-hover:translate-x-1 transition duration-300">
                      &gt;&gt;
                    </span>

                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* USEFUL LINKS */}
            <div>
              <h3 className="text-lg font-bold mb-6">
                Useful Links
                <span className="block w-12 h-[2px] bg-blue-500 mt-2"></span>
              </h3>

              <ul className="space-y-4 text-gray-400">
                {links.map((item, i) => (
                  <li
                    key={i}
                    onClick={() => navigate(item.path)}
                    className="group flex items-center gap-3 cursor-pointer
      hover:text-blue-400 transition-all duration-300 hover:-translate-y-1"
                  >
                    <span className="text-blue-500 font-bold tracking-[-3px] group-hover:translate-x-1 transition duration-300">
                      &gt;&gt;
                    </span>

                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* NEWSLETTER */}
            <div>
              <h3 className="text-lg font-bold mb-6">
                Newsletter
                <span className="block w-12 h-[2px] bg-blue-500 mt-2"></span>
              </h3>

              <p className="text-gray-400 mb-4">
                Subscribe to receive updates and special offers.
              </p>

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-5 py-4 rounded-lg bg-[#0f1a2b] border border-white/10 focus:border-blue-500 focus:outline-none"
              />

              <button
                className="mt-4 w-full py-4 rounded-lg font-semibold
              bg-gradient-to-r from-blue-600 to-cyan-400
              hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-blue-500/30"
              >
                Subscribe
              </button>
            </div>
          </div>

          {/* BOTTOM */}
          <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-400 text-sm">
              © 2026{" "}
              <span className="text-blue-500 font-semibold">AUTOBOX</span>. All
              rights reserved.
            </p>

            {/* SOCIAL ICONS */}
            <div className="flex justify-center items-center gap-4">
              {[Facebook, Instagram, Linkedin, Mail].map((Icon, i) => (
                <div
                  key={i}
                  className="w-10 h-10 flex items-center justify-center rounded-lg
        bg-[#0f1a2b] hover:bg-blue-600 transition cursor-pointer hover:-translate-y-1"
                >
                  <Icon size={18} />
                </div>
              ))}
            </div>

            {/* SMALL INFO */}
            <div className="flex gap-6 text-gray-400 text-sm">
              <span className="hover:text-blue-400 cursor-pointer transition">
                Privacy Policy
              </span>

              <span className="hover:text-blue-400 cursor-pointer transition">
                Terms of Use
              </span>
            </div>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
