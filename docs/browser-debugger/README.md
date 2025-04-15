# Browser Debugger Documentation

The Browser Debugger is a powerful system that allows you to monitor, debug, and audit web applications through automated browser interactions. It's built on top of Playwright and integrates with our virtualized directory system and Model Context Protocol (MCP).

## Features

- Console log monitoring
- Network activity tracking
- Screenshot capture
- Element inspection
- Accessibility auditing
- Performance metrics
- SEO analysis
- MCP integration for remote control

## Installation

1. Install dependencies:
```bash
npm install playwright
```

2. Ensure the following directory structure exists:
```
src/
  debugger/
    browserDebugger.js
    debuggerService.js
    mcpDebugger.js
```

## Basic Usage

```javascript
const DebuggerService = require('../src/debugger/debuggerService');

// Create a new debugger service
const debugger = new DebuggerService();

// Start debugging a webpage
await debugger.startDebugging('http://localhost:3000');

// Get debug information
const info = await debugger.getDebugInfo();
console.log('Console Logs:', info.consoleLogs);
console.log('Network Errors:', info.networkErrors);

// Take a screenshot
const screenshot = await debugger.browserDebugger.takeScreenshot('debug_view');
console.log('Screenshot saved:', screenshot);

// Stop debugging
await debugger.stopDebugging();
```

## MCP Integration

```javascript
const MCPDebugger = require('../src/debugger/mcpDebugger');

// Create MCP debugger instance
const mcpDebugger = new MCPDebugger();

// Run debugger mode
await mcpDebugger.runDebuggerMode('http://localhost:3000');

// Get console logs
const { logs } = await mcpDebugger.getConsoleLogs();

// Run full audit
const auditResults = await mcpDebugger.runAuditMode('http://localhost:3000');
console.log('Audit Results:', auditResults);
```

## Available Methods

### BrowserDebugger

- `initialize()`: Start the browser instance
- `navigateTo(url)`: Navigate to a specific URL
- `takeScreenshot(name?)`: Capture screenshot
- `getConsoleLogs()`: Get all console logs
- `getConsoleErrors()`: Get console errors
- `getNetworkErrors()`: Get network errors
- `getNetworkLogs()`: Get all network activity
- `getSelectedElement()`: Get info about selected element
- `clearLogs()`: Clear all captured logs
- `close()`: Close the browser instance

### DebuggerService

- `startDebugging(url)`: Start a debugging session
- `stopDebugging()`: Stop the current session
- `getDebugInfo()`: Get all debug information
- `clearLogs()`: Clear all logs
- `getSelectedElement()`: Get selected element info
- `runAccessibilityAudit()`: Run accessibility checks
- `runPerformanceAudit()`: Run performance analysis
- `runSEOAudit()`: Run SEO analysis

### MCPDebugger

- `getConsoleLogs()`: Get console logs
- `getConsoleErrors()`: Get console errors
- `getNetworkErrors()`: Get network errors
- `getNetworkLogs()`: Get all network logs
- `takeScreenshot()`: Take a screenshot
- `getSelectedElement()`: Get selected element
- `wipeLogs()`: Clear all logs
- `runAccessibilityAudit()`: Run accessibility audit
- `runPerformanceAudit()`: Run performance audit
- `runSEOAudit()`: Run SEO audit
- `runDebuggerMode(url)`: Start debug mode
- `runAuditMode(url)`: Run all audits

## Examples

### Basic Debugging

```javascript
const DebuggerService = require('../src/debugger/debuggerService');

async function debugWebpage() {
    const debugger = new DebuggerService();
    
    try {
        // Start debugging
        await debugger.startDebugging('http://localhost:3000');
        
        // Get debug info
        const info = await debugger.getDebugInfo();
        
        // Check for errors
        if (info.consoleErrors.length > 0) {
            console.log('Found errors:', info.consoleErrors);
        }
        
        // Take a screenshot
        await debugger.browserDebugger.takeScreenshot('error_state');
        
    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await debugger.stopDebugging();
    }
}
```

### Running Audits

```javascript
const MCPDebugger = require('../src/debugger/mcpDebugger');

async function runAudits() {
    const mcpDebugger = new MCPDebugger();
    
    try {
        const results = await mcpDebugger.runAuditMode('http://localhost:3000');
        
        console.log('Accessibility:', results.accessibility);
        console.log('Performance:', results.performance);
        console.log('SEO:', results.seo);
        
    } catch (error) {
        console.error('Audit failed:', error);
    }
}
```

## Best Practices

1. Always use try/catch blocks when working with the debugger
2. Close debugging sessions when done using `stopDebugging()`
3. Use the virtualized directory system for file operations
4. Leverage MCP for remote debugging when possible
5. Clear logs periodically to manage memory usage
6. Take screenshots when errors occur for better debugging
7. Run full audits in development to catch issues early

## Troubleshooting

### Common Issues

1. Browser fails to launch
   - Ensure Playwright is installed
   - Check system resources
   - Verify browser binaries are available

2. Screenshots not saving
   - Check virtualized directory permissions
   - Verify path boundary configuration
   - Ensure sufficient disk space

3. Network errors not captured
   - Check browser network settings
   - Verify URL is accessible
   - Check for CORS issues

### Debug Mode

To run in debug mode with extra logging:

```javascript
const mcpDebugger = new MCPDebugger();
await mcpDebugger.runDebuggerMode('http://localhost:3000');
const logs = await mcpDebugger.getConsoleLogs();
console.log('Debug Logs:', logs);
```

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use the virtualized directory system
5. Integrate with MCP where appropriate 