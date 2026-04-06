import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import api from "../api";
import ServiceCard from "./ServiceCard";
import PageContainer from "./PageContainer";

export default function ServiceSwiper() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get("/services");

        setServices(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return (
      <p className="text-center text-gray-400 py-24">Loading services...</p>
    );
  }

  if (!services.length) {
    return (
      <p className="text-center text-gray-400 py-24">No services available.</p>
    );
  }

  return (
    <section className="bg-black py-15">
      <PageContainer>
        <div>
          {/* TITLE */}
          <div className="text-center mb-16">
            <span className="text-sky-400 uppercase tracking-widest text-sm">
              Our Services
            </span>

            <h2 className="text-white text-4xl md:text-5xl font-extrabold mt-4">
              What We Offer
            </h2>
          </div>

          {/* SWIPER */}
          <Swiper
            className="service-swiper !overflow-hidden"
            modules={[Autoplay]}
            autoplay={{ delay: 3000 }}
            loop
            grabCursor
            spaceBetween={30}
            breakpoints={{
              0: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
          >
            {services.map((service) => (
              <SwiperSlide key={service.id} className="mt-5 mb-8">
                <ServiceCard service={service} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </PageContainer>
    </section>
  );
}
