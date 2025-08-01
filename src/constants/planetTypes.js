export const PLANET_TYPES = {
  FOREST: 'Forest',
  JUNGLE: 'Jungle',
  INDUSTRIAL: 'Industrial', 
  CITY: 'City',
  MINING: 'Mining',
  AGRICULTURAL: 'Agricultural',
  COLONY: 'Colony',
  TRADE_HUB: 'Trade Hub',
  RESEARCH: 'Research',
  MILITARY: 'Military'
};

export const PLANET_TYPE_LIST = Object.values(PLANET_TYPES);

export const ACTIVITY_TO_PLANET_TYPES = {
  'trading': [PLANET_TYPES.TRADE_HUB, PLANET_TYPES.CITY, PLANET_TYPES.INDUSTRIAL],
  'mining': [PLANET_TYPES.MINING, PLANET_TYPES.INDUSTRIAL],
  'research': [PLANET_TYPES.RESEARCH, PLANET_TYPES.CITY],
  'agriculture': [PLANET_TYPES.AGRICULTURAL, PLANET_TYPES.COLONY]
};

export const PLANET_TYPE_DESCRIPTIONS = {
  [PLANET_TYPES.FOREST]: 'Dense woodlands cover this planet, with towering trees and rich biodiversity.',
  [PLANET_TYPES.JUNGLE]: 'Thick tropical vegetation dominates this humid world with exotic wildlife.',
  [PLANET_TYPES.INDUSTRIAL]: 'Massive factories and manufacturing facilities define this industrial powerhouse.',
  [PLANET_TYPES.CITY]: 'Urban sprawl extends across continents on this heavily populated metropolitan world.',
  [PLANET_TYPES.MINING]: 'Rich mineral deposits make this a vital source of raw materials and ore.',
  [PLANET_TYPES.AGRICULTURAL]: 'Fertile farmlands and agricultural facilities feed nearby systems.',
  [PLANET_TYPES.COLONY]: 'A growing settlement representing the expansion of civilization into new frontiers.',
  [PLANET_TYPES.TRADE_HUB]: 'Bustling spaceports and markets make this a center of interstellar commerce.',
  [PLANET_TYPES.RESEARCH]: 'Advanced laboratories and research facilities push the boundaries of science.',
  [PLANET_TYPES.MILITARY]: 'Strategic defense installations and military bases secure this sector.'
};