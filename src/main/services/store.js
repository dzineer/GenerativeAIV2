class StoreService {
    constructor() {
        this.store = null;
    }

    async initialize() {
        console.log('[Store] Initializing...');
        const Store = (await import('electron-store')).default;
        this.store = new Store({
            defaults: {
                theme: 'system'
            }
        });
        console.log(`[Store] Initialized at: ${this.store.path}`);
        return this.store;
    }

    get() {
        return this.store;
    }
}

module.exports = StoreService;
