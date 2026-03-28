import React, { useEffect, useState } from "react";
import api from "../api";
import ServiceCard from "./ServiceCard";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";

const Services = () => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get("/services");
        setServices(res.data || []);
      } catch (err) {
        console.error("Failed to load services", err);
      }
    };

    fetchServices();
  }, []);

  return (
    <>
      <PageHeader title="Our Services" />

      <section className="bg-black py-24">
        <PageContainer>
          <div>
            {/* Grid */}
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  );
};

export default Services;