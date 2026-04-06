import react from "react";
import Hero from "./Hero";
import AboutHome from "./AboutHome";
import ServiceSwiper from "./SeviceSwiper";
import PricingSwiper from "./PricingSwiper";
import BrandSwiper from "./BrandSwiper";
import Reviews from "./Reviews";
import BookingBanner from "./BookingBanner";
import ProductSwiper from "./ProductSwiper";
import VehicleSwiper from "./VehicleSwiper";

export default function Home() {

  return (
    <>
     <h1>
      <Hero />
      <AboutHome />
      <ServiceSwiper />
      <BookingBanner />
      <PricingSwiper />
      <ProductSwiper />
      <VehicleSwiper />
      <BrandSwiper />
      <Reviews />
     </h1>
    </>
  );
}
