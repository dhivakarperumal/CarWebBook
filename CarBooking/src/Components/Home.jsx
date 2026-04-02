import react from "react";
import Hero from "./Hero";
import AboutHome from "./AboutHome";
import ServiceSwiper from "./SeviceSwiper";
import PricingSwiper from "./PricingSwiper";
import BrandSwiper from "./BrandSwiper";
import Reviews from "./Reviews";
import BookingBanner from "./BookingBanner";

export default function Home() {

  return (
    <>
     <h1>
      <Hero />
      <AboutHome />
      <ServiceSwiper />
      <BookingBanner />
      <PricingSwiper />
      <BrandSwiper />
      <Reviews />
     </h1>
    </>
  );
}
