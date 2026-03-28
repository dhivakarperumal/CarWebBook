import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import PricingCard from "./PricingCard";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

export default function PricingSwiper() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    const fetchPricingPackages = async () => {
      const snapshot = await getDocs(collection(db, "pricingPackages"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPackages(data);
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
          className="pricing-swiper !overflow-hidden "
          modules={[Autoplay]}
          autoplay={{ delay: 2500 }}
          loop
          spaceBetween={30}
          breakpoints={{
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
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
