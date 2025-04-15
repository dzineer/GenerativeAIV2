# Build Notes & Development Expectations

This document outlines the process for building the Vibe AI Studio application and clarifies certain behaviors observed during development, particularly on macOS.

## Building the Application

**Dependencies:**

The build process relies on several key development dependencies:

*   `vite`: Handles the bundling of the renderer process code (React app).
*   `vite-plugin-electron`: Integrates Vite with Electron, allowing Vite to manage the main process build and ensuring compatibility.
*   `electron-builder`: Packages the application into distributable formats (e.g., `.app`, `.dmg`, `.exe`).

**Build Command:**

To create a production build, run the following command from the project root:

```bash
npm run build
```

This command triggers the Vite build process for both the renderer and main processes (managed by `vite-plugin-electron`) and then uses `electron-builder` to package the output located in the `dist/` and `dist-electron/` directories into a platform-specific application package.

**Output:**

The final packaged application will be located in the `release/` directory (or as configured in `electron-builder` settings in `package.json`).

## Development Environment

**Running in Development:**

To run the application in development mode with hot-reloading, use:

```bash
npm run dev
```

**macOS Application Menu Label ("Electron" vs. "Vibe AI Studio"):**

During development (`npm run dev`) on macOS, you might notice that the first item in the application menu bar (the one bolded, next to the Apple logo) is labeled "Electron" instead of "Vibe AI Studio".

*   **Why this happens:** macOS ignores the `label` property set for the *first* menu item in the template provided to `Menu.setApplicationMenu()`. Instead, it uses the application's name defined in its `Info.plist` file (specifically the `CFBundleName` key).
*   **Development Behavior:** In development mode, Electron doesn't have a fully packaged `Info.plist` with the final `productName`. It defaults to showing "Electron".
*   **Production Behavior:** The `electron-builder` process, triggered by `npm run build`, correctly sets the `productName` (defined in `package.json` -> `build` -> `productName`) within the packaged application's `Info.plist`.
*   **Conclusion:** Seeing "Electron" as the application menu label during development on macOS is **expected behavior**. The correctly branded name ("Vibe AI Studio") will appear in the final built application. No code change is needed to "fix" the development label.

## Plugin System

The application uses a plugin system where UI panels and potentially backend functionalities are loaded dynamically from the `plugins/` directory. Each plugin requires a `package.json` manifest file defining its contributions. Refer to `status.md` or the plugin documentation for details on creating plugins. 