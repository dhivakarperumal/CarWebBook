import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import PageContainer from "./PageContainer";

const brands = [
  "/images/BMW.png",
  "/images/Dodge.png",
  "/images/Ford.png",
  "/images/Honda.png",
  "/images/Jaguar.png",
  "/images/Toyota.png",
];

export default function BrandSwiper() {
  return (
    <section className="bg-black py-15">
      <PageContainer>
      <div className="container mx-auto px-6">
        <h3 className="text-center text-gray-400 uppercase tracking-[0.3em] mb-10">
          Trusted Brands
        </h3>

        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          loop
          grabCursor
          spaceBetween={30}
          breakpoints={{
            0: { slidesPerView: 1 },
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
        >
          {brands.map((logo, i) => (
            <SwiperSlide key={i}>
              <div
                className="group relative mt-5 mb-10 h-32 flex items-center justify-center
bg-[#050b14]/80 backdrop-blur-xl rounded-2xl
border border-sky-400/20
overflow-hidden

shadow-[0_25px_80px_rgba(56,189,248,0.35)]
-translate-y-2

md:shadow-none md:translate-y-0
md:hover:border-sky-400/50
md:hover:-translate-y-2
md:hover:shadow-[0_25px_80px_rgba(56,189,248,0.35)]

transition-all duration-500"
              >
                <div
                  className="absolute inset-0 opacity-100 md:opacity-0 md:group-hover:opacity-100
bg-gradient-to-r from-sky-500/20 via-cyan-400 to-sky-500/20
transition duration-500"
                />

                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
          shadow-[inset_0_0_30px_rgba(56,189,248,0.4)]
          transition"
                />

                <img
                  src={logo}
                  className="relative z-10 max-h-16 object-contain
md:grayscale md:group-hover:grayscale-0
scale-110 md:scale-100 md:group-hover:scale-110
transition-all duration-500"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      </PageContainer>
    </section>
  );
}
