import React from "react";

export default function PrivacyPolicy() {
  return (
    <section className="max-w-6xl mx-auto p-6 md:p-10 text-gray-900">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600">
            Last updated: May 21, 2026.
          </p>
        </div>

        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Welcome to AUTOBOX. We value your privacy and are committed to protecting the personal information you share with us.
            This policy explains what information we collect, how we use it, and the choices you have.
          </p>

          <h2 className="text-2xl font-semibold text-blue-900">Information We Collect</h2>
          <p>
            We may collect personal information such as your name, email address, phone number, and booking details when you use our
            services, register an account, or contact us. We also collect non-personal information through cookies and analytics
            tools to improve website performance and your browsing experience.
          </p>

          <h2 className="text-2xl font-semibold text-blue-900">How We Use Your Information</h2>
          <p>
            Your information helps us provide, maintain, and improve our services. We may use it to process bookings, respond to
            inquiries, send updates, and personalize your experience. We do not sell your personal information to third parties.
          </p>

          <h2 className="text-2xl font-semibold text-blue-900">Data Security</h2>
          <p>
            We protect your information using appropriate safeguards and follow industry-standard practices to prevent unauthorized
            access. However, no system is completely secure, and we cannot guarantee absolute protection.
          </p>

          <h2 className="text-2xl font-semibold text-blue-900">Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. When we make changes, we will revise the "Last updated" date above.
            Continued use of our website after changes are posted means you accept the updated policy.
          </p>

          <h2 className="text-2xl font-semibold text-blue-900">Contact Us</h2>
          <p>
            If you have questions about this privacy policy or how we handle your information, please contact us through the website.
          </p>
        </div>
      </div>
    </section>
  );
}
