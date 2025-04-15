// Mock browser APIs that aren't available in jsdom
global.console = {
    ...console,
    // Keep native behaviour for other methods, use mock implementations for debug logs
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        formData: () => Promise.resolve(new FormData()),
        headers: new Headers()
    })
);

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() {
        this.observe = jest.fn();
        this.unobserve = jest.fn();
        this.disconnect = jest.fn();
    }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() {
        this.observe = jest.fn();
        this.unobserve = jest.fn();
        this.disconnect = jest.fn();
    }
};

// Custom test environment setup
beforeAll(() => {
    // Add any global setup
});

afterAll(() => {
    // Clean up any global setup
});

beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Clear storages
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset document body
    document.body.innerHTML = '';
    
    // Clear any registered event listeners
    const oldAddEventListener = window.addEventListener;
    const oldRemoveEventListener = window.removeEventListener;
    
    window.addEventListener = jest.fn(oldAddEventListener);
    window.removeEventListener = jest.fn(oldRemoveEventListener);
});

afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
}); 