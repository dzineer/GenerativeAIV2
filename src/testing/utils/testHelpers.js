/**
 * Test Helpers - Common utilities for testing
 */

const { getConsoleLogs, getConsoleErrors, getNetworkLogs, 
        takeScreenshot, runAccessibilityAudit } = require('../../debug/collectors/consoleCollector');

/**
 * Wait for a condition to be true
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Timeout waiting for condition');
}

/**
 * Wait for an element to be present
 */
async function waitForElement(selector, timeout = 5000) {
    return waitFor(async () => {
        const element = document.querySelector(selector);
        return element !== null;
    }, timeout);
}

/**
 * Wait for network requests to complete
 */
async function waitForNetwork(timeout = 5000) {
    const startLogs = await getNetworkLogs();
    const startCount = startLogs.length;

    return waitFor(async () => {
        const currentLogs = await getNetworkLogs();
        return currentLogs.length === startCount && 
               currentLogs.every(log => log.status !== 'pending');
    }, timeout);
}

/**
 * Assert no console errors
 */
async function assertNoConsoleErrors() {
    const errors = await getConsoleErrors();
    if (errors.length > 0) {
        throw new Error(`Found ${errors.length} console errors:\n${errors.map(e => e.message).join('\n')}`);
    }
}

/**
 * Take a snapshot of the current state
 */
async function takeSnapshot() {
    const [consoleLogs, consoleErrors, networkLogs, screenshot] = await Promise.all([
        getConsoleLogs(),
        getConsoleErrors(),
        getNetworkLogs(),
        takeScreenshot()
    ]);

    return {
        timestamp: new Date(),
        console: consoleLogs,
        errors: consoleErrors,
        network: networkLogs,
        screenshot
    };
}

/**
 * Compare two values deeply
 */
function deepEqual(a, b) {
    if (a === b) return true;
    
    if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) {
        return false;
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) {
        return false;
    }
    
    return keysA.every(key => deepEqual(a[key], b[key]));
}

/**
 * Run accessibility checks
 */
async function checkAccessibility(options = {}) {
    const results = await runAccessibilityAudit();
    
    if (options.assertNoViolations && results.violations.length > 0) {
        throw new Error(`Found ${results.violations.length} accessibility violations:\n${
            results.violations.map(v => `${v.impact} - ${v.description}`).join('\n')
        }`);
    }
    
    return results;
}

/**
 * Create a mock function
 */
function createMock(implementation = () => {}) {
    const calls = [];
    const mock = (...args) => {
        calls.push(args);
        return implementation(...args);
    };
    
    mock.calls = calls;
    mock.mockImplementation = (newImpl) => implementation = newImpl;
    mock.mockClear = () => calls.length = 0;
    
    return mock;
}

module.exports = {
    waitFor,
    waitForElement,
    waitForNetwork,
    assertNoConsoleErrors,
    takeSnapshot,
    deepEqual,
    checkAccessibility,
    createMock
}; 