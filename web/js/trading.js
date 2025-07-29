// Trading System Module
import { UI } from './ui.js';

export class TradingManager {
    constructor(gameManager, apiClient) {
        this.game = gameManager;
        this.api = apiClient;
        this.currentTransaction = null;
    }

    openBuyModal(commodityId, name, price, stock) {
        if (!this.game.gameState) {
            UI.showMessage('Please refresh your game state first.', 'error');
            return;
        }

        this.currentTransaction = {
            type: 'buy',
            commodityId,
            name,
            price,
            stock,
            maxAffordable: Math.floor(this.game.gameState.credits / price),
            maxSpace: this.game.gameState.cargoCapacity - (this.game.gameState.totalCargo || 0)
        };

        const maxQuantity = Math.min(this.currentTransaction.maxAffordable, this.currentTransaction.maxSpace, stock);
        
        if (maxQuantity <= 0) {
            let reason = '';
            if (this.currentTransaction.maxAffordable <= 0) reason = 'insufficient credits';
            else if (this.currentTransaction.maxSpace <= 0) reason = 'no cargo space';
            else if (stock <= 0) reason = 'no stock available';
            UI.showMessage(`Cannot buy ${name}: ${reason}`, 'error');
            return;
        }

        const modalContent = this.createBuyModalContent(maxQuantity);
        document.getElementById('buyModalContent').innerHTML = modalContent;
        UI.showModal('buyModal');
        this.updateBuyPreview();
    }

    createBuyModalContent(maxQuantity) {
        return `
            <div class="form-group">
                <label>🚀 Commodity:</label>
                <div style="font-size: 1.1em; color: var(--secondary-text);">${this.currentTransaction.name}</div>
            </div>
            
            <div class="form-group">
                <label>💰 Price per unit:</label>
                <div>${UI.formatCurrency(this.currentTransaction.price)}</div>
            </div>
            
            <div class="form-group">
                <label>📦 Available:</label>
                <div>${this.currentTransaction.stock} units in stock</div>
            </div>
            
            <div class="form-group">
                <label>💳 Your Credits:</label>
                <div>${UI.formatCurrency(this.game.gameState.credits)} (can afford ${this.currentTransaction.maxAffordable} units)</div>
            </div>
            
            <div class="form-group">
                <label>🚛 Cargo Space:</label>
                <div>${this.currentTransaction.maxSpace} units available</div>
            </div>
            
            <div class="form-group">
                <label>📊 Quantity to Buy:</label>
                <div class="quantity-controls">
                    <button type="button" onclick="tradingManager.adjustQuantity('buy', -10)">-10</button>
                    <button type="button" onclick="tradingManager.adjustQuantity('buy', -1)">-1</button>
                    <input type="number" id="buyQuantity" value="1" min="1" max="${maxQuantity}" onchange="tradingManager.validateBuyQuantity(); tradingManager.updateBuyPreview();">
                    <button type="button" onclick="tradingManager.adjustQuantity('buy', 1)">+1</button>
                    <button type="button" onclick="tradingManager.adjustQuantity('buy', 10)">+10</button>
                    <button type="button" onclick="tradingManager.setBuyMax()">MAX</button>
                </div>
            </div>
            
            <div id="buyPreview" class="transaction-summary">
                <h4>💼 Transaction Preview</h4>
                <div><strong>Total Cost:</strong> <span id="buyTotalCost">${UI.formatCurrency(this.currentTransaction.price)}</span></div>
                <div><strong>Remaining Credits:</strong> <span id="buyRemainingCredits">${UI.formatCurrency(this.game.gameState.credits - this.currentTransaction.price)}</span></div>
                <div><strong>Remaining Cargo Space:</strong> <span id="buyRemainingSpace">${this.currentTransaction.maxSpace - 1}</span> units</div>
            </div>
            
            <div class="modal-buttons">
                <button class="btn-confirm" onclick="tradingManager.confirmBuyTransaction()">💰 Purchase</button>
                <button class="btn-cancel" onclick="UI.closeModal('buyModal')">❌ Cancel</button>
            </div>
        `;
    }

