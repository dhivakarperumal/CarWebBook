const db = require('./src/config/db');

const products = [
  {
    id: "PR001",
    name: "Brake Pad Set",
    slug: "brake-pad-set",
    brand: "Bosch",
    description: "High performance brake pad set for smooth braking.",
    mrp: 1500,
    offer: 20,
    offerPrice: 1200,
    warranty: { available: true, months: 6 },
    returnPolicy: { available: true, days: 7 },
    rating: "4.5",
    variants: [
      { sku: "BP-FRONT", position: "Front", material: "Ceramic", stock: 20 },
      { sku: "BP-REAR", position: "Rear", material: "Ceramic", stock: 15 }
    ],
    images: [],
    thumbnail: "",
    tags: ["brake", "safety"],
    totalStock: 35,
    isFeatured: true,
    isActive: true
  },
  {
    id: "PR002",
    name: "Engine Oil 1L",
    slug: "engine-oil-1l",
    brand: "Castrol",
    description: "Premium engine oil for better engine life.",
    mrp: 900,
    offer: 10,
    offerPrice: 810,
    warranty: { available: false, months: 0 },
    returnPolicy: { available: true, days: 5 },
    rating: "4.3",
    variants: [
      { sku: "EO-1L", position: "Universal", material: "Liquid", stock: 50 }
    ],
    images: [],
    thumbnail: "",
    tags: ["engine", "oil"],
    totalStock: 50,
    isFeatured: false,
    isActive: true
  },
  {
    id: "PR003",
    name: "Car Battery 12V",
    slug: "car-battery-12v",
    brand: "Amaron",
    description: "Long-lasting battery with high performance.",
    mrp: 5000,
    offer: 15,
    offerPrice: 4250,
    warranty: { available: true, months: 24 },
    returnPolicy: { available: true, days: 10 },
    rating: "4.6",
    variants: [
      { sku: "BAT-12V", position: "Engine", material: "Lead Acid", stock: 10 }
    ],
    images: [],
    thumbnail: "",
    tags: ["battery"],
    totalStock: 10,
    isFeatured: true,
    isActive: true
  },
  {
    id: "PR004",
    name: "Air Filter",
    slug: "air-filter",
    brand: "Mann",
    description: "Improves airflow and engine efficiency.",
    mrp: 600,
    offer: 12,
    offerPrice: 528,
    warranty: { available: false, months: 0 },
    returnPolicy: { available: true, days: 5 },
    rating: "4.2",
    variants: [
      { sku: "AF-STD", position: "Engine", material: "Fiber", stock: 30 }
    ],
    images: [],
    thumbnail: "",
    tags: ["filter"],
    totalStock: 30,
    isFeatured: false,
    isActive: true
  },
  {
    id: "PR005",
    name: "Spark Plug",
    slug: "spark-plug",
    brand: "NGK",
    description: "Reliable ignition with high durability.",
    mrp: 300,
    offer: 5,
    offerPrice: 285,
    warranty: { available: false, months: 0 },
    returnPolicy: { available: true, days: 5 },
    rating: "4.4",
    variants: [
      { sku: "SP-01", position: "Engine", material: "Nickel", stock: 40 }
    ],
    images: [],
    thumbnail: "",
    tags: ["engine"],
    totalStock: 40,
    isFeatured: false,
    isActive: true
  },
  {
    id: "PR006",
    name: "Headlight Bulb",
    slug: "headlight-bulb",
    brand: "Philips",
    description: "Bright and long-lasting headlight bulb.",
    mrp: 700,
    offer: 18,
    offerPrice: 574,
    warranty: { available: true, months: 3 },
    returnPolicy: { available: true, days: 5 },
    rating: "4.1",
    variants: [
      { sku: "HL-LOW", position: "Low Beam", material: "Halogen", stock: 25 }
    ],
    images: [],
    thumbnail: "",
    tags: ["light"],
    totalStock: 25,
    isFeatured: false,
    isActive: true
  },
  {
    id: "PR007",
    name: "Clutch Plate",
    slug: "clutch-plate",
    brand: "Valeo",
    description: "Smooth clutch operation and durability.",
    mrp: 2500,
    offer: 10,
    offerPrice: 2250,
    warranty: { available: true, months: 12 },
    returnPolicy: { available: false, days: 0 },
    rating: "4.5",
    variants: [
      { sku: "CP-STD", position: "Transmission", material: "Metal", stock: 12 }
    ],
    images: [],
    thumbnail: "",
    tags: ["clutch"],
    totalStock: 12,
    isFeatured: true,
    isActive: true
  },
  {
    id: "PR008",
    name: "Radiator Coolant",
    slug: "radiator-coolant",
    brand: "Prestone",
    description: "Prevents overheating and corrosion.",
    mrp: 800,
    offer: 15,
    offerPrice: 680,
    warranty: { available: false, months: 0 },
    returnPolicy: { available: true, days: 5 },
    rating: "4.3",
    variants: [
      { sku: "RC-1L", position: "Cooling", material: "Liquid", stock: 35 }
    ],
    images: [],
    thumbnail: "",
    tags: ["coolant"],
    totalStock: 35,
    isFeatured: false,
    isActive: true
  },
  {
    id: "PR009",
    name: "Wiper Blade",
    slug: "wiper-blade",
    brand: "Michelin",
    description: "Clear visibility during rain.",
    mrp: 400,
    offer: 10,
    offerPrice: 360,
    warranty: { available: false, months: 0 },
    returnPolicy: { available: true, days: 5 },
    rating: "4.2",
    variants: [
      { sku: "WB-STD", position: "Front", material: "Rubber", stock: 45 }
    ],
    images: [],
    thumbnail: "",
    tags: ["wiper"],
    totalStock: 45,
    isFeatured: false,
    isActive: true
  },
  {
    id: "PR010",
    name: "Car Horn",
    slug: "car-horn",
    brand: "Hella",
    description: "Loud and durable horn for safety.",
    mrp: 1200,
    offer: 20,
    offerPrice: 960,
    warranty: { available: true, months: 6 },
    returnPolicy: { available: true, days: 7 },
    rating: "4.4",
    variants: [
      { sku: "CH-STD", position: "Front", material: "Metal", stock: 18 }
    ],
    images: [],
    thumbnail: "",
    tags: ["horn"],
    totalStock: 18,
    isFeatured: true,
    isActive: true
  }
];

async function seed() {
  console.log("Seeding products...");
  for (const p of products) {
    const sql = `
      INSERT INTO products 
      (id, name, slug, brand, description, mrp, offer, offerPrice, tags, warranty, returnPolicy,
       isFeatured, isActive, rating, variants, images, thumbnail, totalStock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      p.id, p.name, p.slug, p.brand, p.description,
      p.mrp, p.offer, p.offerPrice,
      JSON.stringify(p.tags || []),
      JSON.stringify(p.warranty || {}),
      JSON.stringify(p.returnPolicy || {}),
      p.isFeatured ? 1 : 0,
      p.isActive ? 1 : 0,
      p.rating || "0",
      JSON.stringify(p.variants || []),
      JSON.stringify(p.images || []),
      p.thumbnail || "",
      p.totalStock || 0
    ];
    try {
      await db.query(sql, params);
      console.log(`✅ Inserted: ${p.name}`);
    } catch (err) {
      console.error(`❌ Failed to insert: ${p.name}`, err.message);
    }
  }
  process.exit(0);
}

seed();
