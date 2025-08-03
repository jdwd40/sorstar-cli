// Game Logic Module
import { UI } from './ui.js';

export class GameManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.gameState = null;
        this.currentTransaction = null;
    }

    async loadGameState() {
        try {
            this.gameState = await this.api.getGameState();
            if (this.gameState) {
                // Get cargo info to calculate total cargo
                try {
                    const cargo = await this.api.getCargo();
                    this.gameState.totalCargo = cargo.totalCargo || 0;
                } catch (cargoError) {
                    this.gameState.totalCargo = 0;
                }
                
                // Get fuel info for fuel system display
                try {
                    const fuelInfo = await this.api.getFuelInfo();
                    this.gameState.fuel = fuelInfo;
                } catch (fuelError) {
                    console.warn('Could not load fuel info:', fuelError.message);
                    this.gameState.fuel = null;
                }
                
                UI.updateGameStats(this.gameState);
                UI.showGameButtons(true);
            } else {
                document.getElementById('game-stats').innerHTML = '<div class="error">No game found. Start a new game!</div>';
                UI.showGameButtons(false);
            }
        } catch (error) {
            this.gameState = null;
            document.getElementById('game-stats').innerHTML = '<div class="error">Error loading game state. Please try refreshing.</div>';
            UI.showGameButtons(false);
        }
    }

    async showShips() {
        try {
            UI.showLoading('🚀 Loading available ships...');
            const ships = await this.api.getShips();
            
            const headers = ['Ship', 'Cargo Capacity', 'Cost', 'Action'];
            const rows = ships.map(ship => [
                `<strong>${ship.name}</strong><br><small>${ship.description}</small>`,
                `${ship.cargoCapacity} units`,
                UI.formatCurrency(ship.cost),
                `<button onclick="gameManager.startGame(${ship.id})">Select</button>`
            ]);
            
            let html = '<h3>🚀 Available Ships</h3>';
            html += UI.createTable(headers, rows);
            
            document.getElementById('game-content').innerHTML = html;
        } catch (error) {
            document.getElementById('game-content').innerHTML = `<div class="error">Error loading ships: ${error.message}</div>`;
        }
    }

    async startGame(shipId) {
        try {
            await this.api.startGame(shipId);
            await this.loadGameState();
            document.getElementById('game-content').innerHTML = '<div class="success">Game started! Welcome to Terra Nova, pilot!</div>';
        } catch (error) {
            document.getElementById('game-content').innerHTML = `<div class="error">Error starting game: ${error.message}</div>`;
        }
    }

    async showMarket() {
        // Use enhanced market view by default, with fallback to basic view
        try {
            await this.showEnhancedMarket();
        } catch (error) {
            console.warn('Enhanced market failed, falling back to basic market:', error.message);
            await this.showBasicMarket();
        }
    }

    async showBasicMarket() {
        if (!this.gameState) return;
        
        UI.showLoading('🌌 Loading market data...');
        
        try {
            const market = await this.api.getMarketPrices(this.gameState.currentPlanetId);
            
            let html = `
                <h3>💰 ${this.gameState.planetName} Market</h3>
                <div style="margin-bottom: 15px; color: var(--secondary-text); padding: 10px; background: var(--accent-bg); border-radius: var(--radius);">
                    📍 <strong>Location:</strong> ${this.gameState.planetName} | 
                    💳 <strong>Credits:</strong> ${UI.formatCurrency(this.gameState.credits)} | 
                    📦 <strong>Cargo:</strong> ${this.gameState.totalCargo || 0}/${this.gameState.cargoCapacity} units
                </div>
            `;
            
            // Add fuel trading section
            if (this.gameState.fuel) {
                const fuelPercentage = Math.round((this.gameState.fuel.currentFuel / this.gameState.fuel.maxFuel) * 100);
                const fuelColor = fuelPercentage > 50 ? 'var(--success-color)' : 
                                 fuelPercentage > 25 ? 'orange' : 'var(--error-color)';
                
                // Assume fuel price varies by planet (can be made dynamic later)
                const fuelPrice = this.gameState.fuel.pricePerUnit || 50;
                const maxFuelBuyable = Math.floor(this.gameState.credits / fuelPrice);
                const fuelNeeded = this.gameState.fuel.maxFuel - this.gameState.fuel.currentFuel;
                const maxFuelToBuy = Math.min(maxFuelBuyable, fuelNeeded);
                const canBuyFuel = maxFuelToBuy > 0;
                
                html += `
                    <div style="margin-bottom: 20px; padding: 15px; background: var(--primary-bg); border: 2px solid var(--accent-color); border-radius: var(--radius);">
                        <h4>⛽ Fuel Station</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                                <strong>Current Fuel:</strong> <span style="color: ${fuelColor};">${this.gameState.fuel.currentFuel}/${this.gameState.fuel.maxFuel} (${fuelPercentage}%)</span>
                            </div>
                            <div>
                                <strong>Fuel Price:</strong> ${UI.formatCurrency(fuelPrice)} per unit
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <button onclick="gameManager.openFuelPurchaseModal(${fuelPrice}, ${maxFuelToBuy})" 
                                    ${canBuyFuel ? '' : 'disabled'}
                                    title="${canBuyFuel ? `Max: ${maxFuelToBuy} units` : 'Tank full or insufficient credits'}">
                                ⛽ Buy Fuel ${canBuyFuel ? `(Max: ${maxFuelToBuy})` : '(N/A)'}
                            </button>
                            ${fuelPercentage < 25 ? '<span style="color: var(--error-color); margin-left: 10px;">⚠️ Low Fuel Warning!</span>' : ''}
                        </div>
                    </div>
                `;
            }
            
            // Add commodities section
            html += '<h4>🏪 Commodities</h4>';
            const headers = ['Commodity', 'Buy Price', 'Sell Price', 'Stock', 'Actions'];
            const rows = market.map(item => {
                const canAfford = Math.floor(this.gameState.credits / item.buy_price);
                const hasSpace = (this.gameState.cargoCapacity - (this.gameState.totalCargo || 0)) > 0;
                const buyDisabled = !hasSpace || canAfford === 0 || item.stock === 0;
                const maxBuyable = Math.min(canAfford, hasSpace ? this.gameState.cargoCapacity - (this.gameState.totalCargo || 0) : 0, item.stock);
                
                return [
                    `<strong>${item.commodity_name}</strong>`,
                    `<span style="color: var(--error-color);">${UI.formatCurrency(item.buy_price)}</span>`,
                    `<span style="color: var(--success-color);">${UI.formatCurrency(item.sell_price)}</span>`,
                    `${item.stock} units`,
                    `<button onclick="gameManager.openBuyModal(${item.commodity_id}, '${item.commodity_name}', ${item.buy_price}, ${item.stock})" 
                            ${buyDisabled ? 'disabled' : ''}
                            title="${buyDisabled ? 'Cannot buy: insufficient credits/space' : `Max: ${maxBuyable} units`}">
                        💰 Buy ${buyDisabled ? '(N/A)' : `(${maxBuyable})`}
                    </button>`
                ];
            });
            
            html += UI.createTable(headers, rows);
            document.getElementById('game-content').innerHTML = html;
        } catch (error) {
            document.getElementById('game-content').innerHTML = `<div class="error">Error loading market: ${error.message}</div>`;
        }
    }


    async showPlanets() {
        UI.showLoading('🌍 Loading planetary data...');
        
        try {
            const planets = await this.api.getPlanets();
            const otherPlanets = planets.filter(p => p.id !== this.gameState.currentPlanetId);
            
            let html = '<h3>🌍 Travel Destinations</h3>';
            
            // Get detailed planet information and travel costs
            const planetsWithDetails = await Promise.all(
                otherPlanets.map(async (planet) => {
                    try {
                        // Get planet details and travel cost concurrently
                        const [details, travelCost] = await Promise.all([
                            this.api.getPlanetDetails(planet.id),
                            this.api.getTravelCost(planet.id)
                        ]);
                        
                        return { ...planet, details, travelCost };
                    } catch (error) {
                        console.warn(`Failed to get details for planet ${planet.name}:`, error);
                        return { 
                            ...planet, 
                            details: { type: 'Unknown', classification: 'Standard', fuelPrice: 'Unknown' },
                            travelCost: { fuelCost: 'Unknown', timeCost: 'Unknown', canTravel: false }
                        };
                    }
                })
            );
            
            const headers = ['Planet & Type', 'Classification & Features', 'Travel Cost', 'Actions'];
            const rows = planetsWithDetails.map(planet => {
                // Determine planet type and add appropriate emoji/description
                let planetTypeDisplay = planet.details.type || planet.planetType || 'Unknown';
                let typeEmoji = '🌍';
                let typeDescription = '';
                
                switch (planetTypeDisplay) {
                    case 'Trade Hub':
                        typeEmoji = '🏛️';
                        typeDescription = 'Major trade center with competitive prices';
                        break;
                    case 'Mining':
                        typeEmoji = '⛏️';
                        typeDescription = 'Rich in raw materials and metals';
                        break;
                    case 'Colony':
                        typeEmoji = '🏘️';
                        typeDescription = 'Growing settlement with diverse needs';
                        break;
                    case 'Industrial':
                        typeEmoji = '🏭';
                        typeDescription = 'Manufacturing hub with processed goods';
                        break;
                    case 'Agricultural':
                        typeEmoji = '🌾';
                        typeDescription = 'Food production center';
                        break;
                    case 'Research':
                        typeEmoji = '🔬';
                        typeDescription = 'Technology and scientific advancement';
                        break;
                    default:
                        if (planet.name.includes('Station')) {
                            typeEmoji = '🛰️';
                            typeDescription = 'Orbital facility or outpost';
                        } else if (planet.description.includes('crystal')) {
                            typeEmoji = '💎';
                            typeDescription = 'Mineral extraction and crystal mining';
                        } else if (planet.description.includes('water') || planet.description.includes('ocean')) {
                            typeEmoji = '🌊';
                            typeDescription = 'Water-rich world';
                        } else if (planet.description.includes('energy')) {
                            typeEmoji = '⚡';
                            typeDescription = 'Energy production facility';
                        } else if (planet.description.includes('tech')) {
                            typeEmoji = '💻';
                            typeDescription = 'Technology research center';
                        }
                }
                
                // Format classification and distance info
                let classificationInfo = planet.details.classification || 'Standard';
                if (planet.isDistant) {
                    classificationInfo += ' • <span style="color: orange;">Distant Planet</span>';
                } else {
                    classificationInfo += ' • <span style="color: var(--success-color);">Near System</span>';
                }
                
                // Add fuel price info
                const fuelPrice = planet.details.fuelPrice || 'Unknown';
                classificationInfo += `<br><small>⛽ Fuel: ${fuelPrice === 'Unknown' ? fuelPrice : UI.formatCurrency(fuelPrice) + '/unit'}</small>`;
                
                // Format travel costs with proper styling
                let travelCostDisplay = '';
                const fuelCost = planet.travelCost.fuelCost;
                const timeCost = planet.travelCost.timeCost;
                const canTravel = planet.travelCost.canTravel;
                
                if (fuelCost !== 'Unknown' && timeCost !== 'Unknown') {
                    const fuelColor = canTravel ? 'var(--success-color)' : 'var(--error-color)';
                    travelCostDisplay = `
                        <div><strong>⛽ Fuel:</strong> <span style="color: ${fuelColor};">${fuelCost} units</span></div>
                        <div><strong>⏱️ Time:</strong> ${timeCost} turn${timeCost > 1 ? 's' : ''}</div>
                        ${!canTravel ? '<div style="color: var(--error-color); font-size: 0.9em;">❌ Insufficient Fuel</div>' : ''}
                    `;
                } else {
                    travelCostDisplay = '<div style="color: #666;">Travel cost unknown</div>';
                }
                
                // Create travel button with appropriate state
                let travelButton = '';
                if (canTravel) {
                    travelButton = `<button onclick="gameManager.travelToPlanet(${planet.id}, '${planet.name}')" 
                                    title="Travel to ${planet.name}">
                                    🚀 Travel
                                   </button>`;
                } else if (fuelCost !== 'Unknown') {
                    travelButton = `<button disabled title="Need ${fuelCost} fuel units to travel here">
                                    ⛽ Need Fuel
                                   </button>`;
                } else {
                    travelButton = `<button onclick="gameManager.travelToPlanet(${planet.id}, '${planet.name}')">
                                    🚀 Travel
                                   </button>`;
                }
                
                return [
                    `<div><strong>${typeEmoji} ${planet.name}</strong></div>
                     <div style="color: var(--secondary-text); font-size: 0.9em; margin-top: 5px;">${planetTypeDisplay}</div>
                     <div style="color: #999; font-size: 0.8em; margin-top: 3px;">${typeDescription}</div>`,
                    
                    `<div style="margin-bottom: 8px;">${classificationInfo}</div>
                     <div style="color: #999; font-size: 0.9em;">${planet.description || 'No additional information available'}</div>`,
                    
                    travelCostDisplay,
                    
                    travelButton
                ];
            });
            
            html += UI.createTable(headers, rows);
            document.getElementById('game-content').innerHTML = html;
        } catch (error) {
            document.getElementById('game-content').innerHTML = `<div class="error">Error loading planets: ${error.message}</div>`;
        }
    }

    async travelToPlanet(planetId, planetName) {
        if (!this.gameState) {
            UI.showMessage('Game state not loaded', 'error');
            return;
        }

        try {
            UI.showLoading('📡 Calculating travel cost...');
            
            // Get travel cost information
            const travelCost = await this.api.getTravelCost(planetId);
            
            // Check if player has enough fuel
            const currentFuel = this.gameState.fuel ? this.gameState.fuel.currentFuel : 0;
            const fuelRequired = travelCost.fuelCost || 0;
            const timeRequired = travelCost.timeCost || 1;
            const canTravel = currentFuel >= fuelRequired;
            
            // Build travel confirmation message
            let travelDetails = `
                <div style="margin-bottom: 15px;">
                    <strong>🌍 Destination:</strong> ${planetName}<br>
                    <strong>⛽ Fuel Required:</strong> ${fuelRequired} units<br>
                    <strong>⏱️ Time Required:</strong> ${timeRequired} turn${timeRequired > 1 ? 's' : ''}<br>
                    <strong>🔋 Fuel After Travel:</strong> ${currentFuel - fuelRequired}/${this.gameState.fuel ? this.gameState.fuel.maxFuel : 'Unknown'}
                </div>
            `;
            
            if (!canTravel) {
                // Show insufficient fuel message
                document.getElementById('game-content').innerHTML = `
                    <div class="error">
                        <h3>❌ Insufficient Fuel</h3>
                        ${travelDetails}
                        <div style="margin-top: 15px;">
                            <strong>⚠️ Cannot travel:</strong> You need ${fuelRequired} fuel units but only have ${currentFuel}.
                        </div>
                        <div style="margin-top: 15px;">
                            <button onclick="gameManager.showMarket()">⛽ Buy Fuel at Market</button>
                            <button onclick="gameManager.showPlanets()">🔙 Back to Travel</button>
                        </div>
                    </div>
                `;
                return;
            }
            
            // Show travel confirmation for sufficient fuel
            const fuelPercentageAfter = this.gameState.fuel ? 
                Math.round(((currentFuel - fuelRequired) / this.gameState.fuel.maxFuel) * 100) : 0;
            const fuelWarning = fuelPercentageAfter < 25 ? 
                '<div style="color: var(--error-color); margin-top: 10px;">⚠️ Warning: Low fuel after travel!</div>' : '';
            
            UI.showConfirmation({
                title: 'Confirm Travel',
                message: `
                    ${travelDetails}
                    <div style="color: var(--success-color);">
                        ✅ You have sufficient fuel for this journey.
                    </div>
                    ${fuelWarning}
                    <br>
                    <strong>Proceed with travel?</strong>
                `,
                onConfirm: () => this.executeTravel(planetId, planetName),
                onCancel: () => {
                    UI.closeModal('confirmModal');
                    this.showPlanets(); // Return to planet selection
                }
            });
            
        } catch (error) {
            console.error('Travel cost calculation failed:', error);
            
            // Fallback to basic travel confirmation if getTravelCost fails
            UI.showConfirmation({
                title: 'Confirm Travel',
                message: `Travel to ${planetName}?\n\n⚠️ Unable to calculate exact fuel cost. This will consume time and fuel.`,
                onConfirm: () => this.executeTravel(planetId, planetName),
                onCancel: () => {
                    UI.closeModal('confirmModal');
                    this.showPlanets();
                }
            });
        }
    }
    
    async executeTravel(planetId, planetName) {
        try {
            UI.closeModal('confirmModal');
            UI.showLoading('🚀 Traveling...');
            
            await this.api.travel(planetId);
            await this.loadGameState();
            
            // Show success message based on fuel status
            let message = `🚀 Traveled to ${planetName}! Turn consumed.`;
            if (this.gameState.fuel && this.gameState.fuel.currentFuel < this.gameState.fuel.maxFuel * 0.25) {
                message += ' ⚠️ Fuel is running low!';
            }
            
            UI.showMessage(message, 'success');
            
            // Show updated planet view after travel
            setTimeout(() => {
                this.showPlanets();
            }, 2000);
            
        } catch (error) {
            UI.showMessage(`Travel failed: ${error.message}`, 'error');
        }
    }

    // Buy/Sell modal methods will be added in trading.js
    openBuyModal(commodityId, name, price, stock) {
        // This will be implemented in trading.js
        console.log('Buy modal:', { commodityId, name, price, stock });
    }

    openSellModal(commodityId, name, quantity) {
        // This will be implemented in trading.js
        console.log('Sell modal:', { commodityId, name, quantity });
    }

    openFuelPurchaseModal(fuelPrice, maxFuelToBuy) {
        if (!this.gameState || !this.gameState.fuel) {
            UI.showMessage('Fuel information not available', 'error');
            return;
        }
        
        if (maxFuelToBuy <= 0) {
            UI.showMessage('Cannot purchase fuel: tank is full or insufficient credits', 'error');
            return;
        }
        
        const fuelNeeded = this.gameState.fuel.maxFuel - this.gameState.fuel.currentFuel;
        const modalContent = `
            <div class="form-group">
                <label>⛽ Fuel Status:</label>
                <div>${this.gameState.fuel.currentFuel}/${this.gameState.fuel.maxFuel} units (${fuelNeeded} needed to fill)</div>
            </div>
            
            <div class="form-group">
                <label>💰 Price per unit:</label>
                <div>${UI.formatCurrency(fuelPrice)}</div>
            </div>
            
            <div class="form-group">
                <label>💳 Your Credits:</label>
                <div>${UI.formatCurrency(this.gameState.credits)} (can afford ${Math.floor(this.gameState.credits / fuelPrice)} units)</div>
            </div>
            
            <div class="form-group">
                <label>📊 Quantity to Buy:</label>
                <div class="quantity-controls">
                    <button type="button" onclick="gameManager.adjustFuelQuantity(-10)">-10</button>
                    <button type="button" onclick="gameManager.adjustFuelQuantity(-1)">-1</button>
                    <input type="number" id="fuelQuantity" value="1" min="1" max="${maxFuelToBuy}" onchange="gameManager.updateFuelPreview();">
                    <button type="button" onclick="gameManager.adjustFuelQuantity(1)">+1</button>
                    <button type="button" onclick="gameManager.adjustFuelQuantity(10)">+10</button>
                    <button type="button" onclick="gameManager.setFuelMax(${maxFuelToBuy})">MAX</button>
                </div>
            </div>
            
            <div id="fuelPreview" class="transaction-summary">
                <h4>⛽ Fuel Purchase Preview</h4>
                <div><strong>Total Cost:</strong> <span id="fuelTotalCost">${UI.formatCurrency(fuelPrice)}</span></div>
                <div><strong>Remaining Credits:</strong> <span id="fuelRemainingCredits">${UI.formatCurrency(this.gameState.credits - fuelPrice)}</span></div>
                <div><strong>Fuel After Purchase:</strong> <span id="fuelAfterPurchase">${this.gameState.fuel.currentFuel + 1}/${this.gameState.fuel.maxFuel}</span></div>
            </div>
            
            <div class="modal-buttons">
                <button class="btn-confirm" onclick="gameManager.confirmFuelPurchase(${fuelPrice})">⛽ Purchase Fuel</button>
                <button class="btn-cancel" onclick="UI.closeModal('buyModal')">❌ Cancel</button>
            </div>
        `;
        
        document.getElementById('buyModalContent').innerHTML = modalContent;
        UI.showModal('buyModal');
        this.updateFuelPreview();
    }

    adjustFuelQuantity(change) {
        const input = document.getElementById('fuelQuantity');
        if (!input) return;
        
        const newValue = Math.max(1, Math.min(parseInt(input.max), parseInt(input.value) + change));
        input.value = newValue;
        this.updateFuelPreview();
    }

    setFuelMax(maxQuantity) {
        const input = document.getElementById('fuelQuantity');
        if (input) {
            input.value = maxQuantity;
            this.updateFuelPreview();
        }
    }

    updateFuelPreview() {
        const input = document.getElementById('fuelQuantity');
        if (!input || !this.gameState || !this.gameState.fuel) return;
        
        const quantity = parseInt(input.value);
        const fuelPrice = this.gameState.fuel.pricePerUnit || 50;
        const totalCost = quantity * fuelPrice;
        const remainingCredits = this.gameState.credits - totalCost;
        const fuelAfterPurchase = this.gameState.fuel.currentFuel + quantity;
        
        const elements = {
            'fuelTotalCost': UI.formatCurrency(totalCost),
            'fuelRemainingCredits': UI.formatCurrency(remainingCredits),
            'fuelAfterPurchase': `${fuelAfterPurchase}/${this.gameState.fuel.maxFuel}`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    async confirmFuelPurchase(fuelPrice) {
        const input = document.getElementById('fuelQuantity');
        if (!input) return;
        
        const quantity = parseInt(input.value);
        const totalCost = quantity * fuelPrice;
        
        UI.showConfirmation({
            title: 'Confirm Fuel Purchase',
            message: `Are you sure you want to buy ${quantity} units of fuel for ${UI.formatCurrency(totalCost)}?`,
            onConfirm: () => this.executeFuelPurchase(quantity),
            onCancel: () => UI.closeModal('confirmModal')
        });
    }

    async executeFuelPurchase(quantity) {
        try {
            const response = await this.api.buyFuel(this.gameState.currentPlanetId, quantity);
            
            UI.closeAllModals();
            await this.loadGameState();
            
            const purchaseMessage = `✅ Fuel purchase successful! Bought ${quantity} units of fuel.`;
            UI.showMessage(purchaseMessage, 'success', 3000);
            
            // Refresh market view to show updated fuel status
            setTimeout(() => {
                this.showMarket();
            }, 1000);
            
        } catch (error) {
            UI.closeModal('confirmModal');
            UI.showMessage(`Fuel purchase failed: ${error.message}`, 'error');
        }
    }

    // Enhanced Commodity System Methods
    async showEnhancedMarket() {
        if (!this.gameState) return;
        
        UI.showLoading('🌌 Loading enhanced market data...');
        
        try {
            // Get all required data concurrently
            const [market, commodityCategories, planetCommodities] = await Promise.all([
                this.api.getMarketPrices(this.gameState.currentPlanetId),
                this.loadCommodityCategories(),
                this.getPlanetCommodityInfo(this.gameState.currentPlanetId)
            ]);

            let html = `
                <h3>💰 ${this.gameState.planetName} Market</h3>
                <div style="margin-bottom: 15px; color: var(--secondary-text); padding: 10px; background: var(--accent-bg); border-radius: var(--radius);">
                    📍 <strong>Location:</strong> ${this.gameState.planetName} | 
                    💳 <strong>Credits:</strong> ${UI.formatCurrency(this.gameState.credits)} | 
                    📦 <strong>Cargo:</strong> ${this.gameState.totalCargo || 0}/${this.gameState.cargoCapacity} units
                </div>
            `;
            
            // Add fuel trading section (preserve existing functionality)
            if (this.gameState.fuel) {
                const fuelPercentage = Math.round((this.gameState.fuel.currentFuel / this.gameState.fuel.maxFuel) * 100);
                const fuelColor = fuelPercentage > 50 ? 'var(--success-color)' : 
                                 fuelPercentage > 25 ? 'orange' : 'var(--error-color)';
                
                const fuelPrice = this.gameState.fuel.pricePerUnit || 50;
                const maxFuelBuyable = Math.floor(this.gameState.credits / fuelPrice);
                const fuelNeeded = this.gameState.fuel.maxFuel - this.gameState.fuel.currentFuel;
                const maxFuelToBuy = Math.min(maxFuelBuyable, fuelNeeded);
                const canBuyFuel = maxFuelToBuy > 0;
                
                html += `
                    <div style="margin-bottom: 20px; padding: 15px; background: var(--primary-bg); border: 2px solid var(--accent-color); border-radius: var(--radius);">
                        <h4>⛽ Fuel Station</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                                <strong>Current Fuel:</strong> <span style="color: ${fuelColor};">${this.gameState.fuel.currentFuel}/${this.gameState.fuel.maxFuel} (${fuelPercentage}%)</span>
                            </div>
                            <div>
                                <strong>Fuel Price:</strong> ${UI.formatCurrency(fuelPrice)} per unit
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <button onclick="gameManager.openFuelPurchaseModal(${fuelPrice}, ${maxFuelToBuy})" 
                                    ${canBuyFuel ? '' : 'disabled'}
                                    title="${canBuyFuel ? `Max: ${maxFuelToBuy} units` : 'Tank full or insufficient credits'}">
                                ⛽ Buy Fuel ${canBuyFuel ? `(Max: ${maxFuelToBuy})` : '(N/A)'}
                            </button>
                            ${fuelPercentage < 25 ? '<span style="color: var(--error-color); margin-left: 10px;">⚠️ Low Fuel Warning!</span>' : ''}
                        </div>
                    </div>
                `;
            }

            // Add planet specialization info
            // Skip specialties section for now since API format changed
            /*
            if (planetCommodities.specialties && planetCommodities.specialties.length > 0) {
                html += `
                    <div style="margin-bottom: 20px; padding: 15px; background: var(--accent-bg); border-radius: var(--radius);">
                        <h4>🌟 Planet Specializations</h4>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            ${planetCommodities.specialties.map(specialty => `
                                <span style="background: var(--success-color); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.9em;">
                                    ⭐ ${specialty}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            */

            // Group commodities by category and display
            const groupedCommodities = this.groupCommoditiesByCategory(market, commodityCategories);
            
            for (const [categoryName, categoryData] of Object.entries(groupedCommodities)) {
                if (categoryData.commodities.length === 0) continue;

                // Add category header
                html += UI.createCategoryHeader(categoryData.category);

                // Add commodities table for this category
                const headers = ['Commodity', 'Availability & Price', 'Stock & Status', 'Actions'];
                const rows = categoryData.commodities.map(item => {
                    const canAfford = Math.floor(this.gameState.credits / item.buy_price);
                    const hasSpace = (this.gameState.cargoCapacity - (this.gameState.totalCargo || 0)) > 0;
                    const buyDisabled = !hasSpace || canAfford === 0 || item.stock === 0;
                    const maxBuyable = Math.min(canAfford, hasSpace ? this.gameState.cargoCapacity - (this.gameState.totalCargo || 0) : 0, item.stock);
                    
                    // Get enhanced commodity info from planet data
                    const enhancedInfo = (planetCommodities || []).find(c => c.commodity_name === item.commodity_name) || {};
                    
                    return [
                        `<div><strong>${item.commodity_name}</strong></div>
                         <div style="font-size: 0.9em; color: var(--secondary-text);">${enhancedInfo.description || 'Standard commodity'}</div>`,
                        
                        `<div>
                            ${UI.getAvailabilityIndicator(enhancedInfo.availability || 'common')}
                            ${UI.getPriceModifierDisplay(enhancedInfo)}
                         </div>
                         <div style="margin-top: 5px;">
                            <span style="color: var(--error-color); font-weight: bold;">Buy: ${UI.formatCurrency(item.buy_price)}</span>
                            <span style="color: var(--success-color); font-weight: bold; margin-left: 10px;">Sell: ${UI.formatCurrency(item.sell_price)}</span>
                         </div>`,
                        
                        `<div>${item.stock} units available</div>
                         <div style="margin-top: 5px;">${UI.getRarityIndicator(enhancedInfo)}</div>`,
                        
                        `<button onclick="gameManager.openBuyModal(${item.commodity_id}, '${item.commodity_name}', ${item.buy_price}, ${item.stock})" 
                                ${buyDisabled ? 'disabled' : ''}
                                title="${buyDisabled ? 'Cannot buy: insufficient credits/space' : `Max: ${maxBuyable} units`}">
                            💰 Buy ${buyDisabled ? '(N/A)' : `(${maxBuyable})`}
                        </button>`
                    ];
                });
                
                html += UI.createTable(headers, rows);
            }
            
            document.getElementById('game-content').innerHTML = html;
        } catch (error) {
            console.error('Enhanced market error:', error);
            // Fallback to basic market display
            await this.showBasicMarket();
        }
    }

    async loadCommodityCategories() {
        try {
            const response = await this.api.getCommodityCategories();
            return response.categories || [];
        } catch (error) {
            console.warn('Could not load commodity categories:', error.message);
            return [];
        }
    }

    async getPlanetCommodityInfo(planetId) {
        try {
            const response = await this.api.getCommoditiesByPlanet(planetId);
            return response;
        } catch (error) {
            console.warn('Could not load planet commodity info:', error.message);
            return {
                planetId,
                commodities: [],
                specialties: [],
                categorySummary: {}
            };
        }
    }

    groupCommoditiesByCategory(marketData, categories) {
        const grouped = {};
        
        // Initialize groups
        categories.forEach(category => {
            grouped[category.name] = {
                category: category,
                commodities: []
            };
        });

        // Group commodities
        marketData.forEach(item => {
            const category = this.findCommodityCategory(item.commodity_name, categories);
            if (category && grouped[category.name]) {
                grouped[category.name].commodities.push(item);
            } else {
                // Create "Other" category for uncategorized items
                if (!grouped['Other']) {
                    grouped['Other'] = {
                        category: { name: 'Other', icon: '📦', color: '#666', description: 'Miscellaneous items' },
                        commodities: []
                    };
                }
                grouped['Other'].commodities.push(item);
            }
        });

        return grouped;
    }

    findCommodityCategory(commodityName, categories) {
        return categories.find(category => 
            category.commodities && category.commodities.includes(commodityName)
        );
    }

    calculateCategoryStatistics(planetCommodities) {
        const stats = {};
        
        // Calculate from commodities array (API returns array directly)
        const categories = {};
        (planetCommodities || []).forEach(commodity => {
            const categoryName = commodity.category || 'Other';
            if (!categories[categoryName]) {
                categories[categoryName] = {
                    count: 0,
                    totalPrice: 0,
                    availabilities: []
                };
            }
            categories[categoryName].count++;
            categories[categoryName].totalPrice += commodity.currentPrice || commodity.basePrice || 0;
            categories[categoryName].availabilities.push(commodity.availability || 'common');
        });

        // Calculate statistics
        Object.entries(categories).forEach(([categoryName, data]) => {
            stats[categoryName] = {
                count: data.count,
                avgPrice: Math.round(data.totalPrice / data.count),
                availability: data.availabilities[0] || 'common' // Simplified
            };
        });

        return stats;
    }

    filterCommoditiesByAvailability(commodities, targetAvailability) {
        return commodities.filter(commodity => 
            commodity.availability === targetAvailability
        );
    }

    // Enhanced Cargo Management Methods
    async showCargo() {
        // Use enhanced cargo view by default, with fallback to basic view
        try {
            await this.showEnhancedCargo();
        } catch (error) {
            console.warn('Enhanced cargo failed, falling back to basic cargo:', error.message);
            await this.showBasicCargo();
        }
    }

    async showEnhancedCargo() {
        if (!this.gameState) return;
        
        UI.showLoading('📦 Loading enhanced cargo inventory...');
        
        try {
            // Get all required data concurrently
            const [cargo, commodityCategories, marketPrices] = await Promise.all([
                this.api.getCargo(),
                this.loadCommodityCategories(),
                this.api.getMarketPrices(this.gameState.currentPlanetId).catch(() => [])
            ]);

            let html = `
                <h3>📦 Enhanced Cargo Hold</h3>
                <div style="margin-bottom: 15px; color: var(--secondary-text); padding: 10px; background: var(--accent-bg); border-radius: var(--radius);">
                    📍 <strong>Location:</strong> ${this.gameState.planetName} | 
                    💳 <strong>Credits:</strong> ${UI.formatCurrency(this.gameState.credits)} | 
                    📦 <strong>Cargo:</strong> ${cargo.totalCargo}/${cargo.cargoCapacity} units (${UI.formatPercentage(cargo.totalCargo, cargo.cargoCapacity)}% full)
                </div>
            `;

            if (cargo.cargo.length === 0) {
                html += UI.createEmptyState('📦', 'Your cargo hold is empty.', 'Visit the market to buy commodities!');
            } else {
                // Process cargo with prices and categories
                const groupedCargo = await this.processCargoWithPrices(cargo.cargo, commodityCategories, marketPrices);
                
                // Add cargo summary
                const cargoSummary = this.calculateCargoSummary(groupedCargo);
                html += this.createCargoSummaryDisplay(cargoSummary);

                // Add sort controls
                html += UI.createCargoSortControls(['category', 'quantity', 'value', 'name']);

                // Display each category
                for (const [categoryName, categoryData] of Object.entries(groupedCargo)) {
                    if (categoryData.items.length === 0) continue;

                    // Category header with statistics
                    const categoryStats = this.calculateCategoryStatistics({[categoryName]: categoryData});
                    html += UI.createCargoCategoryHeader(categoryData.category, categoryStats[categoryName]);

                    // Category items table
                    const headers = ['Commodity', 'Quantity & Origin', 'Current Value', 'Best Market', 'Actions'];
                    const rows = categoryData.items.map(item => [
                        `<div><strong>${item.commodity_name}</strong></div>
                         <div style="font-size: 0.9em; color: var(--secondary-text);">${UI.getCommodityCategory({category: categoryName})}</div>`,
                        
                        `<div><strong>${item.quantity}</strong> units</div>
                         ${UI.getCommodityOriginDisplay(item)}`,
                        
                        `<div style="color: var(--success-color); font-weight: bold;">
                            ${item.estimatedValue ? UI.formatCurrency(item.estimatedValue) : 'Unknown'}
                         </div>
                         <div style="font-size: 0.9em; color: #666;">
                            ${item.estimatedValue ? `${UI.formatCurrency(Math.round(item.estimatedValue / item.quantity))} per unit` : ''}
                         </div>`,
                        
                        UI.getOptimalSellingLocation(item, item.allPlanetPrices || []),
                        
                        `<button onclick="gameManager.openSellModal(${item.commodity_id}, '${item.commodity_name}', ${item.quantity})">
                            💼 Sell
                         </button>`
                    ]);

                    html += UI.createTable(headers, rows);

                    // Add bulk sell button for category
                    html += `<div style="margin-bottom: 20px; text-align: right;">
                        ${UI.createBulkSellButton(categoryName, categoryData.items)}
                    </div>`;
                }
            }
            
            document.getElementById('game-content').innerHTML = html;
        } catch (error) {
            console.error('Enhanced cargo error:', error);
            // Fallback to basic cargo display
            await this.showBasicCargo();
        }
    }

    async showBasicCargo() {
        UI.showLoading('📦 Loading cargo inventory...');
        
        try {
            const cargo = await this.api.getCargo();
            
            let html = `
                <h3>📦 Cargo Hold</h3>
                <div style="margin-bottom: 15px; color: var(--secondary-text); padding: 10px; background: var(--accent-bg); border-radius: var(--radius);">
                    📍 <strong>Location:</strong> ${this.gameState.planetName} | 
                    💳 <strong>Credits:</strong> ${UI.formatCurrency(this.gameState.credits)} | 
                    📦 <strong>Cargo:</strong> ${cargo.totalCargo}/${cargo.cargoCapacity} units (${UI.formatPercentage(cargo.totalCargo, cargo.cargoCapacity)}% full)
                </div>
            `;
            
            if (cargo.cargo.length === 0) {
                html += UI.createEmptyState('📦', 'Your cargo hold is empty.', 'Visit the market to buy commodities!');
            } else {
                // Get market prices for value estimation
                let marketPrices = {};
                try {
                    const market = await this.api.getMarketPrices(this.gameState.currentPlanetId);
                    market.forEach(item => {
                        marketPrices[item.commodity_id] = item.sell_price;
                    });
                } catch (e) {
                    // Market prices unavailable
                }
                
                const headers = ['Commodity', 'Quantity', 'Est. Value', 'Actions'];
                const rows = cargo.cargo.map(item => {
                    const estimatedValue = marketPrices[item.commodity_id] ? 
                        marketPrices[item.commodity_id] * item.quantity : null;
                    
                    return [
                        `<strong>${item.commodity_name}</strong>`,
                        `${item.quantity} units`,
                        estimatedValue ? 
                            `<span style="color: var(--success-color);">${UI.formatCurrency(estimatedValue)}</span>` : 
                            '<span style="color: #666;">Unknown</span>',
                        `<button onclick="gameManager.openSellModal(${item.commodity_id}, '${item.commodity_name}', ${item.quantity})">
                            💼 Sell
                        </button>`
                    ];
                });
                
                html += UI.createTable(headers, rows);
            }
            
            document.getElementById('game-content').innerHTML = html;
        } catch (error) {
            document.getElementById('game-content').innerHTML = `<div class="error">Error loading cargo: ${error.message}</div>`;
        }
    }

    async processCargoWithPrices(cargoItems, categories, marketPrices) {
        // Create price lookup
        const priceMap = {};
        if (marketPrices && Array.isArray(marketPrices)) {
            marketPrices.forEach(item => {
                priceMap[item.commodity_id] = item.sell_price;
            });
        }

        // Add estimated values to cargo items
        const enrichedCargo = cargoItems.map(item => ({
            ...item,
            estimatedValue: priceMap[item.commodity_id] ? priceMap[item.commodity_id] * item.quantity : null,
            pricePerUnit: priceMap[item.commodity_id] || null
        }));

        // Group by category
        return this.groupCargoByCategory(enrichedCargo, categories);
    }

    groupCargoByCategory(cargoItems, categories) {
        const grouped = {};
        
        // Group items by category
        cargoItems.forEach(item => {
            const category = this.findCommodityCategory(item.commodity_name, categories);
            const categoryName = category ? category.name : 'Other';
            
            if (!grouped[categoryName]) {
                grouped[categoryName] = {
                    category: category || { name: 'Other', icon: '📦', color: '#666', description: 'Miscellaneous items' },
                    items: [],
                    totalQuantity: 0,
                    totalValue: 0
                };
            }

            grouped[categoryName].items.push(item);
            grouped[categoryName].totalQuantity += item.quantity;
            grouped[categoryName].totalValue += item.estimatedValue || 0;
        });

        return grouped;
    }

    calculateCargoStatistics(groupedCargo) {
        const stats = {};
        const totalQuantity = Object.values(groupedCargo).reduce((sum, cat) => sum + cat.totalQuantity, 0);
        const totalValue = Object.values(groupedCargo).reduce((sum, cat) => sum + cat.totalValue, 0);

        Object.entries(groupedCargo).forEach(([categoryName, categoryData]) => {
            stats[categoryName] = {
                itemCount: categoryData.items.length,
                totalQuantity: categoryData.totalQuantity,
                totalValue: categoryData.totalValue,
                averageValue: categoryData.items.length > 0 ? categoryData.totalValue / categoryData.items.length : 0,
                percentageByQuantity: totalQuantity > 0 ? Math.round((categoryData.totalQuantity / totalQuantity) * 100) : 0,
                percentageByValue: totalValue > 0 ? Math.round((categoryData.totalValue / totalValue) * 100) : 0
            };
        });

        return stats;
    }

    calculateCargoSummary(groupedCargo) {
        const totalQuantity = Object.values(groupedCargo).reduce((sum, cat) => sum + cat.totalQuantity, 0);
        const totalValue = Object.values(groupedCargo).reduce((sum, cat) => sum + cat.totalValue, 0);
        const categoryCount = Object.keys(groupedCargo).length;

        // Find most valuable and largest categories
        let mostValuableCategory = '';
        let largestCategory = '';
        let maxValue = 0;
        let maxQuantity = 0;

        Object.entries(groupedCargo).forEach(([categoryName, categoryData]) => {
            if (categoryData.totalValue > maxValue) {
                maxValue = categoryData.totalValue;
                mostValuableCategory = categoryName;
            }
            if (categoryData.totalQuantity > maxQuantity) {
                maxQuantity = categoryData.totalQuantity;
                largestCategory = categoryName;
            }
        });

        return {
            totalQuantity,
            totalValue,
            categoryCount,
            mostValuableCategory,
            largestCategory
        };
    }

    createCargoSummaryDisplay(cargoSummary) {
        return `
            <div style="margin-bottom: 20px; padding: 15px; background: var(--primary-bg); border-radius: var(--radius); border: 2px solid var(--accent-color);">
                <h4>📊 Cargo Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <strong>Total Value:</strong> <span style="color: var(--success-color);">${UI.formatCurrency(cargoSummary.totalValue)}</span>
                    </div>
                    <div>
                        <strong>Categories:</strong> ${cargoSummary.categoryCount}
                    </div>
                    <div>
                        <strong>Most Valuable:</strong> ${cargoSummary.mostValuableCategory || 'None'}
                    </div>
                    <div>
                        <strong>Largest by Volume:</strong> ${cargoSummary.largestCategory || 'None'}
                    </div>
                </div>
            </div>
        `;
    }

    filterCargoByCategory(cargoItems, categoryName, categories) {
        const category = categories.find(cat => cat.name === categoryName);
        if (!category) return [];

        return cargoItems.filter(item => 
            category.commodities.includes(item.commodity_name)
        );
    }

    getCargoRecommendations(groupedCargo, cargoCapacity, currentTotal) {
        const spacesAvailable = cargoCapacity - currentTotal;
        const totalValue = Object.values(groupedCargo).reduce((sum, cat) => sum + cat.totalValue, 0);
        
        // Find most profitable category
        let mostProfitableCategory = '';
        let maxProfitability = 0;
        
        Object.entries(groupedCargo).forEach(([categoryName, categoryData]) => {
            const profitability = categoryData.totalValue / categoryData.totalQuantity;
            if (profitability > maxProfitability) {
                maxProfitability = profitability;
                mostProfitableCategory = categoryName;
            }
        });

        return {
            spacesAvailable,
            mostProfitableCategory,
            totalValue,
            diversification: Object.keys(groupedCargo).length > 2 ? 'Good' : 'Consider more variety',
            optimization: spacesAvailable > cargoCapacity * 0.2 ? 'Fill remaining space' : 'Consider selling low-value items'
        };
    }

    // Cargo management actions
    async bulkSellCategory(categoryName, commodityIds) {
        try {
            UI.showLoading(`💼 Selling all ${categoryName} items...`);
            
            // Implement bulk selling logic here
            // For now, show confirmation
            UI.showMessage(`Bulk selling ${categoryName} items not yet implemented`, 'info');
        } catch (error) {
            UI.showMessage(`Bulk sell failed: ${error.message}`, 'error');
        }
    }

    sortCargoBy(sortType) {
        // Implement cargo sorting logic here
        UI.showMessage(`Sorting by ${sortType} not yet implemented`, 'info');
    }
}