    async openSellModal(commodityId, name, ownedQuantity) {
        if (!this.game.gameState) {
            UI.showMessage('Please refresh your game state first.', 'error');
            return;
        }

        // Get current market prices for this commodity
        let sellPrice = 0;
        try {
            const marketPrices = await this.api.getMarketPrices(this.game.gameState.currentPlanetId);
            const commodity = marketPrices.find(item => item.commodity_id === commodityId);
            sellPrice = commodity ? commodity.sell_price : 0;
        } catch (error) {
            UI.showMessage('Could not load market prices', 'error');
            return;
        }

        if (sellPrice === 0) {
            UI.showMessage(`${name} cannot be sold at this location`, 'error');
            return;
        }

        this.currentTransaction = {
            type: 'sell',
            commodityId,
            name,
            sellPrice,
            ownedQuantity
        };

        const modalContent = this.createSellModalContent();
        document.getElementById('sellModalContent').innerHTML = modalContent;
        UI.showModal('sellModal');
        this.updateSellPreview();
    }

    createSellModalContent() {
        return `
            <div class="form-group">
                <label>🚀 Commodity:</label>
                <div style="font-size: 1.1em; color: var(--secondary-text);">${this.currentTransaction.name}</div>
            </div>
            
            <div class="form-group">
                <label>💰 Sell Price per unit:</label>
                <div>${UI.formatCurrency(this.currentTransaction.sellPrice)}</div>
            </div>
            
            <div class="form-group">
                <label>📦 You Own:</label>
                <div>${this.currentTransaction.ownedQuantity} units</div>
            </div>
            
            <div class="form-group">
                <label>📊 Quantity to Sell:</label>
                <div class="quantity-controls">
                    <button type="button" onclick="tradingManager.adjustQuantity('sell', -10)">-10</button>
                    <button type="button" onclick="tradingManager.adjustQuantity('sell', -1)">-1</button>
                    <input type="number" id="sellQuantity" value="1" min="1" max="${this.currentTransaction.ownedQuantity}" onchange="tradingManager.validateSellQuantity(); tradingManager.updateSellPreview();">
                    <button type="button" onclick="tradingManager.adjustQuantity('sell', 1)">+1</button>
                    <button type="button" onclick="tradingManager.adjustQuantity('sell', 10)">+10</button>
                    <button type="button" onclick="tradingManager.setSellMax()">ALL</button>
                </div>
            </div>
            
            <div id="sellPreview" class="transaction-summary">
                <h4>💼 Transaction Preview</h4>
                <div><strong>Total Earnings:</strong> <span id="sellTotalEarnings">${UI.formatCurrency(this.currentTransaction.sellPrice)}</span></div>
                <div><strong>New Credit Total:</strong> <span id="sellNewCredits">${UI.formatCurrency(this.game.gameState.credits + this.currentTransaction.sellPrice)}</span></div>
                <div><strong>Remaining Inventory:</strong> <span id="sellRemainingInventory">${this.currentTransaction.ownedQuantity - 1}</span> units</div>
            </div>
            
            <div class="modal-buttons">
                <button class="btn-confirm" onclick="tradingManager.confirmSellTransaction()">💼 Sell</button>
                <button class="btn-cancel" onclick="UI.closeModal('sellModal')">❌ Cancel</button>
            </div>
        `;
    }

    adjustQuantity(type, change) {
        const input = document.getElementById(type + 'Quantity');
        if (!input) return;
        
        const newValue = Math.max(1, Math.min(parseInt(input.max), parseInt(input.value) + change));
        input.value = newValue;
        
        if (type === 'buy') {
            this.validateBuyQuantity();
            this.updateBuyPreview();
        } else {
            this.validateSellQuantity();
            this.updateSellPreview();
        }
    }

    setBuyMax() {
        const input = document.getElementById('buyQuantity');
        if (input) {
            input.value = input.max;
            this.validateBuyQuantity();
            this.updateBuyPreview();
        }
    }

    setSellMax() {
        const input = document.getElementById('sellQuantity');
        if (input) {
            input.value = input.max;
            this.validateSellQuantity();
            this.updateSellPreview();
        }
    }

    validateBuyQuantity() {
        const input = document.getElementById('buyQuantity');
        if (!input || !this.currentTransaction) return;
        
        const quantity = parseInt(input.value);
        const maxQuantity = Math.min(
            this.currentTransaction.maxAffordable, 
            this.currentTransaction.maxSpace, 
            this.currentTransaction.stock
        );
        
        if (quantity > maxQuantity) {
            input.value = maxQuantity;
        } else if (quantity < 1) {
            input.value = 1;
        }
    }

