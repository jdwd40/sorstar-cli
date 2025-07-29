// API Communication Module
export class ApiClient {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.authToken = null;
    }

    setAuthToken(token) {
        this.authToken = token;
    }

    async call(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async register(username, password) {
        return this.call('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async login(username, password) {
        return this.call('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    // Game endpoints
    async getShips() {
        return this.call('/ships');
    }

    async getPlanets() {
        return this.call('/planets');
    }

    async getGameState() {
        return this.call('/game/state');
    }

    async startGame(shipId) {
        return this.call('/game/start', {
            method: 'POST',
            body: JSON.stringify({ shipId })
        });
    }

    async travel(planetId) {
        return this.call('/game/travel', {
            method: 'POST',
            body: JSON.stringify({ planetId })
        });
    }

    async getMarketPrices(planetId) {
        return this.call(`/market/${planetId}`);
    }

    async getCargo() {
        return this.call('/cargo');
    }

    async buyCommodity(commodityId, quantity) {
        return this.call('/buy', {
            method: 'POST',
            body: JSON.stringify({ commodityId, quantity })
        });
    }

    async sellCommodity(commodityId, quantity) {
        return this.call('/sell', {
            method: 'POST',
            body: JSON.stringify({ commodityId, quantity })
        });
    }

    async getStats() {
        return this.call('/stats');
    }

    async healthCheck() {
        return this.call('/health');
    }
}