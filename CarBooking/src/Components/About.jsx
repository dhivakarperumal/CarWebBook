import { Wrench, Settings, Users, Paintbrush } from "lucide-react";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import { useNavigate } from "react-router-dom";

export default function AboutStats() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="About " />
      <section className="relative py-24 bg-black text-white overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/about-bg.jpg')" }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/60" />

        <div className="relative container mx-auto px-6">
          <PageContainer>
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              {/* LEFT CONTENT */}
              <div className="space-y-8 max-w-xl">
                <span className="uppercase tracking-widest text-blue-400 text-sm">
                  Premium Auto Care
                </span>

                <h2 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight">
                  Our Care For Your Car <br /> Just Like You Do
                </h2>

                <p className="text-gray-400 leading-relaxed">
                  We understand the deep connection you have with your car.
                  That’s why we treat it with the same level of care and
                  precision.
                </p>

                <p className="text-gray-400 leading-relaxed">
                  From routine maintenance to intricate detailing, our experts
                  preserve your vehicle’s performance and appearance.
                </p>

                <button
                  onClick={() => navigate("/contact")}
                  className="mt-6 px-10 py-4 rounded-full font-semibold
  bg-gradient-to-r from-blue-600 to-cyan-400
  hover:scale-105 transition-all duration-300 shadow-lg shadow-blue-500/40 cursor-pointer"
                >
                  Contact Us →
                </button>
              </div>

              {/* RIGHT STATS */}
              <div className="grid sm:grid-cols-2 gap-10">
                {[
                  {
                    icon: <Settings size={22} />,
                    title: "Wheel Replacement",
                    value: "1000+",
                  },
                  {
                    icon: <Wrench size={22} />,
                    title: "Interior Remodeling",
                    value: "400+",
                  },
                  {
                    icon: <Paintbrush size={22} />,
                    title: "Color Correction",
                    value: "700+",
                  },
                  {
                    icon: <Users size={22} />,
                    title: "Years Experience",
                    value: "25+",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="relative p-8 rounded-2xl border border-white/10
                backdrop-blur-xl bg-white/5 shadow-2xl
                hover:-translate-y-2 transition-all duration-300 group"
                  >
                    {/* Glow */}
                    <div className="absolute inset-0 rounded-2xl bg-blue-500/10 opacity-0 group-hover:opacity-100 transition" />

                    {/* Icon */}
                    <div
                      className="absolute -top-6 left-6 bg-gradient-to-r from-blue-600 to-cyan-400
                  p-3 rounded-xl shadow-lg shadow-blue-500/40"
                    >
                      {item.icon}
                    </div>

                    <p className="text-gray-400 mt-8">{item.title}</p>
                    <h3 className="text-4xl font-bold mt-3">{item.value}</h3>
                  </div>
                ))}
              </div>
            </div>
          </PageContainer>
        </div>
      </section>
    </>
  );
}
