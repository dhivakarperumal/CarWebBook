import React, { useEffect, useState } from "react";
import api from "../api";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import VehicleCard from "./VehicleCard";
import PageContainer from "./PageContainer";

import "swiper/css";

export default function VehicleSwiper({
  handleViewDetails,
  handleBookNow,
  bookingInProgress
}) {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/bikes");

      const published = (res.data || []).filter(
        (vehicle) =>
          vehicle.status === "published" || vehicle.status === "booked"
      );

      setVehicles(published);
    } catch (err) {
      console.error("Error fetching vehicles:", err);
    }
  };

  return (
    <section className="bg-black py-20">
      <PageContainer>

        {/* HEADING */}
        <div className="flex justify-center mb-12">
          <h2 className="text-white text-3xl md:text-4xl font-bold tracking-wide">
            Featured Vehicles
          </h2>
        </div>

        <Swiper
          modules={[Autoplay]}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false
          }}
          loop={vehicles.length > 3}
          spaceBetween={25}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 }
          }}
        >
          {vehicles.map((vehicle) => (
            <SwiperSlide key={vehicle.id} className="mt-5 mb-5">
              <VehicleCard
                vehicle={vehicle}
                handleViewDetails={handleViewDetails}
                handleBookNow={handleBookNow}
                bookingInProgress={bookingInProgress}
              />
            </SwiperSlide>
          ))}
        </Swiper>

      </PageContainer>
    </section>
  );
}