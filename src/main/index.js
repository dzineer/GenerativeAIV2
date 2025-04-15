const { app, BrowserWindow, ipcMain, BrowserView, nativeTheme, Menu } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { resolveMain, resolveService, resolveHandler } = require('./utils/paths');

// Import our new modules using resolved paths
const WindowManager = require(resolveMain('window-manager'));
const ThemeHandler = require(resolveHandler('theme'));
const PluginHandler = require(resolveHandler('plugins'));
const StoreService = require(resolveService('store'));
const { loadUiPanelPlugins } = require(resolveService('plugin-loader'));

require('./ipc-handlers/ui-panel-registry'); // Add this line to load the UI Panel Registry

const generateDebugDetails = () => {
  return {
    isPackaged: app.isPackaged,
    execPath: app.getPath('exe'),
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    userData: app.getPath('userData'),
    temp: app.getPath('temp'),
    // Add all important electron paths
    paths: {
      home: app.getPath('home'),
      appData: app.getPath('appData'),
      documents: app.getPath('documents'),
      downloads: app.getPath('downloads'),
      desktop: app.getPath('desktop'),
      logs: app.getPath('logs')
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PWD: process.env.PWD,
      PATH: process.env.PATH
    },
    platform: process.platform,
    arch: process.arch,
    versions: process.versions,
    cwd: process.cwd(),
    __dirname: __dirname,
    mainModuleFile: require.main?.filename || __filename
  }
}


// Enhanced startup logging
console.log('[Main] Starting main process with detailed path information...');
console.log('[Main] Process and environment info:', generateDebugDetails());

// Add directory existence checks
const criticalPaths = {
  dist: path.join(__dirname, '../dist'),
  public: path.join(__dirname, '../public'),
  plugins: path.join(__dirname, '../plugins'),
  resources: process.resourcesPath
};

console.log('[Main] Checking critical directory existence:');
// Verification of critical directories only...
Object.entries(criticalPaths).forEach(([key, dirPath]) => {
  const exists = fs.existsSync(dirPath);
  console.log(`[Main] ${key} directory (${dirPath}): ${exists ? 'EXISTS' : 'MISSING'}`);
  if (exists) {
    try {
      const contents = fs.readdirSync(dirPath);
      console.log(`[Main] ${key} directory contents:`, contents);
    } catch (err) {
      console.error(`[Main] Error reading ${key} directory:`, err);
    }
  }
});

class Application {
    constructor() {
        this.store = new StoreService();
        this.backendPluginWindows = new Map();
        this.uiPanelRegistry = {};
    }

    getPreloadPath(filename) {
      const possiblePaths = [
                path.join(__dirname, '../preload', filename),
                path.join(process.resourcesPath, 'app.asar', 'preload', filename),
                path.join(app.getAppPath(), 'preload', filename),
                path.join(app.getAppPath(), 'dist/preload', filename)
      ];

      console.log('[Main] Resolving preload path for:', filename);
      console.log('[Main] Possible preload paths:', possiblePaths);

      for (const testPath of possiblePaths) {
        const exists = fs.existsSync(testPath);
        console.log(`[Main] Checking path: ${testPath} - ${exists ? 'EXISTS' : 'MISSING'}`);
        if (exists) {
          console.log('[Main] Using preload path:', testPath);
          return testPath;
        }
      }

      console.error('[Main] No valid preload path found for:', filename);
      throw new Error(`Preload script not found: ${filename}`);
    }

    async initialize() {
        console.log('[Main] Starting app initialization...');

        // Initialize store
        await this.store.initialize();

        // Initialize window manager with preload paths
        this.windowManager = new WindowManager({
            main: this.getPreloadPath('main-preload.js'),
            statusBar: this.getPreloadPath('status-bar-preload.js')
        });

        // Load UI Panel plugins
        try {
            console.log('[Main] Loading UI Panel plugins...');
            this.uiPanelRegistry = await loadUiPanelPlugins();
            console.log('[Main] UI Panel plugins loaded:', this.uiPanelRegistry);
    } catch (error) {
            console.error('[Main] Failed to load UI Panel plugins:', error);
            this.uiPanelRegistry = {};
        }

        // Create main window
        await this.windowManager.createMainWindow();

        // Initialize handlers
        this.initializeHandlers();

        // Set up error handling
        this.setupErrorHandling();

        console.log('[Main] Initialization complete');
    }

    initializeHandlers() {
        // Initialize theme handler
        this.themeHandler = new ThemeHandler(
            this.store.get(),
            this.windowManager.getWindows()
        );
        this.themeHandler.registerHandlers();

        // Initialize plugin handler
        this.pluginHandler = new PluginHandler(
            this.uiPanelRegistry,
            this.backendPluginWindows
        );
        this.pluginHandler.registerHandlers();
    }

    setupErrorHandling() {
        process.on('uncaughtException', (error) => {
            console.error('[Main] Uncaught exception:', error);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('[Main] Unhandled rejection:', reason);
        });
    }

    determineIndexPath() {
        if (process.env.NODE_ENV === 'development') {
            return 'http://localhost:5173';
        }

    const possibleIndexPaths = [
      path.join(__dirname, '../dist/index.html'),
      path.join(app.getAppPath(), 'dist/index.html'),
      path.join(process.resourcesPath, 'app.asar/dist/index.html')
    ];

    for (const testPath of possibleIndexPaths) {
            if (fs.existsSync(testPath)) {
                return testPath;
            }
        }

      throw new Error('index.html not found');
    }
  }

// Create and initialize application
let application;

app.whenReady().then(async () => {
    console.log('[Main] App is ready, creating application instance...');
    application = new Application();
    await application.initialize();
}).catch(error => {
  console.error('[Main] Failed to initialize app:', error);
});

// Handle window management
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
    if (!application.windowManager.mainWindow) {
        await application.windowManager.createMainWindow();
        application.initializeHandlers();
    }
});

// Export for testing purposes
module.exports = Application; 