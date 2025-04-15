/**
 * Test Runner - Core test execution engine with browser debugging integration
 */
const EventEmitter = require('events');
const path = require('path');
const { Worker } = require('worker_threads');

class TestRunner extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            parallel: true,
            maxWorkers: 4,
            timeout: 5000,
            reporter: 'console',
            captureScreenshots: true,
            browserLogs: true,
            ...options
        };

        this.tests = new Map();
        this.suites = new Map();
        this.hooks = {
            beforeAll: [],
            afterAll: [],
            beforeEach: [],
            afterEach: []
        };
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            duration: 0
        };
    }

    /**
     * Add a test suite
     */
    describe(name, fn) {
        const suite = {
            name,
            tests: new Map(),
            hooks: { ...this.hooks },
            parent: null
        };

        this.suites.set(name, suite);
        const currentSuite = this.currentSuite;
        this.currentSuite = suite;
        
        fn();
        
        this.currentSuite = currentSuite;
    }

    /**
     * Add a test case
     */
    test(name, fn, options = {}) {
        const test = {
            name,
            fn,
            suite: this.currentSuite,
            options: {
                timeout: this.options.timeout,
                retry: 0,
                ...options
            }
        };

        if (this.currentSuite) {
            this.currentSuite.tests.set(name, test);
        } else {
            this.tests.set(name, test);
        }
    }

    /**
     * Add a hook
     */
    addHook(type, fn) {
        if (this.currentSuite) {
            this.currentSuite.hooks[type].push(fn);
        } else {
            this.hooks[type].push(fn);
        }
    }

    /**
     * Run tests in parallel
     */
    async runParallel(tests) {
        const chunks = this.chunkTests(tests, this.options.maxWorkers);
        const results = await Promise.all(
            chunks.map(chunk => this.runInWorker(chunk))
        );
        return results.flat();
    }

    /**
     * Run tests in a worker thread
     */
    runInWorker(tests) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'worker.js'), {
                workerData: { tests, options: this.options }
            });

            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', code => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }

    /**
     * Run a single test with browser debugging integration
     */
    async runTest(test) {
        const startTime = Date.now();
        const result = {
            name: test.name,
            suite: test.suite?.name,
            status: 'pending',
            duration: 0,
            error: null,
            browserLogs: [],
            screenshots: []
        };

        try {
            // Run beforeEach hooks
            for (const hook of test.suite?.hooks.beforeEach || []) {
                await hook();
            }

            // Setup browser debugging if enabled
            if (this.options.browserLogs) {
                // Start collecting browser logs
                this.emit('startBrowserLogging', test);
            }

            // Run the test
            await Promise.race([
                test.fn(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), 
                    test.options.timeout)
                )
            ]);

            // Capture final browser state
            if (this.options.browserLogs) {
                result.browserLogs = await this.captureBrowserLogs();
            }

            result.status = 'passed';
            this.results.passed++;

        } catch (error) {
            result.status = 'failed';
            result.error = error;
            this.results.failed++;

            // Capture screenshot on failure if enabled
            if (this.options.captureScreenshots) {
                try {
                    result.screenshots.push(await this.captureFailureScreenshot(test));
                } catch (screenshotError) {
                    console.error('Failed to capture failure screenshot:', screenshotError);
                }
            }
        }

        // Run afterEach hooks
        for (const hook of test.suite?.hooks.afterEach || []) {
            try {
                await hook();
            } catch (error) {
                console.error('afterEach hook failed:', error);
            }
        }

        result.duration = Date.now() - startTime;
        this.emit('testComplete', result);
        return result;
    }

    /**
     * Capture browser logs during test execution
     */
    async captureBrowserLogs() {
        // Integration with browser debugger
        const { getConsoleLogs, getConsoleErrors, getNetworkLogs } = require('../debug/collectors/consoleCollector');
        
        try {
            const [consoleLogs, consoleErrors, networkLogs] = await Promise.all([
                getConsoleLogs(),
                getConsoleErrors(),
                getNetworkLogs()
            ]);

            return {
                console: consoleLogs,
                errors: consoleErrors,
                network: networkLogs
            };
        } catch (error) {
            console.error('Failed to capture browser logs:', error);
            return [];
        }
    }

    /**
     * Capture screenshot when a test fails
     */
    async captureFailureScreenshot(test) {
        const { takeScreenshot } = require('../debug/collectors/consoleCollector');
        
        try {
            const screenshot = await takeScreenshot();
            const filename = `failure_${test.name}_${Date.now()}.png`;
            // Save screenshot to test artifacts directory
            return {
                filename,
                data: screenshot
            };
        } catch (error) {
            console.error('Failed to capture failure screenshot:', error);
            return null;
        }
    }

    /**
     * Split tests into chunks for parallel execution
     */
    chunkTests(tests, chunks) {
        const result = Array.from({ length: chunks }, () => []);
        tests.forEach((test, index) => {
            result[index % chunks].push(test);
        });
        return result;
    }

    /**
     * Run all tests
     */
    async run() {
        const startTime = Date.now();
        this.emit('start');

        try {
            // Run beforeAll hooks
            for (const hook of this.hooks.beforeAll) {
                await hook();
            }

            // Collect all tests
            const allTests = [...this.tests.values()];
            for (const suite of this.suites.values()) {
                allTests.push(...suite.tests.values());
            }

            this.results.total = allTests.length;

            // Run tests
            const testResults = this.options.parallel
                ? await this.runParallel(allTests)
                : await Promise.all(allTests.map(test => this.runTest(test)));

            // Run afterAll hooks
            for (const hook of this.hooks.afterAll) {
                await hook();
            }

            this.results.duration = Date.now() - startTime;
            this.emit('complete', {
                ...this.results,
                tests: testResults
            });

            return this.results;

        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
}

// Convenience methods
TestRunner.prototype.beforeAll = function(fn) { this.addHook('beforeAll', fn); };
TestRunner.prototype.afterAll = function(fn) { this.addHook('afterAll', fn); };
TestRunner.prototype.beforeEach = function(fn) { this.addHook('beforeEach', fn); };
TestRunner.prototype.afterEach = function(fn) { this.addHook('afterEach', fn); };

// Create and export singleton instance
const testRunner = new TestRunner();
module.exports = {
    testRunner,
    TestRunner
}; 