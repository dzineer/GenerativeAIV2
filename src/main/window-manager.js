const { BrowserWindow, BrowserView } = require('electron');
const path = require('path');

class WindowManager {
    constructor(preloadPaths) {
        this.mainWindow = null;
        this.statusBarView = null;
        this.preloadPaths = preloadPaths;
        this.statusBarHeight = 25;
    }

    setStatusBarBounds() {
        if (!this.mainWindow || !this.statusBarView) return;

        const contentBounds = this.mainWindow.getContentBounds();
        this.statusBarView.setBounds({
            x: 0,
            y: contentBounds.height - this.statusBarHeight,
            width: contentBounds.width,
            height: this.statusBarHeight
        });
    }

    async createMainWindow() {
        console.log('[WindowManager] Creating main window...');

        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: false,
                devTools: true,
                preload: this.preloadPaths.main
            }
        });

        // Load content based on environment
        try {
            if (process.env.NODE_ENV === 'development') {
                console.log('[WindowManager] Loading development URL');
                await this.mainWindow.loadURL('http://localhost:5173');
            } else {
                console.log('[WindowManager] Loading production file');
                await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
            }
        } catch (error) {
            console.error('[WindowManager] Failed to load content:', error);
        }

        // Enable keyboard shortcut for DevTools
        this.mainWindow.webContents.on('before-input-event', (event, input) => {
            if ((input.control || input.meta) && input.key.toLowerCase() === 'i') {
                console.log('[WindowManager] Opening DevTools');
                this.mainWindow.webContents.openDevTools();
                event.preventDefault();
            }
        });

        // Open DevTools by default in development
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }

        // Create status bar
        await this.createStatusBar();

        // Set up window event handlers
        this.setupEventHandlers();

        return this.mainWindow;
    }

    async createStatusBar() {
        console.log('[WindowManager] Creating status bar...');
        
        this.statusBarView = new BrowserView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: false,
                preload: this.preloadPaths.statusBar
            }
        });

        this.mainWindow.addBrowserView(this.statusBarView);
        this.setStatusBarBounds();
    }

    setupEventHandlers() {
        this.mainWindow.once('ready-to-show', () => {
            console.log('[WindowManager] Main window ready');
            this.setStatusBarBounds();
        });

        this.mainWindow.on('resize', () => {
            this.setStatusBarBounds();
        });

        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
            this.statusBarView = null;
        });

        // Add error handling for load failures
        this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error(`[WindowManager] Failed to load: ${errorDescription} (${errorCode})`);
        });
    }

    getWindows() {
        return {
            mainWindow: this.mainWindow,
            statusBarView: this.statusBarView
        };
    }
}

module.exports = WindowManager;