import React, { useEffect, useState } from "react";
import api from "../api";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import ProductCard from "./ProductCard";
import PageContainer from "./PageContainer";

import "swiper/css";
import "swiper/css/navigation";

export default function ProductSwiper() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");

        const activeProducts = (res.data || []).filter(
          (p) => p.isActive === 1 || p.isActive === true,
        );

        setProducts(activeProducts);
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="bg-black py-15">
      <PageContainer>
        {/* TITLE */}
        <div className="flex items-center justify-center mb-10">
          <h2 className="text-white text-4xl font-extrabold text-center">
            Featured Products
          </h2>
        </div>

        <Swiper
          modules={[Autoplay]}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          loop={true}
          spaceBetween={17}
          slidesPerView={1}
          breakpoints={{
            0: { slidesPerView: 2 },
            640: { slidesPerView: 2 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
        >
          {products.map((product) => (
            <SwiperSlide key={product.docId} className=" mt-5 mb-5">
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </PageContainer>
    </section>
  );
}
