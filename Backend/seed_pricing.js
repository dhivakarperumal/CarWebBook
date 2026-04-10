const db = require('./src/config/db');

const pricingPackages = [
  {
    title: "Basic Service",
    price: 299,
    place: "home",
    time: "1 Hour",
    features: [
      "General inspection",
      "Basic cleaning",
      "Minor adjustments",
      "Safety check",
      "Service report"
    ]
  },
  {
    title: "Standard Service",
    price: 499,
    place: "home",
    time: "2 Hours",
    features: [
      "Full inspection",
      "Deep cleaning",
      "Lubrication service",
      "Parts tightening",
      "Performance check"
    ]
  },
  {
    title: "Premium Service",
    price: 799,
    place: "home",
    time: "3 Hours",
    features: [
      "Complete servicing",
      "Advanced cleaning",
      "Parts replacement check",
      "Detailed diagnostics",
      "Final testing report"
    ]
  },
  {
    title: "Basic Shop Service",
    price: 199,
    place: "shop",
    time: "45 Minutes",
    features: [
      "Quick checkup",
      "Dust cleaning",
      "Basic fault check",
      "Minor fix",
      "Service summary"
    ]
  },
  {
    title: "Advanced Shop Service",
    price: 399,
    place: "shop",
    time: "1.5 Hours",
    features: [
      "Detailed inspection",
      "Cleaning + polishing",
      "Parts adjustment",
      "Issue diagnosis",
      "Testing before delivery"
    ]
  },
  {
    title: "Full Service Package",
    price: 999,
    place: "shop",
    time: "4 Hours",
    features: [
      "Complete overhaul",
      "All parts check",
      "Deep internal cleaning",
      "Performance optimization",
      "Final quality check"
    ]
  },
  {
    title: "Emergency Service",
    price: 599,
    place: "home",
    time: "1 Hour",
    features: [
      "Priority visit",
      "Instant diagnosis",
      "Quick repair",
      "Temporary fix support",
      "Follow-up recommendation"
    ]
  },
  {
    title: "Installation Service",
    price: 349,
    place: "home",
    time: "1 Hour",
    features: [
      "Product installation",
      "Proper setup",
      "Basic demo",
      "Usage guidance",
      "Safety instructions"
    ]
  },
  {
    title: "Repair Package",
    price: 699,
    place: "shop",
    time: "2 Hours",
    features: [
      "Fault diagnosis",
      "Repair work",
      "Parts replacement (if needed)",
      "Testing after repair",
      "Warranty guidance"
    ]
  },
  {
    title: "Annual Maintenance",
    price: 1999,
    place: "home",
    time: "Multiple Visits",
    features: [
      "4 free services/year",
      "Priority support",
      "Discount on spare parts",
      "Regular health check",
      "Service reminders"
    ]
  }
];

async function seed() {
  console.log("Seeding pricing packages...");
  for (const pkg of pricingPackages) {
    const sql = "INSERT INTO pricing_packages (title, price, place, time, features, created_at, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
    try {
      await db.query(sql, [pkg.title, pkg.price, pkg.place, pkg.time, JSON.stringify(pkg.features)]);
      console.log(`✅ Inserted: ${pkg.title}`);
    } catch (err) {
      console.error(`❌ Failed to insert: ${pkg.title}`, err.message);
    }
  }
  process.exit(0);
}

seed();
