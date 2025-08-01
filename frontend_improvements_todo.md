# Frontend Improvements Todo List

Based on the game improvements implemented in the backend, this document outlines all necessary frontend updates to integrate the new fuel system, planet types, enhanced commodities, and distance-based travel mechanics.

## **1. Core API Integration Updates**

### **API Client Enhancements (`web/js/api.js`)**
- [x] Add fuel-related API methods:
  - `getFuelInfo()` - Get current fuel status ✅
  - `buyFuel(planetId, quantity)` - Purchase fuel ✅
  - `getTravelCost(planetId)` - Get fuel cost for travel ✅
- [ ] Add enhanced planet endpoints:
  - `getPlanetDetails(planetId)` - Get planet type, distance, description
  - `getPlanetDistanceInfo(planetId)` - Get travel requirements
- [ ] Add commodities system endpoints:
  - `getCommoditiesByPlanet(planetId)` - Get planet-specific commodities
  - `getCommodityCategories()` - Get commodity categories/types
- [ ] Update existing methods to handle new response data:
  - Enhanced `getGameState()` response with fuel information
  - Enhanced `getPlanets()` response with distance and planet types
  - Enhanced `travel()` response with fuel consumption

## **2. Game State Management Updates**

### **Game Manager Enhancements (`web/js/game.js`)**
- [ ] **Fuel System Integration:**
  - Add fuel tracking to game state
  - Display current fuel vs. max fuel capacity
  - Add fuel percentage indicator with color coding
  - Show fuel status warnings (low/critical fuel)
- [ ] **Enhanced Travel System:**
  - Show travel confirmation dialog with fuel cost and time
  - Display distance to each planet
  - Add "Cannot Travel" states for insufficient fuel
  - Show estimated fuel remaining after travel
- [ ] **Planet Information Display:**
  - Show planet types (Forest, Jungle, Industrial, City)
  - Display planet descriptions based on type
  - Show distance from current location
  - Add planet classification indicators
- [ ] **Fuel Purchase Interface:**
  - Add fuel vendor section to market view
  - Show fuel prices per planet
  - Display fuel purchase options with quantity selector
  - Show fuel purchasing confirmation

## **3. User Interface Component Updates**

### **UI Module Enhancements (`web/js/ui.js`)**
- [ ] **Fuel Status Components:**
  - Add `displayFuelStatus(fuelData)` method
  - Create fuel level progress bar with color coding
  - Add fuel warning indicators
  - Create fuel range estimation display
- [ ] **Enhanced Planet Display:**
  - Add `formatPlanetInfo(planet)` with type icons
  - Create distance indicator badges
  - Add planet type color coding
  - Show travel requirements in planet list
- [ ] **Travel Confirmation Modal:**
  - Create travel confirmation dialog
  - Show fuel cost, time cost, and remaining fuel
  - Add "Proceed/Cancel" travel options
  - Display travel warnings for low fuel
- [ ] **Fuel Purchase Modal:**
  - Create fuel purchase interface
  - Add quantity selector with max affordable calculation
  - Show fuel price comparison across planets
  - Display purchase confirmation

### **Game Stats Panel Updates**
- [ ] **Add fuel information to stats display:**
  - Current fuel / Max fuel capacity
  - Fuel percentage with visual indicator
  - Estimated travel range
  - Fuel efficiency indicators
- [ ] **Enhanced location display:**
  - Show current planet type
  - Display planet classification icon
  - Add distance indicators to nearby planets

## **4. Enhanced Game Views**

### **Market View Updates (`showMarket()` method)**
- [ ] **Fuel Trading Section:**
  - Add fuel purchase section above commodities
  - Show current fuel price for this planet
  - Display fuel availability and purchase limits
  - Add fuel purchase buttons with quantity options
- [ ] **Planet-Specific Commodities:**
  - Filter commodities by planet type availability
  - Show commodity categories (Energy, Food, Minerals, etc.)
  - Display planet production bonuses/penalties
  - Add commodity origin indicators

### **Travel View Updates (`showPlanets()` method)**
- [ ] **Enhanced Planet Information:**
  - Show planet type icons and descriptions
  - Display distance from current location
  - Add travel time and fuel cost calculations
  - Show "Cannot Reach" indicators for insufficient fuel
- [ ] **Travel Confirmation System:**
  - Replace direct travel buttons with confirmation dialogs
  - Show complete travel cost breakdown
  - Display estimated fuel remaining after travel
  - Add travel warnings and recommendations

