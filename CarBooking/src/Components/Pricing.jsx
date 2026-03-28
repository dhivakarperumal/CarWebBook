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

      <section className="relative py-24 bg-black text-white overflow-hidden">

        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfAJ3Ai3tu58SWAJ2mK_EhozE-OIgQXcLXNg&s)",
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/60" />

        <PageContainer>
          <div className="relative">

            {/* Pricing Cards */}
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
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