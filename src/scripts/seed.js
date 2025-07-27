import { query } from '../utils/database.js';

const seedData = async () => {
  try {
    await query('DELETE FROM transactions');
    await query('DELETE FROM cargo');
    await query('DELETE FROM games');
    await query('DELETE FROM markets');
    await query('DELETE FROM commodities');
    await query('DELETE FROM planets');
    await query('DELETE FROM ships');

    const ships = [
      { name: 'Cargo Runner', cargo_capacity: 50, cost: 5000, description: 'A basic freight ship with modest cargo space' },
      { name: 'Merchant Vessel', cargo_capacity: 100, cost: 12000, description: 'A reliable trading ship with good cargo capacity' },
      { name: 'Heavy Freighter', cargo_capacity: 200, cost: 25000, description: 'A massive cargo ship for serious traders' },
      { name: 'Scout Ship', cargo_capacity: 25, cost: 3000, description: 'A fast, nimble ship with limited cargo space' }
    ];

    for (const ship of ships) {
      await query(
        'INSERT INTO ships (name, cargo_capacity, cost, description) VALUES ($1, $2, $3, $4)',
        [ship.name, ship.cargo_capacity, ship.cost, ship.description]
      );
    }

    const planets = [
      { name: 'Terra Nova', description: 'A lush agricultural world known for food production', x_coord: 0, y_coord: 0 },
      { name: 'Minerva Prime', description: 'A heavily industrialized mining planet', x_coord: 5, y_coord: 3 },
      { name: 'Crystal Bay', description: 'A planet rich in rare crystals and minerals', x_coord: -3, y_coord: 7 },
      { name: 'Gas Giant Station', description: 'An orbital station around a gas giant', x_coord: 8, y_coord: -2 },
      { name: 'Tech Hub Alpha', description: 'A high-tech research and manufacturing center', x_coord: -6, y_coord: -4 },
      { name: 'Water World', description: 'An ocean planet with vast water reserves', x_coord: 2, y_coord: -8 },
      { name: 'Energy Core', description: 'A planet dedicated to energy production and storage', x_coord: 10, y_coord: 5 }
    ];

    for (const planet of planets) {
      await query(
        'INSERT INTO planets (name, description, x_coord, y_coord) VALUES ($1, $2, $3, $4)',
        [planet.name, planet.description, planet.x_coord, planet.y_coord]
      );
    }

    const commodities = [
      { name: 'Metals', base_price: 100 },
      { name: 'Rare Minerals', base_price: 500 },
      { name: 'Gas', base_price: 80 },
      { name: 'Crystals', base_price: 300 },
      { name: 'Water', base_price: 50 },
      { name: 'Energy Cells', base_price: 200 },
      { name: 'Synthetic Fibers', base_price: 150 },
      { name: 'Food', base_price: 60 },
      { name: 'BioMatter', base_price: 400 },
      { name: 'Plasma Fuel', base_price: 250 },
      { name: 'Titanium', base_price: 600 },
      { name: 'Neutronium', base_price: 1200 },
      { name: 'Antimatter', base_price: 2000 },
      { name: 'Dark Matter', base_price: 5000 },
      { name: 'Silicates', base_price: 120 }
    ];

    for (const commodity of commodities) {
      await query(
        'INSERT INTO commodities (name, base_price, description) VALUES ($1, $2, $3)',
        [commodity.name, commodity.base_price, `Tradable commodity: ${commodity.name}`]
      );
    }

    const planetResult = await query('SELECT id, name FROM planets');
    const commodityResult = await query('SELECT id, name, base_price FROM commodities');

    const planetSpecialties = {
      'Terra Nova': ['Food', 'Water', 'BioMatter'],
      'Minerva Prime': ['Metals', 'Titanium', 'Rare Minerals'],
      'Crystal Bay': ['Crystals', 'Rare Minerals', 'Dark Matter'],
      'Gas Giant Station': ['Gas', 'Plasma Fuel', 'Energy Cells'],
      'Tech Hub Alpha': ['Energy Cells', 'Synthetic Fibers', 'Silicates', 'Antimatter'],
      'Water World': ['Water', 'BioMatter', 'Food'],
      'Energy Core': ['Energy Cells', 'Plasma Fuel', 'Neutronium', 'Antimatter']
    };

    for (const planet of planetResult.rows) {
      for (const commodity of commodityResult.rows) {
        const isSpecialty = planetSpecialties[planet.name]?.includes(commodity.name);
        
        const basePrice = commodity.base_price;
        let buyPrice, sellPrice;
        
        if (isSpecialty) {
          buyPrice = Math.floor(basePrice * 0.7);
          sellPrice = Math.floor(basePrice * 0.8);
        } else {
          buyPrice = Math.floor(basePrice * (0.9 + Math.random() * 0.4));
          sellPrice = Math.floor(buyPrice * 1.2);
        }
        
        await query(
          'INSERT INTO markets (planet_id, commodity_id, buy_price, sell_price, stock) VALUES ($1, $2, $3, $4, $5)',
          [planet.id, commodity.id, buyPrice, sellPrice, 100 + Math.floor(Math.random() * 200)]
        );
      }
    }

    console.log('Database seeded successfully!');
    console.log('Ships, planets, commodities, and markets have been populated.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedData();