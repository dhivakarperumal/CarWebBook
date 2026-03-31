const db = require('./src/config/db.js');

const products = [
  {
    "id": "PR001",
    "name": "Brake Pad Set",
    "slug": "brake-pad-set",
    "brand": "Bosch",
    "description": "High-performance ceramic brake pads for smooth braking and durability.",
    "mrp": 2500,
    "offer": 10,
    "offerPrice": 2250,
    "warranty": { "available": true, "months": 6 },
    "returnPolicy": { "available": true, "days": 7 },
    "rating": "4.5",
    "variants": [
      { "sku": "BP-FRONT-001", "position": "Front", "material": "Ceramic", "stock": 50 },
      { "sku": "BP-REAR-001", "position": "Rear", "material": "Ceramic", "stock": 40 }
    ],
    "images": ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800"],
    "thumbnail": "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800",
    "tags": ["brake", "safety", "car parts"],
    "totalStock": 90,
    "isFeatured": true,
    "isActive": true
  },
  {
    "id": "PR002",
    "name": "Engine Oil 5W-30",
    "slug": "engine-oil-5w-30",
    "brand": "Castrol",
    "description": "Premium synthetic engine oil for enhanced engine life and performance.",
    "mrp": 1200,
    "offer": 15,
    "offerPrice": 1020,
    "warranty": { "available": false, "months": 0 },
    "returnPolicy": { "available": true, "days": 5 },
    "rating": "4.7",
    "variants": [
      { "sku": "EO-1L", "position": "1 Litre", "material": "Synthetic", "stock": 100 },
      { "sku": "EO-5L", "position": "5 Litre", "material": "Synthetic", "stock": 60 }
    ],
    "images": ["https://images.unsplash.com/photo-1635816369046-646b9eb936af?w=800"],
    "thumbnail": "https://images.unsplash.com/photo-1635816369046-646b9eb936af?w=800",
    "tags": ["engine oil", "lubricant"],
    "totalStock": 160,
    "isFeatured": true,
    "isActive": true
  },
  {
    "id": "PR003",
    "name": "Car Battery 12V",
    "slug": "car-battery-12v",
    "brand": "Amaron",
    "description": "Long-lasting car battery with high cranking power and reliability.",
    "mrp": 6500,
    "offer": 12,
    "offerPrice": 5720,
    "warranty": { "available": true, "months": 24 },
    "returnPolicy": { "available": false, "days": 0 },
    "rating": "4.6",
    "variants": [
      { "sku": "BAT-55AH", "position": "55Ah", "material": "Lead Acid", "stock": 30 },
      { "sku": "BAT-70AH", "position": "70Ah", "material": "Lead Acid", "stock": 20 }
    ],
    "images": ["https://images.unsplash.com/photo-1597750587848-18e3923c6f6d?w=800"],
    "thumbnail": "https://images.unsplash.com/photo-1597750587848-18e3923c6f6d?w=800",
    "tags": ["battery", "power"],
    "totalStock": 50,
    "isFeatured": false,
    "isActive": true
  },
  {
    "id": "PR004",
    "name": "Car Air Filter",
    "slug": "car-air-filter",
    "brand": "Mann Filter",
    "description": "High-quality air filter ensures clean airflow and better engine performance.",
    "mrp": 800,
    "offer": 20,
    "offerPrice": 640,
    "warranty": { "available": false, "months": 0 },
    "returnPolicy": { "available": true, "days": 10 },
    "rating": "4.3",
    "variants": [
      { "sku": "AF-STD", "position": "Standard", "material": "Fiber", "stock": 70 }
    ],
    "images": ["https://images.unsplash.com/photo-1599256621730-535171e28e50?w=800"],
    "thumbnail": "https://images.unsplash.com/photo-1599256621730-535171e28e50?w=800",
    "tags": ["filter", "engine"],
    "totalStock": 70,
    "isFeatured": false,
    "isActive": true
  }
];

const seed = async () => {
  try {
    for (const p of products) {
      const sql = `
        INSERT INTO products 
        (id, name, slug, brand, description, mrp, offer, offerPrice, tags, warranty, returnPolicy,
         isFeatured, isActive, rating, variants, images, thumbnail, totalStock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name=VALUES(name), slug=VALUES(slug), brand=VALUES(brand), description=VALUES(description),
        mrp=VALUES(mrp), offer=VALUES(offer), offerPrice=VALUES(offerPrice), tags=VALUES(tags),
        warranty=VALUES(warranty), returnPolicy=VALUES(returnPolicy), isFeatured=VALUES(isFeatured),
        isActive=VALUES(isActive), rating=VALUES(rating), variants=VALUES(variants),
        images=VALUES(images), thumbnail=VALUES(thumbnail), totalStock=VALUES(totalStock)
      `;
      
      await db.query(sql, [
        p.id, p.name, p.slug, p.brand, p.description,
        p.mrp, p.offer, p.offerPrice,
        JSON.stringify(p.tags),
        JSON.stringify(p.warranty),
        JSON.stringify(p.returnPolicy),
        p.isFeatured ? 1 : 0,
        p.isActive ? 1 : 0,
        p.rating,
        JSON.stringify(p.variants),
        JSON.stringify(p.images),
        p.thumbnail,
        p.totalStock
      ]);
      console.log(`✓ Product ${p.id} seeded/updated`);
    }
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('✗ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
