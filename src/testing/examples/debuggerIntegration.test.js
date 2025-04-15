const { TestRunner } = require('../testRunner');
const { waitFor, waitForElement, assertNoConsoleErrors } = require('../utils/testHelpers');

describe('Browser Debugger Integration Tests', () => {
    let runner;
    
    beforeEach(async () => {
        runner = new TestRunner({
            reporters: ['console', 'html'],
            browserDebug: true,
            screenshotOnFailure: true
        });
    });

    afterEach(async () => {
        await runner.cleanup();
    });

    test('should capture console logs', async () => {
        // Simulate some console activity
        console.log('Test log message');
        console.warn('Warning message');
        console.error('Error message');

        const logs = await runner.getBrowserLogs();
        
        expect(logs).toContainEqual(expect.objectContaining({
            level: 'log',
            content: 'Test log message'
        }));
        expect(logs).toContainEqual(expect.objectContaining({
            level: 'warn',
            content: 'Warning message'
        }));
        expect(logs).toContainEqual(expect.objectContaining({
            level: 'error',
            content: 'Error message'
        }));
    });

    test('should capture network errors', async () => {
        // Simulate a failed network request
        try {
            await fetch('http://non-existent-url.com');
        } catch (error) {
            // Expected error
        }

        const networkErrors = await runner.getNetworkErrors();
        expect(networkErrors.length).toBeGreaterThan(0);
        expect(networkErrors[0]).toHaveProperty('error');
    });

    test('should take screenshots on failure', async () => {
        // This test will fail and trigger a screenshot
        try {
            await waitForElement('#non-existent-element', 1000);
        } catch (error) {
            const screenshot = await runner.takeScreenshot();
            expect(screenshot).toBeTruthy();
            expect(screenshot).toHaveProperty('data');
            expect(screenshot).toHaveProperty('filename');
            throw error; // Re-throw to mark test as failed
        }
    });

    test('should handle accessibility testing', async () => {
        // Add some test content to the page
        document.body.innerHTML = `
            <button>Click me</button>
            <img src="test.jpg">
        `;

        const results = await runner.runAccessibilityAudit();
        expect(results.violations).toEqual([
            expect.objectContaining({
                impact: 'critical',
                help: expect.stringContaining('img-alt')
            })
        ]);
    });

    test('should track performance metrics', async () => {
        const metrics = await runner.runPerformanceAudit();
        
        expect(metrics).toHaveProperty('firstContentfulPaint');
        expect(metrics).toHaveProperty('timeToInteractive');
        expect(metrics.firstContentfulPaint).toBeLessThan(2000); // 2s threshold
    });

    test('should support async operations with waitFor', async () => {
        let flag = false;
        setTimeout(() => { flag = true; }, 1000);

        await waitFor(() => flag, 2000);
        expect(flag).toBe(true);
    });

    test('should verify no console errors occur', async () => {
        // This should pass as no errors are logged
        await assertNoConsoleErrors();

        // Now log an error - this should make the assertion fail
        console.error('Test error');
        await expect(assertNoConsoleErrors()).rejects.toThrow();
    });

    test('should capture and verify browser state', async () => {
        // Set some browser state
        localStorage.setItem('testKey', 'testValue');
        document.cookie = 'testCookie=value';

        const state = await runner.getBrowserState();
        expect(state.localStorage).toHaveProperty('testKey', 'testValue');
        expect(state.cookies).toContain('testCookie=value');
    });

    test('should support parallel test execution', async () => {
        const results = await Promise.all([
            runner.runInParallel(() => {
                return new Promise(resolve => setTimeout(() => resolve('test1'), 1000));
            }),
            runner.runInParallel(() => {
                return new Promise(resolve => setTimeout(() => resolve('test2'), 1000));
            })
        ]);

        expect(results).toEqual(['test1', 'test2']);
    });
}); 