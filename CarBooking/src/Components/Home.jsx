import react from "react";
import Hero from "./Hero";
import AboutHome from "./AboutHome";
import ServiceSwiper from "./SeviceSwiper";
import PricingSwiper from "./PricingSwiper";
import BrandSwiper from "./BrandSwiper";
import Reviews from "./Reviews";

export default function Home() {

  return (
    <>
     <h1>
      <Hero />
      <AboutHome />
      <ServiceSwiper />
      <PricingSwiper />
      <BrandSwiper />
      <Reviews />
     </h1>
    </>
  );
}
