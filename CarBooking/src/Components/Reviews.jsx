import React, { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import api from "../api";
import {
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaGoogle,
} from "react-icons/fa";
import PageContainer from "./PageContainer";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await api.get("/reviews");

        // Filter for approved reviews (status === true or status === 1)
        const approvedReviews = res.data.filter((r) => r.status === 1 || r.status === true);

        console.log('[Reviews] Fetched:', res.data.length, 'reviews, Approved:', approvedReviews.length);
        setReviews(approvedReviews);
      } catch (error) {
        console.error("[Reviews] Error fetching reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) return null;

  if (!reviews.length) return null;

  return (
    <section className="bg-black py-15">
      <PageContainer>
        <h2 className="text-center text-4xl font-extrabold text-white mb-16">
          Customer Reviews
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_auto_2.1fr] gap-10 items-stretch">
          {/* LEFT SUMMARY */}
          <div
            className="rounded-3xl p-8 bg-[#2d3c4e]
          border-2 border-sky-400/30 shadow-[0_0_40px_rgba(56,189,248,0.25)]
          flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <FaGoogle className="text-xl text-sky-400" />
              <h3 className="text-xl font-semibold text-white">
                Google Reviews
              </h3>

              <span
                className="ml-auto px-4 py-1 text-xs rounded-full
              bg-green-500/20 text-green-400 font-semibold"
              >
                EXCELLENT
              </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-6xl font-bold text-white">5.0</h2>

              <div>
                <div className="flex text-sky-400">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} />
                  ))}
                </div>

                <p className="text-sm text-gray-400">
                  Based on {reviews.length} reviews
                </p>
              </div>
            </div>

            <button
              className="mt-auto w-full border border-sky-400/40
            rounded-full py-3 text-sky-400 font-medium
            hover:bg-sky-400 hover:text-black transition"
            >
              See All Reviews
            </button>
          </div>

          {/* DIVIDER */}
          <div className="hidden lg:flex justify-center">
            <div
              className="w-[2px] h-full rounded-full
            bg-gradient-to-b from-transparent via-sky-400 to-transparent opacity-60"
            />
          </div>

          {/* SLIDER */}
          <div className="relative w-full min-w-0">
            {/* LEFT ARROW */}
            <button
              ref={prevRef}
              className="hidden lg:flex absolute -left-6 top-1/2 -translate-y-1/2
              w-11 h-11 rounded-full bg-[#050b14]
              border border-sky-400 text-sky-400
              items-center justify-center shadow-lg z-20
              hover:scale-105 transition"
            >
              <FaChevronLeft />
            </button>

            {/* RIGHT ARROW */}
            <button
              ref={nextRef}
              className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2
              w-11 h-11 rounded-full bg-[#050b14]
              border border-sky-400 text-sky-400
              items-center justify-center shadow-lg z-20
              hover:scale-105 transition"
            >
              <FaChevronRight />
            </button>

            <Swiper
              modules={[Navigation, Autoplay]}
              loop
              spaceBetween={24}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              onSwiper={(swiper) => {
                setTimeout(() => {
                  swiper.params.navigation.prevEl = prevRef.current;
                  swiper.params.navigation.nextEl = nextRef.current;
                  swiper.navigation.init();
                  swiper.navigation.update();
                });
              }}
              breakpoints={{
                0: { slidesPerView: 1 },
                640: { slidesPerView: 2 },
                1280: { slidesPerView: 3 },
              }}
            >
              {reviews.map((r) => (
                <SwiperSlide key={r.id}>
                  <div
                    className="relative h-[280px] rounded-3xl p-8
  bg-[#050b14]/80 backdrop-blur-xl
  border border-sky-400 overflow-hidden mt-5 mb-5
  transition-all duration-300
  flex flex-col mr-0.5 min-h-0"
                  >


                    {/* HEADER */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden border border-sky-400 bg-slate-700 flex items-center justify-center">
                        {r.image ? (
                          <img
                            src={r.image}
                            alt={r.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = '<div className="w-10 h-10 bg-gradient-to-r from-sky-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-lg font-bold">' + r.name.charAt(0).toUpperCase() + '</div>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-sky-400/20 to-cyan-500/20 flex items-center justify-center text-sky-400 text-lg font-bold">
                            {r.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-semibold text-white">{r.name}</h4>
                        <div className="flex text-sky-400 text-sm">
                          {[...Array(r.rating || 5)].map((_, i) => (
                            <FaStar key={i} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* MESSAGE */}
                    <div className="flex-1 min-h-0">
                      <div className="h-full overflow-y-auto pr-2 no-scrollbar">
                        <p className="text-gray-300 italic leading-relaxed">
                          “{r.message}”
                        </p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
