/**
 * Console Reporter - Formats and displays test results in the console
 */
const chalk = require('chalk');

class ConsoleReporter {
    constructor(options = {}) {
        this.options = {
            showBrowserLogs: true,
            showStackTraces: true,
            groupBySuite: true,
            ...options
        };
        
        this.indent = '  ';
        this.stats = {
            suites: 0,
            tests: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0
        };
    }

    /**
     * Handle test runner events
     */
    attachToRunner(runner) {
        runner.on('start', () => this.onStart());
        runner.on('testComplete', result => this.onTestComplete(result));
        runner.on('complete', results => this.onComplete(results));
        runner.on('error', error => this.onError(error));
    }

    /**
     * Handle test run start
     */
    onStart() {
        console.log(chalk.bold('\nStarting test run...\n'));
    }

    /**
     * Handle individual test completion
     */
    onTestComplete(result) {
        const icon = this.getStatusIcon(result.status);
        const duration = this.formatDuration(result.duration);
        
        // Print test result
        console.log(`${this.indent}${icon} ${result.name} ${chalk.gray(`(${duration})`)}`);
        
        // Print error if test failed
        if (result.status === 'failed' && result.error) {
            if (this.options.showStackTraces) {
                console.log(chalk.red(`${this.indent.repeat(2)}${result.error.stack}\n`));
            } else {
                console.log(chalk.red(`${this.indent.repeat(2)}${result.error.message}\n`));
            }
        }
        
        // Print browser logs if enabled and present
        if (this.options.showBrowserLogs && result.browserLogs?.length > 0) {
            console.log(chalk.gray(`${this.indent.repeat(2)}Browser Logs:`));
            result.browserLogs.forEach(log => {
                const level = this.getLogLevelColor(log.level);
                console.log(`${this.indent.repeat(3)}${level(log.content)}`);
            });
            console.log('');
        }
        
        // Update stats
        this.stats.tests++;
        if (result.status === 'passed') this.stats.passed++;
        if (result.status === 'failed') this.stats.failed++;
        if (result.status === 'skipped') this.stats.skipped++;
    }

    /**
     * Handle test run completion
     */
    onComplete(results) {
        this.stats.duration = results.duration;
        
        // Print summary
        console.log('\nTest Run Summary:');
        console.log(`${this.indent}Total Tests: ${chalk.bold(this.stats.tests)}`);
        console.log(`${this.indent}Passed: ${chalk.green.bold(this.stats.passed)}`);
        console.log(`${this.indent}Failed: ${chalk.red.bold(this.stats.failed)}`);
        console.log(`${this.indent}Skipped: ${chalk.yellow.bold(this.stats.skipped)}`);
        console.log(`${this.indent}Duration: ${chalk.bold(this.formatDuration(this.stats.duration))}\n`);
        
        // Print final status
        if (this.stats.failed > 0) {
            console.log(chalk.red.bold('✖ Tests Failed\n'));
        } else {
            console.log(chalk.green.bold('✓ All Tests Passed\n'));
        }
    }

    /**
     * Handle test runner errors
     */
    onError(error) {
        console.error(chalk.red.bold('\nTest Runner Error:'));
        console.error(chalk.red(`${this.indent}${error.stack || error.message}\n`));
    }

    /**
     * Get status icon with color
     */
    getStatusIcon(status) {
        switch (status) {
            case 'passed':
                return chalk.green('✓');
            case 'failed':
                return chalk.red('✖');
            case 'skipped':
                return chalk.yellow('○');
            default:
                return chalk.gray('?');
        }
    }

    /**
     * Get color function for log level
     */
    getLogLevelColor(level) {
        switch (level?.toLowerCase()) {
            case 'error':
                return chalk.red;
            case 'warn':
                return chalk.yellow;
            case 'info':
                return chalk.blue;
            case 'debug':
                return chalk.gray;
            default:
                return chalk.white;
        }
    }

    /**
     * Format duration in milliseconds to human readable string
     */
    formatDuration(ms) {
        if (ms < 1000) {
            return `${ms}ms`;
        }
        return `${(ms / 1000).toFixed(2)}s`;
    }
}

module.exports = ConsoleReporter; 