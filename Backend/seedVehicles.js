const db = require('./src/config/db');

const vehicles = [
  // 🚲 Bike 1
  {
    title: "Yamaha R15 V4 2022",
    brand: "Yamaha",
    model: "R15 V4",
    variant: "Racing Blue",
    yom: 2022,
    engine_cc: 155,
    mileage: 45,
    fuel_type: "Petrol",
    km_driven: 12000,
    owners: 1,
    color: "Blue",
    city: "Chennai",
    pincode: "600001",
    expected_price: 145000,
    type: "Bike",
    status: "published",
    images: JSON.stringify({ front: "https://images.unsplash.com/photo-1622360814631-ec7b4f51e041?q=80&w=800" })
  },

  // 🚲 Bike 2
  {
    title: "Royal Enfield Classic 350 2021",
    brand: "Royal Enfield",
    model: "Classic 350",
    variant: "Chrome Red",
    yom: 2021,
    engine_cc: 349,
    mileage: 35,
    fuel_type: "Petrol",
    km_driven: 18000,
    owners: 1,
    color: "Red",
    city: "Chennai",
    pincode: "600002",
    expected_price: 165000,
    type: "Bike",
    status: "published",
    images: JSON.stringify({ front: "https://images.unsplash.com/photo-1620067675171-889508537c3f?q=80&w=800" })
  },

  // 🚗 Car 1
  {
    title: "Hyundai i20 Sportz 2020",
    brand: "Hyundai",
    model: "i20",
    variant: "Sportz",
    yom: 2020,
    engine_cc: 1197,
    mileage: 18,
    fuel_type: "Petrol",
    km_driven: 25000,
    owners: 1,
    color: "White",
    city: "Chennai",
    pincode: "600003",
    expected_price: 650000,
    type: "Car",
    status: "published",
    images: JSON.stringify({ front: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800" })
  },

  // 🚗 Car 2
  {
    title: "Toyota Innova Crysta 2019",
    brand: "Toyota",
    model: "Innova Crysta",
    variant: "ZX",
    yom: 2019,
    engine_cc: 2393,
    mileage: 14,
    fuel_type: "Diesel",
    km_driven: 60000,
    owners: 1,
    color: "Silver",
    city: "Chennai",
    pincode: "600004",
    expected_price: 1450000,
    type: "Car",
    status: "published",
    images: JSON.stringify({ front: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800" })
  },

  // 🚗 Car 3
  {
    title: "Tata Nexon XZ+ 2021",
    brand: "Tata",
    model: "Nexon",
    variant: "XZ+",
    yom: 2021,
    engine_cc: 1199,
    mileage: 17,
    fuel_type: "Petrol",
    km_driven: 18000,
    owners: 1,
    color: "Blue",
    city: "Chennai",
    pincode: "600005",
    expected_price: 850000,
    type: "Car",
    status: "published",
    images: JSON.stringify({ front: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800" })
  },

  // 🚗 Car 4
  {
    title: "Maruti Suzuki Swift VXI 2018",
    brand: "Maruti Suzuki",
    model: "Swift",
    variant: "VXI",
    yom: 2018,
    engine_cc: 1197,
    mileage: 20,
    fuel_type: "Petrol",
    km_driven: 40000,
    owners: 2,
    color: "Red",
    city: "Chennai",
    pincode: "600006",
    expected_price: 500000,
    type: "Car",
    status: "published",
    images: JSON.stringify({ front: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800" })
  }
];

async function seed() {
  try {
    console.log('Clearing bikes table...');
    await db.query('TRUNCATE TABLE bikes');

    for (const vehicle of vehicles) {
       await db.query('INSERT INTO bikes SET ?', [vehicle]);
       console.log(`✓ Added: ${vehicle.title}`);
    }
    console.log('--- All vehicles seeded successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding vehicles:', error.message);
    process.exit(1);
  }
}

seed();
