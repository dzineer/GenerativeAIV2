# Plugin System Design (Revised)

## 1. Goals

-   Allow extending application functionality via external JavaScript plugins.
-   **Prioritize security through process isolation, runtime sandboxing, a limited API, and a permission model.**
-   Provide a defined API for plugins to interact with the application in a controlled manner.
-   Enable discovery and loading of plugins from a designated directory.
-   Design should be additive, not requiring changes to existing UI or core application logic initially.

## 2. Core Concepts

-   **Plugin:** A self-contained unit of functionality, packaged as a directory containing code and a manifest file.
-   **Plugin Manifest (`package.json`):** Declares plugin metadata, entry point, activation events, **required permissions**, and contributions.
-   **Plugin Discovery:** Main process scans a predefined `plugins` directory.
-   **Plugin Host Process:** Each active plugin runs its JS code inside its own dedicated, hidden, **sandboxed** Electron `BrowserWindow` process (`sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`).
-   **Plugin API:** A **minimal and strictly controlled** set of functions exposed via `contextBridge` in a dedicated preload script (`pluginPreload.js`).
-   **Activation Events:** Conditions triggering plugin loading (e.g., `onStartup`, `onCommand`).
-   **Permission Model:** Plugins declare necessary capabilities in their manifest; the main process grants and enforces these permissions.

## 3. Directory Structure

```
<project_root>/
├── plugins/
│   ├── example-plugin-1/
│   │   ├── package.json  (Plugin Manifest)
│   │   └── main.js       (Plugin Code Entry Point)
├── public/
├── src/
│   ├── main.js           (Electron Main Process)
│   ├── preload.js        (Main Window Preload)
│   ├── pluginPreload.js  (Plugin Host Preload - NEW)
│   ├── App.jsx           (Main React App)
│   └── ...
├── package.json          (Application Manifest)
└── ...
```

## 4. Plugin Manifest (`package.json`)

```json
{
  "name": "example-plugin",
  "version": "0.1.0",
  "description": "An example plugin.",
  "main": "main.js",
  "electronPlugin": {
    // --- Activation ---
    "activationEvents": [ "onCommand:examplePlugin.sayHello" ],
    // --- Permissions (NEW) ---
    "permissions": [
      "notifications", // Permission to call pluginAPI.notify
      // "filesystem:read:/workspace", // Example future permission
      // "network:api.example.com" // Example future permission
    ],
    // --- Contributions ---
    "contributes": {
      "commands": [
        {
          "command": "examplePlugin.sayHello",
          "title": "Say Hello"
        }
      ]
      // Future: "configuration", "statusBarItems", etc.
    }
  }
}
```

## 5. Plugin Host Process

-   Managed by `src/main.js`.
-   Separate, hidden (`show: false`) `BrowserWindow` per activated plugin.
-   **WebPreferences:**
    -   `nodeIntegration: false`
    -   `contextIsolation: true`
    -   `sandbox: true` **(Critical for OS-level sandboxing)**
    -   `preload: path.join(__dirname, 'pluginPreload.js')`
-   Loads a minimal internal HTML host page.

## 6. Plugin API (`pluginAPI`)

-   Exposed via `contextBridge` in `src/pluginPreload.js`.
-   **Initial Proposed API Surface:** (Main process *must* check declared permissions before executing)
    -   `pluginAPI.log(level, message)`: Always allowed. Sends log to main process.
    -   `pluginAPI.registerCommand(commandId, callback)`: Always allowed. Registers command implementation.
    -   `pluginAPI.notify(message)`: Requires `"notifications"` permission. Asks main process to show notification.
    // - `pluginAPI.getConfiguration(section?)`: Always allowed (can be namespaced). Gets config from main process.
    // - `pluginAPI.storage.get(key)`, `pluginAPI.storage.set(key, value)`: Future addition, requires permission, uses main process `electron-store` scoped to the plugin.
    // - `pluginAPI.secrets.get(key)`, `pluginAPI.secrets.set(key, value)`: Future addition, requires permission, uses main process `safeStorage` scoped to the plugin.

## 7. Communication (IPC)

-   `pluginAPI` methods use `ipcRenderer.invoke` or `send`.
-   Main process (`src/main.js`) implements `ipcMain.handle` / `on` listeners.
-   **Main process MUST validate sender identity AND check plugin's declared permissions** before fulfilling requests from the `pluginAPI`.

## 8. Security Considerations

-   **Sandboxing (`sandbox: true`)** is the primary defense layer.
-   **`contextIsolation: true`** prevents direct DOM/global access between preload and plugin scripts.
-   **Minimal Plugin API:** Only expose absolutely necessary functionality. Avoid exposing general-purpose IPC or Node modules.
-   **Permission Model:** Central to preventing overreach. Plugins must declare needed capabilities.
-   **IPC Validation:** Sanitize inputs and rigorously check sender identity and permissions in the main process.
-   **Dependency Scanning:** While outside the runtime architecture, strongly recommend users/developers scan plugin dependencies for known vulnerabilities (e.g., using `npm audit`, Snyk).
-   **Secure Storage:** Plan for secure, scoped storage (`electron-store`, `safeStorage`) managed by the main process if plugins need persistence.

## 9. Future Enhancements

-   Implement user consent prompts for permissions during installation/activation.
-   Develop APIs for contributing to UI (Status Bar, Panels, Command Palette).
-   Plugin lifecycle management (install/uninstall/update).
-   Configuration system integration. 