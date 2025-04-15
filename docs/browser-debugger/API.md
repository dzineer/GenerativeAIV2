# Browser Debugger API Reference

Detailed API documentation for the browser debugger system.

## BrowserDebugger

Core class for browser interaction and monitoring.

### Constructor

```javascript
const debugger = new BrowserDebugger();
```

### Methods

#### initialize()
Start the browser instance.
```javascript
await debugger.initialize();
```

#### navigateTo(url: string)
Navigate to a specific URL.
```javascript
await debugger.navigateTo('http://localhost:3000');
```

#### takeScreenshot(name?: string)
Capture a screenshot of the current page.
```javascript
const path = await debugger.takeScreenshot('error_state');
```
Returns: string (path to saved screenshot)

#### getConsoleLogs()
Get all console logs.
```javascript
const logs = debugger.getConsoleLogs();
```
Returns: Array<{type: string, text: string, timestamp: string}>

#### getConsoleErrors()
Get console error logs.
```javascript
const errors = debugger.getConsoleErrors();
```
Returns: Array<{type: 'error', text: string, timestamp: string}>

#### getNetworkErrors()
Get network error logs.
```javascript
const errors = debugger.getNetworkErrors();
```
Returns: Array<{url: string, error: string, timestamp: string}>

#### getNetworkLogs()
Get all network activity logs.
```javascript
const logs = debugger.getNetworkLogs();
```
Returns: Array<{url: string, status: number, timestamp: string}>

#### getSelectedElement()
Get information about the currently selected element.
```javascript
const element = await debugger.getSelectedElement();
```
Returns: {tagName: string, id: string, className: string, textContent: string}

#### clearLogs()
Clear all captured logs.
```javascript
debugger.clearLogs();
```

#### close()
Close the browser instance.
```javascript
await debugger.close();
```

## DebuggerService

High-level service for managing debugging sessions.

### Constructor

```javascript
const service = new DebuggerService();
```

### Methods

#### startDebugging(url: string)
Start a debugging session.
```javascript
await service.startDebugging('http://localhost:3000');
```

#### stopDebugging()
Stop the current debugging session.
```javascript
await service.stopDebugging();
```

#### getDebugInfo()
Get all debug information.
```javascript
const info = await service.getDebugInfo();
```
Returns:
```typescript
{
    url: string;
    timestamp: string;
    consoleLogs: Array<LogEntry>;
    consoleErrors: Array<LogEntry>;
    networkLogs: Array<NetworkEntry>;
    networkErrors: Array<NetworkError>;
    screenshot: string;
}
```

#### clearLogs()
Clear all logs in the current session.
```javascript
service.clearLogs();
```

#### getSelectedElement()
Get information about selected element.
```javascript
const element = await service.getSelectedElement();
```

#### runAccessibilityAudit()
Run accessibility checks.
```javascript
const audit = await service.runAccessibilityAudit();
```
Returns: AccessibilityAuditResult

#### runPerformanceAudit()
Run performance analysis.
```javascript
const metrics = await service.runPerformanceAudit();
```
Returns:
```typescript
{
    navigationStart: number;
    loadEventEnd: number;
    domComplete: number;
    domInteractive: number;
    loadTime: number;
    domReadyTime: number;
    interactiveTime: number;
}
```

#### runSEOAudit()
Run SEO analysis.
```javascript
const seoData = await service.runSEOAudit();
```
Returns:
```typescript
{
    title: string;
    metaDescription: string;
    headings: {
        h1: number;
        h2: number;
    };
    images: Array<{
        src: string;
        alt: string;
        hasAlt: boolean;
    }>;
    links: Array<{
        href: string;
        text: string;
        isInternal: boolean;
    }>;
}
```

## MCPDebugger

MCP integration for remote debugging control.

### Constructor

```javascript
const mcpDebugger = new MCPDebugger();
```

### Methods

#### getConsoleLogs()
Get console logs via MCP.
```javascript
const { logs } = await mcpDebugger.getConsoleLogs();
```

#### getConsoleErrors()
Get console errors via MCP.
```javascript
const { errors } = await mcpDebugger.getConsoleErrors();
```

#### getNetworkErrors()
Get network errors via MCP.
```javascript
const { errors } = await mcpDebugger.getNetworkErrors();
```

#### getNetworkLogs()
Get network logs via MCP.
```javascript
const { logs } = await mcpDebugger.getNetworkLogs();
```

#### takeScreenshot()
Take screenshot via MCP.
```javascript
const { screenshot } = await mcpDebugger.takeScreenshot();
```

#### getSelectedElement()
Get selected element via MCP.
```javascript
const { element } = await mcpDebugger.getSelectedElement();
```

#### wipeLogs()
Clear all logs via MCP.
```javascript
const { message } = await mcpDebugger.wipeLogs();
```

#### runAccessibilityAudit()
Run accessibility audit via MCP.
```javascript
const { audit } = await mcpDebugger.runAccessibilityAudit();
```

#### runPerformanceAudit()
Run performance audit via MCP.
```javascript
const { audit } = await mcpDebugger.runPerformanceAudit();
```

#### runSEOAudit()
Run SEO audit via MCP.
```javascript
const { audit } = await mcpDebugger.runSEOAudit();
```

#### runDebuggerMode(url: string)
Start debug mode via MCP.
```javascript
const { message, url } = await mcpDebugger.runDebuggerMode('http://localhost:3000');
```

#### runAuditMode(url: string)
Run all audits via MCP.
```javascript
const results = await mcpDebugger.runAuditMode('http://localhost:3000');
```
Returns:
```typescript
{
    accessibility: AccessibilityAuditResult;
    performance: PerformanceMetrics;
    seo: SEOData;
}
```

## Type Definitions

```typescript
interface LogEntry {
    type: string;
    text: string;
    timestamp: string;
}

interface NetworkEntry {
    url: string;
    status: number;
    timestamp: string;
}

interface NetworkError {
    url: string;
    error: string;
    timestamp: string;
}

interface ElementInfo {
    tagName: string;
    id: string;
    className: string;
    textContent: string;
}

interface AccessibilityAuditResult {
    // Playwright accessibility snapshot
}

interface PerformanceMetrics {
    navigationStart: number;
    loadEventEnd: number;
    domComplete: number;
    domInteractive: number;
    loadTime: number;
    domReadyTime: number;
    interactiveTime: number;
}

interface SEOData {
    title: string;
    metaDescription: string;
    headings: {
        h1: number;
        h2: number;
    };
    images: Array<{
        src: string;
        alt: string;
        hasAlt: boolean;
    }>;
    links: Array<{
        href: string;
        text: string;
        isInternal: boolean;
    }>;
}
``` 