import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import { useNavigate } from "react-router-dom";
import PageContainer from "./PageContainer";

const slides = [
  {
    image: "/images/Hero/Hero1.webp",
    title: "Contactless Car Wash",
    subtitle: "Modern Equipment",
  },
  {
    image: "/images/Hero/Hero2.avif",
    title: "Premium Detailing",
    subtitle: "Professional Care",
  },
  {
    image: "/images/Hero/Hero3.jpg",
    title: "Interior Cleaning",
    subtitle: "Perfect Finish",
  },
  {
    image: "/images/Hero/Hero4.jpg",
    title: "Exterior Polish",
    subtitle: "Shine Guaranteed",
  },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <>
      <section className="relative h-screen overflow-hidden bg-black">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          autoplay={{ delay: 6000 }}
          loop
          className="h-full"
        >
          {slides.map((slide, i) => (
            <SwiperSlide key={i}>
              <div className="relative h-screen w-full">
                {/* Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center hero-zoom"
                  style={{ backgroundImage: `url(${slide.image})` }}
                />

                {/* Premium Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/30" />

                {/* Content */}
                <div className="relative z-10 h-full flex items-center justify-center text-center">
                  <PageContainer>
                    <div className="">
                      <div className="max-w-3xl mx-auto text-white space-y-6 animate-fadeIn flex flex-col items-center">
                        <p className="text-gray-300 max-w-xl mx-auto">
                          {slide.subtitle}
                        </p>
                        {/* Accent Line */}
                        <div className="w-16 h-[2px] bg-blue-500 mb-6" />

                        <h1 className="text-4xl md:text-6xl xl:text-7xl font-bold leading-tight">
                          {slide.title}
                        </h1>

                        <p className="text-gray-300 max-w-md">
                          Experience next-generation car care with precision
                          detailing and modern automated systems.
                        </p>

                        {/* Premium Button */}
                        <button
                          onClick={() => navigate("/bookservice")}
                          className="mt-8 px-10 py-4 rounded-full font-semibold
                      bg-gradient-to-r from-blue-600 to-cyan-400
                      hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/40 cursor-pointer"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </PageContainer>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    </>
  );
}
