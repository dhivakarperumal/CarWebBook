const db = require('./src/config/db');

const moreProducts = [
  {
    id: "PR011",
    name: "Fuel Pump",
    slug: "fuel-pump",
    brand: "Delphi",
    description: "High efficiency fuel pump for smooth engine performance.",
    mrp: 3500,
    offer: 12,
    offerPrice: 3080,
    warranty: { available: true, months: 12 },
    returnPolicy: { available: true, days: 7 },
    rating: "4.4",
    variants: [
      { sku: "FP-STD", position: "Engine", material: "Metal", stock: 14 }
    ],
    images: [],
    thumbnail: "",
    tags: ["fuel", "engine"],
    totalStock: 14,
    isFeatured: false,
    isActive: true
  },
  {
    id: "PR012",
    name: "Timing Belt",
    slug: "timing-belt",
    brand: "Gates",
    description: "Durable timing belt for precise engine timing.",
    mrp: 2200,
    offer: 10,
    offerPrice: 1980,
    warranty: { available: true, months: 18 },
    returnPolicy: { available: false, days: 0 },
    rating: "4.5",
    variants: [
      { sku: "TB-STD", position: "Engine", material: "Rubber", stock: 20 }
    ],
    images: [],
    thumbnail: "",
    tags: ["belt", "engine"],
    totalStock: 20,
    isFeatured: true,
    isActive: true
  },
  {
    id: "PR013",
    name: "Side Mirror",
    slug: "side-mirror",
    brand: "Uno Minda",
    description: "High quality side mirror with clear visibility.",
    mrp: 1500,
    offer: 15,
    offerPrice: 1275,
    warranty: { available: true, months: 6 },
    returnPolicy: { available: true, days: 5 },
    rating: "4.2",
    variants: [
      { sku: "SM-LEFT", position: "Left", material: "Plastic", stock: 10 },
      { sku: "SM-RIGHT", position: "Right", material: "Plastic", stock: 10 }
    ],
    images: [],
    thumbnail: "",
    tags: ["mirror"],
    totalStock: 20,
    isFeatured: false,
    isActive: true
  },
  {
    id: "PR014",
    name: "Disc Brake Rotor",
    slug: "disc-brake-rotor",
    brand: "Brembo",
    description: "Premium brake rotor for high performance braking.",
    mrp: 4000,
    offer: 20,
    offerPrice: 3200,
    warranty: { available: true, months: 12 },
    returnPolicy: { available: true, days: 7 },
    rating: "4.7",
    variants: [
      { sku: "DB-FRONT", position: "Front", material: "Cast Iron", stock: 8 }
    ],
    images: [],
    thumbnail: "",
    tags: ["brake"],
    totalStock: 8,
    isFeatured: true,
    isActive: true
  },
  {
    id: "PR015",
    name: "Shock Absorber",
    slug: "shock-absorber",
    brand: "Monroe",
    description: "Smooth ride with high durability shock absorber.",
    mrp: 2800,
    offer: 10,
    offerPrice: 2520,
    warranty: { available: true, months: 12 },
    returnPolicy: { available: false, days: 0 },
    rating: "4.5",
    variants: [
      { sku: "SA-FRONT", position: "Front", material: "Hydraulic", stock: 12 },
      { sku: "SA-REAR", position: "Rear", material: "Hydraulic", stock: 12 }
    ],
    images: [],
    thumbnail: "",
    tags: ["suspension"],
    totalStock: 24,
    isFeatured: false,
    isActive: true
  }
];

async function seed() {
  console.log("Seeding more products...");
  for (const p of moreProducts) {
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