    validateSellQuantity() {
        const input = document.getElementById('sellQuantity');
        if (!input || !this.currentTransaction) return;
        
        const quantity = parseInt(input.value);
        
        if (quantity > this.currentTransaction.ownedQuantity) {
            input.value = this.currentTransaction.ownedQuantity;
        } else if (quantity < 1) {
            input.value = 1;
        }
    }

    updateBuyPreview() {
        const input = document.getElementById('buyQuantity');
        if (!input || !this.currentTransaction) return;
        
        const quantity = parseInt(input.value);
        const totalCost = quantity * this.currentTransaction.price;
        const remainingCredits = this.game.gameState.credits - totalCost;
        const remainingSpace = this.currentTransaction.maxSpace - quantity;
        
        const elements = {
            'buyTotalCost': UI.formatCurrency(totalCost),
            'buyRemainingCredits': UI.formatCurrency(remainingCredits),
            'buyRemainingSpace': `${remainingSpace} units`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    updateSellPreview() {
        const input = document.getElementById('sellQuantity');
        if (!input || !this.currentTransaction) return;
        
        const quantity = parseInt(input.value);
        const totalEarnings = quantity * this.currentTransaction.sellPrice;
        const newCredits = this.game.gameState.credits + totalEarnings;
        const remainingInventory = this.currentTransaction.ownedQuantity - quantity;
        
        const elements = {
            'sellTotalEarnings': UI.formatCurrency(totalEarnings),
            'sellNewCredits': UI.formatCurrency(newCredits),
            'sellRemainingInventory': `${remainingInventory} units`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    confirmBuyTransaction() {
        const input = document.getElementById('buyQuantity');
        if (!input || !this.currentTransaction) return;
        
        const quantity = parseInt(input.value);
        const totalCost = quantity * this.currentTransaction.price;
        
        UI.showConfirmation({
            title: 'Confirm Purchase',
            message: `Are you sure you want to buy ${quantity} units of ${this.currentTransaction.name} for ${UI.formatCurrency(totalCost)}?`,
            onConfirm: () => this.executeBuyTransaction(quantity),
            onCancel: () => UI.closeModal('confirmModal')
        });
    }

    confirmSellTransaction() {
        const input = document.getElementById('sellQuantity');
        if (!input || !this.currentTransaction) return;
        
        const quantity = parseInt(input.value);
        const totalEarnings = quantity * this.currentTransaction.sellPrice;
        
        UI.showConfirmation({
            title: 'Confirm Sale',
            message: `Are you sure you want to sell ${quantity} units of ${this.currentTransaction.name} for ${UI.formatCurrency(totalEarnings)}?`,
            onConfirm: () => this.executeSellTransaction(quantity),
            onCancel: () => UI.closeModal('confirmModal')
        });
    }

    async executeBuyTransaction(quantity) {
        try {
            const response = await this.api.buyCommodity(this.currentTransaction.commodityId, quantity);
            
            UI.closeAllModals();
            await this.game.loadGameState();
            
            // Show success message with purchase details
            const purchaseMessage = `✅ Purchase successful! Bought ${quantity} units of ${this.currentTransaction.name} for ${UI.formatCurrency(quantity * this.currentTransaction.price)}`;
            UI.showMessage(purchaseMessage, 'success', 3000);
            
            // Automatically show cargo hold with the new commodity
            setTimeout(() => {
                this.game.showCargo();
            }, 1000);
            
            // Refresh market if currently shown
            if (document.getElementById('game-content').innerHTML.includes('Market')) {
                this.game.showMarket();
            }
            
        } catch (error) {
            UI.closeModal('confirmModal');
            UI.showMessage(`Purchase failed: ${error.message}`, 'error');
        }
    }

    async executeSellTransaction(quantity) {
        try {
            const response = await this.api.sellCommodity(this.currentTransaction.commodityId, quantity);
            
            UI.closeAllModals();
            await this.game.loadGameState();
            UI.showMessage(response.message, 'success');
            
            // Refresh cargo if currently shown
            if (document.getElementById('game-content').innerHTML.includes('Cargo Hold')) {
                this.game.showCargo();
            }
            
        } catch (error) {
            UI.closeModal('confirmModal');
            UI.showMessage(`Sale failed: ${error.message}`, 'error');
        }
    }
}