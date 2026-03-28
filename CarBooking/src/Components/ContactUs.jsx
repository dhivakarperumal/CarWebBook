import { Phone, MapPin, Mail, User, MessageSquare, Send } from "lucide-react";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";

export default function Contact() {
  return (
    <section className="relative bg-black text-white overflow-hidden">
      <PageHeader title="Contact Us" />

      <PageContainer>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full" />

        <div className="relative container mx-auto px-6 py-28">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            <div className="space-y-14">
              <div>
                <h2 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
                  Get In Touch
                </h2>

                <p className="text-gray-400 mt-6 max-w-md leading-relaxed">
                  Reach out to our team for bookings, support or any inquiries.
                  We deliver professional automotive care with precision.
                </p>
              </div>

              {[
                {
                  icon: <Phone />,
                  title: "Phone",
                  value: "+91 98765 43210",
                },
                {
                  icon: <MapPin />,
                  title: "Location",
                  value: "17110 116th Ave SE Unit A, Renton, WA",
                },
                {
                  icon: <Mail />,
                  title: "Email",
                  value: "info@autobox.com",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-5 group">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition">
                    {item.icon}
                  </div>

                  <div>
                    <p className="text-gray-400">{item.title}</p>
                    <p className="font-semibold text-lg">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl">
              <div className="grid lg:grid-cols-2 gap-8">
                {[
                  { icon: <User size={18} />, placeholder: "Your Name" },
                  { icon: <Mail size={18} />, placeholder: "Email Address" },
                  { icon: <Phone size={18} />, placeholder: "Phone Number" },
                  { icon: <MessageSquare size={18} />, placeholder: "Subject" },
                ].map((input, i) => (
                  <div key={i} className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {input.icon}
                    </span>
                    <input
                      type="text"
                      placeholder={input.placeholder}
                      className="w-full h-14 rounded-xl bg-[#0f1a2b] border border-white/10 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                    />
                  </div>
                ))}
              </div>

              <textarea
                placeholder="Enter your message"
                className="mt-8 w-full h-44 rounded-xl bg-[#0f1a2b] border border-white/10 px-6 py-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 resize-none transition"
              />

              <button
                className="group mt-10 w-full py-4 rounded-xl font-semibold text-lg
              bg-gradient-to-r from-blue-600 to-cyan-400
              flex items-center justify-center gap-3
              hover:scale-[1.03] transition-all duration-300 shadow-xl shadow-blue-500/40 relative overflow-hidden cursor-pointer"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition" />
                <Send size={18} />
                Send Message
              </button>
            </div>
          </div>
        </div>

        <div className="w-full h-[450px] border-t border-white/10">
          <iframe
            title="Google Map"
            src="https://www.google.com/maps?q=Renton,%20WA&output=embed"
            className="w-full h-full border-0 grayscale brightness-75 contrast-125"
            loading="lazy"
          />
        </div>
      </PageContainer>
    </section>
  );
}
