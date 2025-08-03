// API Communication Module
export class ApiClient {
    constructor(baseUrl = null) {
        // Auto-detect API base URL based on environment
        if (!baseUrl) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                this.baseUrl = 'http://localhost:3010';
            } else {
                // Use same domain with port 3010 for production
                this.baseUrl = `${window.location.protocol}//${window.location.hostname}:3010`;
            }
        } else {
            this.baseUrl = baseUrl;
        }
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

    // Fuel system endpoints
    async getFuelInfo() {
        return this.call('/game/fuel');
    }

    async buyFuel(planetId, quantity) {
        // Validate inputs
        if (planetId === undefined || quantity === undefined) {
            throw new Error('Planet ID and quantity are required');
        }
        
        if (typeof quantity !== 'number' || quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }

        return this.call('/game/fuel/buy', {
            method: 'POST',
            body: JSON.stringify({ planetId, quantity })
        });
    }

    async getTravelCost(planetId) {
        // Validate inputs
        if (planetId === undefined) {
            throw new Error('Planet ID is required');
        }
        
        if (typeof planetId !== 'number') {
            throw new Error('Planet ID must be a number');
        }

        return this.call(`/game/travel/cost/${planetId}`);
    }

    // Enhanced travel system endpoints
    async getPlanetDetails(planetId) {
        // Validate inputs
        if (planetId === undefined) {
            throw new Error('Planet ID is required');
        }
        
        if (typeof planetId !== 'number') {
            throw new Error('Planet ID must be a number');
        }

        return this.call(`/planets/${planetId}/details`);
    }

    async getPlanetDistanceInfo(planetId) {
        // Validate inputs
        if (planetId === undefined) {
            throw new Error('Planet ID is required');
        }
        
        if (typeof planetId !== 'number') {
            throw new Error('Planet ID must be a number');
        }

        return this.call(`/planets/${planetId}/distance`);
    }

    // Commodities system endpoints
    async getCommoditiesByPlanet(planetId) {
        // Validate inputs
        if (planetId === undefined) {
            throw new Error('Planet ID is required');
        }
        
        if (typeof planetId !== 'number') {
            throw new Error('Planet ID must be a number');
        }

        return this.call(`/planets/${planetId}/commodities`);
    }

    async getCommodityCategories() {
        return this.call('/commodities/categories');
    }
}