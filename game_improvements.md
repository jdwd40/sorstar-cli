Fuel system, player uses fuel and time (game turns) when they travel to planets
Players can buy fuel from every planet - at differnt prices

Most planets are near to each other within aprox 6 units/turns

two planets are distant planets they are far out 10 turns/units - prices are cheaper there

I'll read the game improvements file to understand all the additions you want to make, then create a comprehensive todo list.
Read file: game_improvements.md

Based on your game improvements document, here's a high-level todo list for implementing these new features:

## High-Level Todo List for Game Improvements

### 1. **Fuel & Travel System**
- [ ] Add fuel property to player character/inventory
- [ ] Implement fuel consumption mechanics during planet travel
- [ ] Create turn-based time system that advances with travel
- [ ] Add fuel capacity limits and current fuel tracking
- [ ] Implement travel restrictions when insufficient fuel

### 2. **Planet Distance & Geography System**
- [ ] Define planet positioning/distance system
- [ ] Set up most planets at ~6 units/turns distance from each other
- [ ] Create two special "distant planets" at 10 units/turns distance
- [ ] Implement travel time calculation based on distance
- [ ] Add travel confirmation UI showing fuel cost and time required

### 3. **Planet Classification System**
- [ ] Create planet type enum/system (Forest, Jungle, Industrial, City, etc.)
- [ ] Assign planet types to existing planets
- [ ] Implement planet description system
- [ ] Create unique descriptions for each planet based on type
- [ ] Add planet information display in UI

### 4. **Economic System - Fuel Trading**
- [ ] Implement fuel purchasing mechanics
- [ ] Create planet-specific fuel pricing system
- [ ] Make distant planets have cheaper fuel prices
- [ ] Add fuel vendor/trading interface for each planet
- [ ] Implement dynamic or varied pricing across planets

### 5. **Commodities System**
- [ ] Define commodity types and categories
- [ ] Create planet-type to commodity mapping system
- [ ] Implement commodity availability based on planet type
- [ ] Add commodity trading mechanics
- [ ] Create UI for viewing available commodities per planet
- [ ] Implement commodity pricing variations

### 6. **Integration & Polish**
- [ ] Test fuel system with existing game mechanics
- [ ] Balance fuel costs, travel times, and pricing
- [ ] Add visual indicators for fuel levels and planet distances
- [ ] Create help/tutorial content for new systems
- [ ] Add save/load support for new game state elements

Would you like me to elaborate on any of these sections or adjust the priority order of implementation?