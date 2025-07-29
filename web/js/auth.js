// Authentication Module
import { UI } from './ui.js';

export class AuthManager {
    constructor(apiClient, gameManager) {
        this.api = apiClient;
        this.game = gameManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle Enter key in auth forms
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (usernameInput && passwordInput) {
            [usernameInput, passwordInput].forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.login();
                    }
                });
            });
        }

        // Auto-focus username field on page load
        if (usernameInput) {
            usernameInput.focus();
        }
    }

    async login() {
        console.log('🔑 Login attempt started...');
        
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        const messageEl = document.getElementById('auth-message');

        console.log('📝 Username:', username, 'Password length:', password?.length);

        if (!username || !password) {
            console.log('❌ Missing credentials');
            this.showAuthMessage('Please enter both username and password', 'error');
            return;
        }

        // Show loading state
        console.log('⏳ Showing loading state...');
        this.showAuthMessage('🔄 Logging in...', 'loading');
        this.setAuthButtonsDisabled(true);

        try {
            console.log('📡 Making API call...');
            const response = await this.api.login(username, password);
            console.log('✅ API response:', response);
            
            this.api.setAuthToken(response.token);
            this.showAuthMessage(`✅ ${response.message}`, 'success');
            
            console.log('🎮 Switching to game interface in 1 second...');
            setTimeout(() => {
                this.showGameInterface();
                this.game.loadGameState();
            }, 1000);
            
        } catch (error) {
            console.error('❌ Login error:', error);
            this.showAuthMessage(`❌ Login failed: ${error.message}`, 'error');
            this.setAuthButtonsDisabled(false);
            
            // Clear password field on failed login
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    }

    async register() {
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;

        if (!username || !password) {
            this.showAuthMessage('Please enter both username and password', 'error');
            return;
        }

        if (password.length < 6) {
            this.showAuthMessage('Password must be at least 6 characters long', 'error');
            return;
        }

        // Show loading state
        this.showAuthMessage('🔄 Creating account...', 'loading');
        this.setAuthButtonsDisabled(true);

        try {
            const response = await this.api.register(username, password);
            
            this.api.setAuthToken(response.token);
            this.showAuthMessage(`✅ ${response.message}`, 'success');
            
            setTimeout(() => {
                this.showGameInterface();
                this.game.loadGameState();
            }, 1000);
            
        } catch (error) {
            this.showAuthMessage(`❌ Registration failed: ${error.message}`, 'error');
            this.setAuthButtonsDisabled(false);
        }
    }

    showAuthMessage(message, type) {
        const messageEl = document.getElementById('auth-message');
        if (messageEl) {
            messageEl.innerHTML = `<div class="${type}">${message}</div>`;
        }
    }

    setAuthButtonsDisabled(disabled) {
        const buttons = document.querySelectorAll('#auth-section button');
        buttons.forEach(button => {
            button.disabled = disabled;
        });
    }

    showGameInterface() {
        const authSection = document.getElementById('auth-section');
        const gameSection = document.getElementById('game-section');
        
        if (authSection) {
            authSection.classList.add('hidden');
        }
        
        if (gameSection) {
            gameSection.classList.remove('hidden');
        }

        // Show welcome message
        UI.showMessage('🚀 Welcome to Sorstar! Your space trading adventure begins now.', 'success', 3000);
    }

    logout() {
        this.api.setAuthToken(null);
        
        const authSection = document.getElementById('auth-section');
        const gameSection = document.getElementById('game-section');
        
        if (authSection) {
            authSection.classList.remove('hidden');
        }
        
        if (gameSection) {
            gameSection.classList.add('hidden');
        }

        // Clear form fields
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const messageEl = document.getElementById('auth-message');
        
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (messageEl) messageEl.innerHTML = '';
        
        // Focus username field
        if (usernameInput) usernameInput.focus();
        
        UI.showMessage('👋 Logged out successfully. Safe travels, pilot!', 'success', 3000);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.api.authToken !== null;
    }

    // Auto-login for development (remove in production)
    async autoLogin(username, password) {
        document.getElementById('username').value = username;
        document.getElementById('password').value = password;
        await this.login();
    }
}