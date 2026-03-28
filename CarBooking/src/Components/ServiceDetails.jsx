import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import PageHeader from "./PageHeader";

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await api.get(`/services/${id}`);
        setService(res.data);
      } catch (error) {
        console.error("Failed to load service", error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-sky-400">
        Loading service details...
      </div>
    );
  }

  if (!service) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-gray-400">
        Service not found
      </div>
    );
  }

  return (
    <>
      <PageHeader title={service?.name || "Service Details"} />

      <section className="bg-black min-h-screen py-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* BACK BUTTON */}
          <button
            onClick={() => navigate(-1)}
            className="mb-10 text-xs font-bold tracking-[0.25em]
                     text-sky-400 border border-sky-400/40
                     px-4 py-2 rounded-md
                     transition-all duration-300
                     hover:bg-sky-400 hover:text-black
                     hover:shadow-[0_0_20px_rgba(56,189,248,0.6)]"
          >
            ← BACK
          </button>

          {/* HERO */}
          <div className="grid gap-10 lg:grid-cols-2 items-center mb-16">
            {/* IMAGE */}
            <div className="overflow-hidden rounded-xl border border-white/10">
              <img
                src={service.image}
                alt={service.name}
                className="w-full h-[360px] object-cover"
              />
            </div>

            {/* CONTENT */}
            <div>
              <h1 className="text-white text-4xl font-bold mb-6 tracking-wide">
                {service.name}
              </h1>

              <p className="text-gray-400 leading-relaxed mb-8">
                {service.description}
              </p>

              {/* FEATURES */}
              {service.features && (
                <ul className="space-y-3 mb-10">
                  {service.features.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-gray-300 text-sm"
                    >
                      <span className="w-2 h-2 bg-sky-400 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA */}
              <button
                onClick={() => navigate("/contact")}
                className="px-6 py-3 text-xs font-bold tracking-[0.25em]
                         text-black bg-sky-400 rounded-md
                         transition-all duration-300
                         hover:shadow-[0_0_25px_rgba(56,189,248,0.6)]"
              >
                BOOK THIS SERVICE
              </button>
            </div>
          </div>

          {/* EXTRA INFO */}
          <div className="grid gap-8 md:grid-cols-3">
            <InfoCard title="SERVICE TYPE" value={service.type || "Premium"} />
            <InfoCard
              title="DURATION"
              value={service.duration || "2 – 3 Hours"}
            />
            <InfoCard title="WARRANTY" value={service.warranty || "6 Months"} />
          </div>
        </div>
      </section>
    </>
  );
};

const InfoCard = ({ title, value }) => (
  <div
    className="bg-[#0b0f14] border border-white/10
               p-6 text-center
               hover:border-sky-400
               transition-all duration-300"
  >
    <h4 className="text-sky-400 text-xs font-bold tracking-[0.25em] mb-3">
      {title}
    </h4>
    <p className="text-white text-lg font-semibold">{value}</p>
  </div>
);

export default ServiceDetails;