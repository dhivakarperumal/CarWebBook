const db = require('./src/config/db.js');

const products = [
  {
    id: 'PR001',
    name: 'Bosch Brake Pad Set',
    slug: 'bosch-brake-pad-set',
    brand: 'Bosch',
    description: 'High-performance ceramic brake pads for superior stopping power and low dust. Compatible with most sedan and hatchback models.',
    mrp: 1800,
    offer: 15,
    offerPrice: 1530,
    tags: JSON.stringify(['brake', 'bosch', 'spare parts']),
    warranty: JSON.stringify({ available: true, months: 6 }),
    returnPolicy: JSON.stringify({ available: true, days: 7 }),
    isFeatured: 1,
    isActive: 1,
    rating: '4.5',
    variants: JSON.stringify([
      { sku: 'BPF-001', position: 'Front', material: 'Ceramic', stock: 20 },
      { sku: 'BPR-001', position: 'Rear', material: 'Ceramic', stock: 15 }
    ]),
    images: JSON.stringify([]),
    thumbnail: '',
    totalStock: 35
  },
  {
    id: 'PR002',
    name: 'Castrol GTX Engine Oil 5W-30',
    slug: 'castrol-gtx-engine-oil-5w30',
    brand: 'Castrol',
    description: 'Fully synthetic engine oil that provides excellent protection against wear and deposits. Suitable for petrol and diesel engines.',
    mrp: 950,
    offer: 10,
    offerPrice: 855,
    tags: JSON.stringify(['engine oil', 'castrol', 'lubricant']),
    warranty: JSON.stringify({ available: false, months: 0 }),
    returnPolicy: JSON.stringify({ available: false, days: 0 }),
    isFeatured: 0,
    isActive: 1,
    rating: '4.7',
    variants: JSON.stringify([
      { sku: 'OIL-1L', position: '1 Litre', material: 'Synthetic', stock: 50 },
      { sku: 'OIL-4L', position: '4 Litre', material: 'Synthetic', stock: 30 }
    ]),
    images: JSON.stringify([]),
    thumbnail: '',
    totalStock: 80
  }
];

const run = async () => {
  try {
    for (const p of products) {
      await db.query(
        `INSERT INTO products 
        (id, name, slug, brand, description, mrp, offer, offerPrice, tags, warranty, returnPolicy,
         isFeatured, isActive, rating, variants, images, thumbnail, totalStock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [
          p.id, p.name, p.slug, p.brand, p.description,
          p.mrp, p.offer, p.offerPrice, p.tags, p.warranty, p.returnPolicy,
          p.isFeatured, p.isActive, p.rating, p.variants, p.images, p.thumbnail, p.totalStock
        ]
      );
      console.log(`✅ Added: ${p.name}`);
    }
    console.log('Done! 2 products seeded.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