### **Cargo View Updates (`showCargo()` method)**
- [ ] **Enhanced Cargo Display:**
  - Group commodities by category/type
  - Show commodity origin planet types
  - Add commodity category icons
  - Display optimal selling locations for each item

## **5. New Game Features**

### **Fuel Management Interface**
- [ ] **Create dedicated fuel management section:**
  - Fuel status dashboard
  - Fuel efficiency tracking
  - Fuel purchase history
  - Range planning tools
- [ ] **Fuel Purchase Optimization:**
  - Show fuel price comparison across accessible planets
  - Calculate optimal fuel purchasing strategies
  - Display fuel arbitrage opportunities

### **Planet Exploration Interface**
- [ ] **Create planet classification browser:**
  - Filter planets by type (Forest, Industrial, etc.)
  - Show planet specializations and commodities
  - Display exploration progression
  - Add planet discovery rewards

### **Enhanced Economics Dashboard**
- [ ] **Trading Route Optimization:**
  - Show profitable trading routes considering fuel costs
  - Display break-even analysis for long-distance travel
  - Add route planning with fuel stops
  - Show economic efficiency metrics

## **6. Visual and UX Improvements**

### **Icons and Visual Indicators**
- [ ] **Add planet type icons:**
  - 🌲 Forest, 🌿 Jungle, 🏭 Industrial, 🏙️ City, etc.
  - Color coding for planet types
  - Distance indicator badges (Near/Distant)
- [ ] **Fuel status indicators:**
  - ⛽ Fuel gauge with color coding
  - 🔴 Low fuel warnings
  - 🟢 Full fuel indicators
- [ ] **Enhanced commodity icons:**
  - Category-based commodity icons
  - Rarity indicators
  - Availability status icons

### **Responsive Design Updates**
- [ ] **Mobile optimization for new features:**
  - Collapsible fuel status panel
  - Touch-friendly fuel purchase interface
  - Optimized travel confirmation dialogs
  - Responsive planet type displays

## **7. Help and Tutorial Content**

### **User Guidance**
- [ ] **Add help tooltips for new features:**
  - Fuel system explanations
  - Planet type descriptions
  - Travel cost calculations
  - Commodity trading strategies
- [ ] **Create tutorial progression:**
  - Fuel management tutorial
  - Planet exploration guide
  - Advanced trading strategies
  - Economic optimization tips

## **8. Testing and Integration**

### **Component Testing**
- [ ] **Test all new UI components:**
  - Fuel purchase flows
  - Travel confirmation dialogs
  - Enhanced market displays
  - Planet information views
- [ ] **Integration testing:**
  - Fuel system with existing trading
  - Planet system with travel mechanics
  - Commodity system with market prices
  - Save/load functionality with new data

### **Performance Optimization**
- [ ] **Optimize API calls:**
  - Batch planet information requests
  - Cache fuel pricing data
  - Implement efficient data updates
  - Minimize redundant network calls

---

## **Priority Implementation Order**

### **Phase 1 (Essential Core Updates):**
1. Update API client with fuel and enhanced planet methods
2. Add fuel status to game stats panel
3. Implement basic fuel purchase interface
4. Update travel system with fuel cost confirmation

### **Phase 2 (Enhanced Features):**
1. Add planet type displays and classifications
2. Implement enhanced market view with fuel trading
3. Create travel confirmation dialogs
4. Add visual indicators and icons

### **Phase 3 (Advanced Features):**
1. Build fuel management dashboard
2. Implement planet exploration interface
3. Add trading route optimization
4. Create help and tutorial content

---

## **Implementation Notes**

### **Backend Integration Points**
- Fuel system endpoints need to be identified and documented
- Planet distance and type data structure needs to be understood
- Enhanced game state response format needs to be mapped
- New commodity system structure needs to be integrated

### **Key Dependencies**
- All Phase 1 items must be completed before Phase 2
- API client updates are prerequisite for all other features
- Game state management updates enable UI component enhancements
- Visual improvements can be implemented in parallel with core features

### **Success Criteria**
- [ ] All fuel system features working in frontend
- [ ] Planet types and distances displayed correctly
- [ ] Enhanced commodity system fully functional
- [ ] Travel system includes fuel cost calculations
- [ ] All new features tested and integrated seamlessly

This comprehensive update will transform the frontend to fully utilize all the game improvements implemented in the backend!