import React, { useEffect, useState } from "react";
import api from "../api";
import PricingCard from "./PricingCard";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

export default function PricingSwiper() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    const fetchPricingPackages = async () => {
      try {
        const res = await api.get("/pricing_packages");
        setPackages(res.data || []);
      } catch (err) {
        console.error("Failed to load pricing packages", err);
      }
    };

    fetchPricingPackages();
  }, []);

  return (
    <section className="py-15 bg-black text-white">
      <div className="container mx-auto px-6">
        {/* Heading */}
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold">Our Pricing Plans</h2>
        </div>

        <Swiper
          className="pricing-swiper !overflow-hidden"
          modules={[Autoplay]}
          autoplay={{ delay: 2500 }}
          loop
          spaceBetween={17}
          breakpoints={{
            0: { slidesPerView: 2 },
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
        >
          {packages.map((pkg) => (
            <SwiperSlide key={pkg.id} className="!flex !h-auto">
              <div className="flex flex-col w-full h-full">
                <PricingCard pkg={pkg} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
