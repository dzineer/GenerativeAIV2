/**
 * HTML Reporter - Generates detailed HTML test reports
 */
const fs = require('fs').promises;
const path = require('path');

class HtmlReporter {
    constructor(options = {}) {
        this.options = {
            outputDir: 'test-results',
            includeScreenshots: true,
            includeBrowserLogs: true,
            includeStackTraces: true,
            ...options
        };

        this.results = [];
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
    async onStart() {
        await this.ensureOutputDir();
        this.results = [];
    }

    /**
     * Handle individual test completion
     */
    onTestComplete(result) {
        this.results.push(result);
        
        // Update stats
        this.stats.tests++;
        if (result.status === 'passed') this.stats.passed++;
        if (result.status === 'failed') this.stats.failed++;
        if (result.status === 'skipped') this.stats.skipped++;
    }

    /**
     * Handle test run completion
     */
    async onComplete(results) {
        this.stats.duration = results.duration;
        
        try {
            await this.generateReport();
            console.log(`HTML report generated at: ${path.join(this.options.outputDir, 'report.html')}`);
        } catch (error) {
            console.error('Failed to generate HTML report:', error);
        }
    }

    /**
     * Handle test runner errors
     */
    onError(error) {
        this.results.push({
            type: 'runner_error',
            error,
            timestamp: new Date()
        });
    }

    /**
     * Generate HTML report
     */
    async generateReport() {
        const html = this.generateHtml();
        const outputPath = path.join(this.options.outputDir, 'report.html');
        
        await fs.writeFile(outputPath, html, 'utf8');
        
        // Save screenshots if present
        if (this.options.includeScreenshots) {
            await this.saveScreenshots();
        }
    }

    /**
     * Save test failure screenshots
     */
    async saveScreenshots() {
        const screenshotsDir = path.join(this.options.outputDir, 'screenshots');
        await fs.mkdir(screenshotsDir, { recursive: true });

        for (const result of this.results) {
            if (result.screenshots?.length > 0) {
                for (const screenshot of result.screenshots) {
                    if (screenshot?.data) {
                        const filePath = path.join(screenshotsDir, screenshot.filename);
                        await fs.writeFile(filePath, screenshot.data, 'base64');
                    }
                }
            }
        }
    }

    /**
     * Generate HTML content
     */
    generateHtml() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Results</title>
    <style>
        ${this.getStyles()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Test Results</h1>
            ${this.generateSummaryHtml()}
        </header>
        
        <main>
            ${this.generateResultsHtml()}
        </main>
        
        <footer>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </footer>
    </div>
    <script>
        ${this.getJavaScript()}
    </script>
</body>
</html>`;
    }

    /**
     * Generate summary section HTML
     */
    generateSummaryHtml() {
        const passRate = (this.stats.passed / this.stats.tests * 100).toFixed(1);
        
        return `
<div class="summary">
    <div class="stat">
        <span class="label">Total Tests:</span>
        <span class="value">${this.stats.tests}</span>
    </div>
    <div class="stat passed">
        <span class="label">Passed:</span>
        <span class="value">${this.stats.passed}</span>
    </div>
    <div class="stat failed">
        <span class="label">Failed:</span>
        <span class="value">${this.stats.failed}</span>
    </div>
    <div class="stat skipped">
        <span class="label">Skipped:</span>
        <span class="value">${this.stats.skipped}</span>
    </div>
    <div class="stat">
        <span class="label">Pass Rate:</span>
        <span class="value">${passRate}%</span>
    </div>
    <div class="stat">
        <span class="label">Duration:</span>
        <span class="value">${this.formatDuration(this.stats.duration)}</span>
    </div>
</div>`;
    }

    /**
     * Generate test results HTML
     */
    generateResultsHtml() {
        return this.results.map(result => {
            if (result.type === 'runner_error') {
                return this.generateErrorHtml(result);
            }
            return this.generateTestResultHtml(result);
        }).join('\n');
    }

    /**
     * Generate HTML for a test result
     */
    generateTestResultHtml(result) {
        return `
<div class="test-result ${result.status}">
    <div class="test-header" onclick="toggleDetails(this)">
        <span class="status-icon">${this.getStatusIcon(result.status)}</span>
        <span class="test-name">${result.name}</span>
        <span class="duration">${this.formatDuration(result.duration)}</span>
    </div>
    
    <div class="test-details">
        ${result.suite ? `<div class="suite">Suite: ${result.suite}</div>` : ''}
        
        ${result.error ? this.generateErrorDetailsHtml(result.error) : ''}
        
        ${this.generateBrowserLogsHtml(result.browserLogs)}
        
        ${this.generateScreenshotsHtml(result.screenshots)}
    </div>
</div>`;
    }

    /**
     * Generate HTML for error details
     */
    generateErrorDetailsHtml(error) {
        if (!error) return '';
        
        return `
<div class="error-details">
    <h4>Error:</h4>
    <div class="error-message">${error.message}</div>
    ${this.options.includeStackTraces && error.stack ? `
        <pre class="stack-trace">${error.stack}</pre>
    ` : ''}
</div>`;
    }

    /**
     * Generate HTML for browser logs
     */
    generateBrowserLogsHtml(logs) {
        if (!this.options.includeBrowserLogs || !logs?.length) return '';
        
        return `
<div class="browser-logs">
    <h4>Browser Logs:</h4>
    <pre>${logs.map(log => `[${log.level}] ${log.content}`).join('\n')}</pre>
</div>`;
    }

    /**
     * Generate HTML for screenshots
     */
    generateScreenshotsHtml(screenshots) {
        if (!this.options.includeScreenshots || !screenshots?.length) return '';
        
        return `
<div class="screenshots">
    <h4>Screenshots:</h4>
    ${screenshots.map(screenshot => `
        <div class="screenshot">
            <img src="screenshots/${screenshot.filename}" alt="Test failure screenshot">
        </div>
    `).join('\n')}
</div>`;
    }

    /**
     * Get status icon
     */
    getStatusIcon(status) {
        switch (status) {
            case 'passed':
                return '✓';
            case 'failed':
                return '✖';
            case 'skipped':
                return '○';
            default:
                return '?';
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

    /**
     * Ensure output directory exists
     */
    async ensureOutputDir() {
        await fs.mkdir(this.options.outputDir, { recursive: true });
    }

    /**
     * Get CSS styles
     */
    getStyles() {
        return `
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    background: #f5f5f5;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

header {
    margin-bottom: 30px;
}

h1 {
    color: #333;
    margin: 0 0 20px;
}

.summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat {
    padding: 15px;
    border-radius: 6px;
    background: #f8f9fa;
}

.stat.passed { background: #d4edda; }
.stat.failed { background: #f8d7da; }
.stat.skipped { background: #fff3cd; }

.test-result {
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 6px;
    overflow: hidden;
}

.test-header {
    padding: 10px 15px;
    background: #f8f9fa;
    cursor: pointer;
    display: flex;
    align-items: center;
}

.test-result.passed .test-header { background: #d4edda; }
.test-result.failed .test-header { background: #f8d7da; }
.test-result.skipped .test-header { background: #fff3cd; }

.status-icon {
    margin-right: 10px;
    font-weight: bold;
}

.test-name {
    flex: 1;
}

.duration {
    color: #666;
    font-size: 0.9em;
}

.test-details {
    padding: 15px;
    display: none;
}

.error-details {
    margin: 15px 0;
    padding: 15px;
    background: #f8d7da;
    border-radius: 4px;
}

.stack-trace {
    margin: 10px 0;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 4px;
    overflow-x: auto;
}

.browser-logs {
    margin: 15px 0;
}

.browser-logs pre {
    margin: 10px 0;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 4px;
    overflow-x: auto;
}

.screenshots {
    margin: 15px 0;
}

.screenshot {
    margin: 10px 0;
}

.screenshot img {
    max-width: 100%;
    border: 1px solid #ddd;
    border-radius: 4px;
}

footer {
    margin-top: 30px;
    text-align: center;
    color: #666;
}`;
    }

    /**
     * Get JavaScript for interactivity
     */
    getJavaScript() {
        return `
function toggleDetails(header) {
    const details = header.nextElementSibling;
    const isHidden = details.style.display === 'none' || !details.style.display;
    details.style.display = isHidden ? 'block' : 'none';
}`;
    }
}

module.exports = HtmlReporter; 