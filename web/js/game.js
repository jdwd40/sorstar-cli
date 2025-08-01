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

    async showCargo() {
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

    async showPlanets() {
        UI.showLoading('🌍 Loading planetary data...');
        
        try {
            const planets = await this.api.getPlanets();
            const otherPlanets = planets.filter(p => p.id !== this.gameState.currentPlanetId);
            
            let html = '<h3>🌍 Travel Destinations</h3>';
            
            const headers = ['Planet', 'Description', 'Coordinates', 'Actions'];
            const rows = otherPlanets.map(planet => [
                `<strong>${planet.name}</strong>`,
                planet.description || 'Unknown',
                `(${planet.xCoord || 0}, ${planet.yCoord || 0})`,
                `<button onclick="gameManager.travelToPlanet(${planet.id}, '${planet.name}')">
                    🚀 Travel
                </button>`
            ]);
            
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
}