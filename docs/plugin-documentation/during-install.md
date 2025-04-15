# Plugin Deployment Guide

## Overview
This document describes how plugins are deployed and loaded in the Vibe AI Studio application.

## Plugin Directory Structure
```
resources/
├── app.asar
└── plugins/
    ├── file-explorer-provider/
    │   ├── package.json
    │   └── FileExplorerPanel.js
    └── monaco-editor-provider/
        ├── package.json
        └── EditorPanel.js
```

## Development vs Production
### Development
- Plugins are loaded from the `plugins/` directory in the project root
- JSX files are used directly
- Relative paths are used for imports

### Production
- Plugins are stored in `resources/plugins/` outside the app.asar
- JS files are used (compiled from JSX)
- Absolute paths are used from the resources directory

## Plugin Package Structure
Each plugin must have:
1. A `package.json` with:
   ```json
   {
     "name": "plugin-name",
     "version": "1.0.0",
     "uiPanels": {
       "panelId": {
         "component": "./ComponentName.jsx"
       }
     }
   }
   ```
2. The component file specified in the manifest

## Build Process
1. Plugins are bundled during the build process
2. electron-builder configuration:
   - Plugins are copied to `resources/plugins`
   - Plugins are excluded from asar packaging
   - Plugin directory is marked for unpacking

## Loading Process
1. Main Process:
   - Scans plugin directory based on environment
   - Reads and validates plugin manifests
   - Creates registry of available plugins

2. Renderer Process:
   - Receives plugin registry via IPC
   - Dynamically imports plugin components
   - Handles both production and development paths

## Troubleshooting
Common issues and solutions:
1. Plugin not found:
   - Check plugin directory structure
   - Verify manifest file
   - Check build configuration

2. Import errors:
   - Verify path resolution
   - Check file extensions (.jsx vs .js)
   - Confirm plugin is properly bundled

3. Component loading fails:
   - Check component exports
   - Verify dependencies are available
   - Check console for specific error messages 