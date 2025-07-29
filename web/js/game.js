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
        try {
            await this.api.travel(planetId);
            await this.loadGameState();
            UI.showMessage(`Traveled to ${planetName}! Turn consumed.`, 'success');
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
}