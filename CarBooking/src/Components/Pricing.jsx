import React, { useEffect, useState } from "react";
import api from "../api";
import PageContainer from "./PageContainer";
import PricingCard from "./PricingCard";
import PageHeader from "./PageHeader";

export default function Pricing() {
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
    <>
      <PageHeader title="Our Pricing" />

      <section className="relative py-16 sm:py-24 bg-black text-white overflow-hidden">

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/60" />

        <PageContainer className="px-2 sm:px-4 md:px-6">
          <div className="relative">

            {/* Pricing Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {packages.map((pkg) => (
                <PricingCard key={pkg.id} pkg={pkg} />
              ))}
            </div>

          </div>
        </PageContainer>
      </section>
    </>
  );
}