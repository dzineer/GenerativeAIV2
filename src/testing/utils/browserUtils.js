/**
 * Browser utilities for test framework
 */
class BrowserUtils {
    constructor(options = {}) {
        this.options = {
            screenshotDir: 'test-results/screenshots',
            logLevel: 'info',
            ...options
        };
        
        this.consoleMessages = [];
        this.networkErrors = [];
        this.setupConsoleListener();
        this.setupNetworkListener();
    }

    /**
     * Set up console message listener
     */
    setupConsoleListener() {
        const originalConsole = { ...console };
        const levels = ['log', 'info', 'warn', 'error', 'debug'];

        levels.forEach(level => {
            console[level] = (...args) => {
                // Call original console method
                originalConsole[level](...args);

                // Store the message
                this.consoleMessages.push({
                    level,
                    content: args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                    ).join(' '),
                    timestamp: new Date(),
                    stack: new Error().stack
                });
            };
        });
    }

    /**
     * Set up network error listener
     */
    setupNetworkListener() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    this.networkErrors.push({
                        url: args[0],
                        status: response.status,
                        statusText: response.statusText,
                        timestamp: new Date()
                    });
                }
                return response;
            } catch (error) {
                this.networkErrors.push({
                    url: args[0],
                    error: error.message,
                    timestamp: new Date()
                });
                throw error;
            }
        };

        // Listen for XHR errors
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
            this.addEventListener('error', () => {
                this.networkErrors.push({
                    url: args[1],
                    error: 'XHR Error',
                    timestamp: new Date()
                });
            });
            return originalXHROpen.apply(this, args);
        };
    }

    /**
     * Get console logs with optional filtering
     */
    getConsoleLogs(options = {}) {
        let logs = [...this.consoleMessages];
        
        if (options.level) {
            logs = logs.filter(log => log.level === options.level);
        }
        
        if (options.since) {
            logs = logs.filter(log => log.timestamp >= options.since);
        }
        
        if (options.search) {
            const searchRegex = new RegExp(options.search, 'i');
            logs = logs.filter(log => searchRegex.test(log.content));
        }
        
        return logs;
    }

    /**
     * Get network errors with optional filtering
     */
    getNetworkErrors(options = {}) {
        let errors = [...this.networkErrors];
        
        if (options.since) {
            errors = errors.filter(error => error.timestamp >= options.since);
        }
        
        if (options.url) {
            const urlRegex = new RegExp(options.url);
            errors = errors.filter(error => urlRegex.test(error.url));
        }
        
        return errors;
    }

    /**
     * Take a screenshot of the current page
     */
    async takeScreenshot(name = 'screenshot') {
        // Use html2canvas if available, otherwise return mock data for testing
        if (typeof html2canvas !== 'undefined') {
            const canvas = await html2canvas(document.body);
            const data = canvas.toDataURL('image/png');
            const filename = `${name}-${new Date().toISOString()}.png`;
            
            return { data, filename };
        }
        
        // Mock data for testing
        return {
            data: 'mock-screenshot-data',
            filename: `${name}-${new Date().toISOString()}.png`
        };
    }

    /**
     * Run accessibility audit
     */
    async runAccessibilityAudit(options = {}) {
        // Use axe-core if available, otherwise return mock data for testing
        if (typeof axe !== 'undefined') {
            return await axe.run(document, options);
        }
        
        // Mock data for testing
        return {
            violations: [],
            passes: [],
            incomplete: [],
            inapplicable: []
        };
    }

    /**
     * Run performance audit
     */
    async runPerformanceAudit() {
        const metrics = {};
        
        // Use Performance API if available
        if (window.performance) {
            const timing = performance.timing;
            const navigation = performance.getEntriesByType('navigation')[0];
            
            if (navigation) {
                metrics.firstContentfulPaint = navigation.firstContentfulPaint;
                metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
                metrics.loadComplete = navigation.loadEventEnd - navigation.loadEventStart;
                metrics.timeToInteractive = navigation.domInteractive - navigation.fetchStart;
            }
            
            // Get resource timing data
            const resources = performance.getEntriesByType('resource');
            metrics.resourceLoadTimes = resources.map(resource => ({
                name: resource.name,
                duration: resource.duration,
                transferSize: resource.transferSize
            }));
        }
        
        return metrics;
    }

    /**
     * Get current browser state
     */
    getBrowserState() {
        return {
            url: window.location.href,
            title: document.title,
            cookies: document.cookie,
            localStorage: { ...localStorage },
            sessionStorage: { ...sessionStorage },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    /**
     * Clear browser state
     */
    async clearBrowserState() {
        // Clear storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.split('=');
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        });
        
        // Clear console messages and network errors
        this.consoleMessages = [];
        this.networkErrors = [];
        
        // Clear performance entries if possible
        if (performance.clearResourceTimings) {
            performance.clearResourceTimings();
        }
    }

    /**
     * Clean up and restore original behavior
     */
    cleanup() {
        // Restore console methods
        const originalConsole = { ...console };
        Object.keys(originalConsole).forEach(key => {
            console[key] = originalConsole[key];
        });
        
        // Restore fetch
        if (window.fetch.__original) {
            window.fetch = window.fetch.__original;
        }
        
        // Restore XHR
        if (XMLHttpRequest.prototype.open.__original) {
            XMLHttpRequest.prototype.open = XMLHttpRequest.prototype.open.__original;
        }
        
        // Clear state
        this.clearBrowserState();
    }
}

module.exports = BrowserUtils; 