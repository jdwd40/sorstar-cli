import { query, getClient } from '../utils/database.js';

export const getShips = async () => {
  const result = await query('SELECT * FROM ships ORDER BY cost');
  return result.rows;
};

export const createGame = async (userId, shipId) => {
  const startingPlanet = await query('SELECT id FROM planets WHERE name = $1', ['Terra Nova']);
  
  const result = await query(
    'INSERT INTO games (user_id, ship_id, current_planet_id, credits) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, shipId, startingPlanet.rows[0].id, 1000]
  );
  
  return result.rows[0];
};

export const getGameState = async (userId) => {
  const result = await query(`
    SELECT g.*, s.name as ship_name, s.cargo_capacity, p.name as planet_name, p.description as planet_description
    FROM games g
    JOIN ships s ON g.ship_id = s.id
    JOIN planets p ON g.current_planet_id = p.id
    WHERE g.user_id = $1
    ORDER BY g.created_at DESC
    LIMIT 1
  `, [userId]);
  
  return result.rows[0] || null;
};

export const getPlanets = async () => {
  const result = await query('SELECT * FROM planets ORDER BY name');
  return result.rows;
};

export const travelToPlanet = async (gameId, planetId) => {
  await query('UPDATE games SET current_planet_id = $1, turns_used = turns_used + 1 WHERE id = $2', [planetId, gameId]);
};

export const getMarketPrices = async (planetId) => {
  const result = await query(`
    SELECT c.name as commodity_name, m.buy_price, m.sell_price, m.stock, c.id as commodity_id
    FROM markets m
    JOIN commodities c ON m.commodity_id = c.id
    WHERE m.planet_id = $1
    ORDER BY c.name
  `, [planetId]);
  
  return result.rows;
};

export const getCargo = async (gameId) => {
  const result = await query(`
    SELECT c.name as commodity_name, ca.quantity, c.id as commodity_id
    FROM cargo ca
    JOIN commodities c ON ca.commodity_id = c.id
    WHERE ca.game_id = $1
    ORDER BY c.name
  `, [gameId]);
  
  return result.rows;
};

export const buyCommodity = async (gameId, commodityId, quantity, pricePerUnit) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const totalCost = quantity * pricePerUnit;
    
    await client.query('UPDATE games SET credits = credits - $1, turns_used = turns_used + 1 WHERE id = $2', [totalCost, gameId]);
    
    const existingCargo = await client.query('SELECT quantity FROM cargo WHERE game_id = $1 AND commodity_id = $2', [gameId, commodityId]);
    
    if (existingCargo.rows.length > 0) {
      await client.query('UPDATE cargo SET quantity = quantity + $1 WHERE game_id = $2 AND commodity_id = $3', [quantity, gameId, commodityId]);
    } else {
      await client.query('INSERT INTO cargo (game_id, commodity_id, quantity) VALUES ($1, $2, $3)', [gameId, commodityId, quantity]);
    }
    
    const gameResult = await client.query('SELECT current_planet_id, turns_used FROM games WHERE id = $1', [gameId]);
    
    await client.query(`
      INSERT INTO transactions (game_id, planet_id, commodity_id, transaction_type, quantity, price_per_unit, total_cost, turn_number)
      VALUES ($1, $2, $3, 'buy', $4, $5, $6, $7)
    `, [gameId, gameResult.rows[0].current_planet_id, commodityId, quantity, pricePerUnit, totalCost, gameResult.rows[0].turns_used]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const sellCommodity = async (gameId, commodityId, quantity, pricePerUnit) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const totalEarned = quantity * pricePerUnit;
    
    await client.query('UPDATE games SET credits = credits + $1, turns_used = turns_used + 1 WHERE id = $2', [totalEarned, gameId]);
    
    await client.query('UPDATE cargo SET quantity = quantity - $1 WHERE game_id = $2 AND commodity_id = $3', [quantity, gameId, commodityId]);
    
    await client.query('DELETE FROM cargo WHERE game_id = $1 AND quantity <= 0', [gameId]);
    
    const gameResult = await client.query('SELECT current_planet_id, turns_used FROM games WHERE id = $1', [gameId]);
    
    await client.query(`
      INSERT INTO transactions (game_id, planet_id, commodity_id, transaction_type, quantity, price_per_unit, total_cost, turn_number)
      VALUES ($1, $2, $3, 'sell', $4, $5, $6, $7)
    `, [gameId, gameResult.rows[0].current_planet_id, commodityId, quantity, pricePerUnit, totalEarned, gameResult.rows[0].turns_used]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};