import { Ship } from '../models/Ship.js';
import { Game } from '../models/Game.js';
import { Planet } from '../models/Planet.js';

export const getShips = async () => {
  const ships = await Ship.findAll();
  return ships.map(ship => ship.toJSON());
};

export const createGame = async (userId, shipId) => {
  const game = await Game.create(userId, shipId);
  return game.toJSON();
};

export const getGameState = async (userId) => {
  const game = await Game.findByUserId(userId);
  return game ? game.toJSON() : null;
};

export const getPlanets = async () => {
  const planets = await Planet.findAll();
  return planets.map(planet => planet.toJSON());
};

export const travelToPlanet = async (gameId, planetId) => {
  const game = await Game.findById(gameId);
  if (game) {
    await game.travelToPlanet(planetId);
  }
};

export const getMarketPrices = async (planetId) => {
  const planet = await Planet.findById(planetId);
  return planet ? await planet.getMarketPrices() : [];
};

export const getCargo = async (gameId) => {
  const game = await Game.findById(gameId);
  return game ? await game.getCargo() : [];
};

export const buyCommodity = async (gameId, commodityId, quantity, pricePerUnit) => {
  const game = await Game.findById(gameId);
  if (game) {
    await game.buyCommodity(commodityId, quantity, pricePerUnit);
  }
};

export const sellCommodity = async (gameId, commodityId, quantity, pricePerUnit) => {
  const game = await Game.findById(gameId);
  if (game) {
    await game.sellCommodity(commodityId, quantity, pricePerUnit);
  }
};