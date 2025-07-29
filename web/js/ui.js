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
        
        const statsHtml = `
            <div>💰 <strong>Credits:</strong> ${gameState.credits.toLocaleString()}</div>
            <div>🌍 <strong>Location:</strong> ${gameState.planetName}</div>
            <div>🚀 <strong>Ship:</strong> ${gameState.shipName}</div>
            <div>📦 <strong>Cargo:</strong> ${gameState.totalCargo || 0}/${gameState.cargoCapacity} units</div>
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
}