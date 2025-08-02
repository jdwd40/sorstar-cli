// UI Utility Module
export class UI {
    static showMessage(message, type = 'info', duration = 5000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.innerHTML = message;
        
        // Insert at the top of game content
        const gameContent = document.getElementById('game-content');
        if (gameContent) {
            gameContent.insertBefore(messageDiv, gameContent.firstChild);
            
            // Auto-remove after duration
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, duration);
        }
    }

    static showLoading(message = 'Loading...') {
        const gameContent = document.getElementById('game-content');
        if (gameContent) {
            gameContent.innerHTML = `<div class="loading">${message}</div>`;
        }
    }

    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        }
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scroll
        }
    }

    static closeAllModals() {
        const modals = ['buyModal', 'sellModal', 'confirmModal'];
        modals.forEach(modalId => this.closeModal(modalId));
    }

    static showConfirmation(options) {
        const { title, message, onConfirm, onCancel } = options;
        
        const modalContent = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 1.1em; margin-bottom: 15px;">${message}</div>
            </div>
            
            <div class="modal-buttons">
                <button class="btn-confirm" onclick="handleConfirm()">✅ Confirm</button>
                <button class="btn-cancel" onclick="handleCancel()">❌ Cancel</button>
            </div>
        `;
        
        // Store callbacks globally for buttons
        window.handleConfirm = () => {
            onConfirm();
            delete window.handleConfirm;
            delete window.handleCancel;
        };
        
        window.handleCancel = () => {
            onCancel();
            delete window.handleConfirm;
            delete window.handleCancel;
        };
        
        document.getElementById('confirmModalContent').innerHTML = modalContent;
        this.showModal('confirmModal');
    }

    static updateGameStats(gameState) {
        if (!gameState) return;
        
        // Build fuel display
        let fuelDisplay = '';
        if (gameState.fuel) {
            const fuelPercentage = Math.round((gameState.fuel.currentFuel / gameState.fuel.maxFuel) * 100);
            const fuelColor = fuelPercentage > 50 ? 'var(--success-color)' : 
                             fuelPercentage > 25 ? 'orange' : 'var(--error-color)';
            fuelDisplay = `<div>⛽ <strong>Fuel:</strong> <span style="color: ${fuelColor};">${gameState.fuel.currentFuel}/${gameState.fuel.maxFuel} (${fuelPercentage}%)</span></div>`;
        }
        
        const statsHtml = `
            <div>💰 <strong>Credits:</strong> ${gameState.credits.toLocaleString()}</div>
            <div>🌍 <strong>Location:</strong> ${gameState.planetName}</div>
            <div>🚀 <strong>Ship:</strong> ${gameState.shipName}</div>
            <div>📦 <strong>Cargo:</strong> ${gameState.totalCargo || 0}/${gameState.cargoCapacity} units</div>
            ${fuelDisplay}
            <div>⏱️ <strong>Turns Used:</strong> ${gameState.turnsUsed}</div>
            <div>👨‍🚀 <strong>Pilot:</strong> ${gameState.username || 'Unknown'}</div>
        `;
        
        const statsElement = document.getElementById('game-stats');
        if (statsElement) {
            statsElement.innerHTML = statsHtml;
        }
    }

    static showGameButtons(hasGame) {
        const buttons = {
            'start-game-btn': !hasGame,
            'market-btn': hasGame,
            'cargo-btn': hasGame,
            'travel-btn': hasGame
        };
        
        Object.entries(buttons).forEach(([buttonId, show]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.style.display = show ? 'block' : 'none';
            }
        });
    }

    static formatCurrency(amount) {
        return `${amount.toLocaleString()} ⚡`;
    }

    static formatPercentage(value, max) {
        return Math.round((value / max) * 100);
    }

    static createTable(headers, rows, options = {}) {
        let html = '<div class="table-container"><table>';
        
        // Headers
        html += '<tr>';
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr>';
        
        // Rows
        rows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                html += `<td>${cell}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</table></div>';
        return html;
    }

    static createEmptyState(icon, title, subtitle) {
        return `
            <div class="empty-state">
                <div class="icon">${icon}</div>
                <div>${title}</div>
                <div style="margin-top: 10px; font-size: 0.9em;">${subtitle}</div>
            </div>
        `;
    }

    static isMobile() {
        return window.innerWidth <= 768;
    }

    static setupMobileOptimizations() {
        // Prevent zoom on iOS when focusing inputs
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport && this.isMobile()) {
            viewport.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
            );
        }

        // Add touch-friendly classes
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }
    }

    static setupModalCloseHandlers() {
        // Close modals when clicking outside
        window.onclick = (event) => {
            const modals = ['buyModal', 'sellModal', 'confirmModal'];
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (event.target === modal) {
                    this.closeModal(modalId);
                }
            });
        };

        // Close modals with escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    // Commodity Category Enhancement Methods
    static createCategoryHeader(category) {
        return `
            <div class="commodity-category-header" style="background-color: ${category.color || '#666'}; border-radius: var(--radius); padding: 10px; margin: 15px 0 10px 0;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5em;">${category.icon || '📦'}</span>
                    <div>
                        <h4 style="margin: 0; color: white;">${category.name}</h4>
                        <div style="font-size: 0.9em; opacity: 0.9; color: white;">${category.description || ''}</div>
                        <div style="font-size: 0.8em; opacity: 0.8; color: white;">${category.totalTypes || 0} types available</div>
                    </div>
                </div>
            </div>
        `;
    }

    static getCategoryIcon(category) {
        return `
            <span class="category-icon" title="${category.name}">
                ${category.icon || '📦'} ${category.name}
            </span>
        `;
    }

    static getAvailabilityIndicator(availability) {
        const indicators = {
            'abundant': { icon: '🟢', text: 'Abundant', color: 'var(--success-color)' },
            'common': { icon: '🟡', text: 'Common', color: '#FFA500' },
            'limited': { icon: '🟠', text: 'Limited', color: '#FF6347' },
            'rare': { icon: '🔴', text: 'Rare', color: 'var(--error-color)' },
            'scarce': { icon: '🔴', text: 'Scarce', color: '#8B0000' }
        };

        const indicator = indicators[availability] || indicators['common'];
        return `
            <span style="color: ${indicator.color}; font-weight: bold;">
                ${indicator.icon} ${indicator.text}
            </span>
        `;
    }

    static getPriceModifierDisplay(commodity) {
        const modifier = commodity.priceModifier || 0;
        const percentage = Math.round(modifier * 100);
        
        if (percentage === 0) {
            return '<span style="color: #666;">🔸 Market Price</span>';
        }
        
        const isPositive = percentage > 0;
        const color = isPositive ? 'var(--error-color)' : 'var(--success-color)';
        const arrow = isPositive ? '🔺' : '🔽';
        const sign = isPositive ? '+' : '';
        
        return `
            <span style="color: ${color}; font-weight: bold;">
                ${arrow} ${sign}${percentage}%
            </span>
        `;
    }

    static getRarityIndicator(commodity) {
        const stock = commodity.stock || 0;
        const availability = commodity.availability || 'common';
        
        let indicator;
        if (availability === 'abundant' || stock > 200) {
            indicator = { icon: '🟢', text: 'Common' };
        } else if (availability === 'rare' || stock < 20) {
            indicator = { icon: '🔴', text: 'Rare' };
        } else if (availability === 'limited' || stock < 50) {
            indicator = { icon: '🟠', text: 'Limited' };
        } else {
            indicator = { icon: '🟡', text: 'Available' };
        }
        
        return `${indicator.icon} ${indicator.text}`;
    }

    static createPlanetTypeBadge(planetType) {
        const typeStyles = {
            'Trade Hub': { icon: '🏛️', color: '#4169E1' },
            'Industrial': { icon: '🏭', color: '#8B4513' },
            'Agricultural': { icon: '🌾', color: '#228B22' },
            'Mining': { icon: '⛏️', color: '#B8860B' },
            'Research': { icon: '🔬', color: '#9370DB' },
            'Energy': { icon: '⚡', color: '#FFD700' },
            'Forest': { icon: '🌲', color: '#228B22' },
            'Desert': { icon: '🏜️', color: '#DEB887' },
            'Ocean': { icon: '🌊', color: '#1E90FF' },
            'City': { icon: '🏙️', color: '#696969' }
        };

        const style = typeStyles[planetType] || { icon: '🌍', color: '#666' };
        
        return `
            <span class="planet-type-badge" style="
                background-color: ${style.color}; 
                color: white; 
                padding: 4px 8px; 
                border-radius: 12px; 
                font-size: 0.8em; 
                font-weight: bold;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            ">
                ${style.icon} ${planetType}
            </span>
        `;
    }

    static getCommodityCategory(commodity) {
        return commodity.category || 'Uncategorized';
    }
}