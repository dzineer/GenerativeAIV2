// Preload script for Electron
const { contextBridge, ipcRenderer } = require('electron');
const MenuActionsAPI = require('./api/menu-actions');

// API Definitions
const APIs = {
    'ui-panel-registry': {
        getRegistry: () => ipcRenderer.invoke('ui-panel:get-registry'),
        registerPanel: (panelConfig) => ipcRenderer.invoke('ui-panel:register', panelConfig),
        unregisterPanel: (panelId) => ipcRenderer.invoke('ui-panel:unregister', panelId)
    },

    'fs-service': {
        listFiles: (relativePath = '.') => ipcRenderer.invoke('fs:list-files', relativePath),
        readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
        writeFile: (filePath, content) => ipcRenderer.invoke('fs:write-file', { filePath, content })
    },

    theme: {
        getInitialState: () => ipcRenderer.invoke('theme:get-initial-state'),
        onUpdate: (callback) => {
            const subscription = (event, data) => callback(data);
            ipcRenderer.on('theme:set', subscription);
            return () => ipcRenderer.removeListener('theme:set', subscription);
        },
        toggle: () => ipcRenderer.invoke('theme:toggle')
    },

    'plugin-service': {
        loadPlugin: (pluginId) => ipcRenderer.invoke('plugin:load', pluginId),
        unloadPlugin: (pluginId) => ipcRenderer.invoke('plugin:unload', pluginId),
        getLoadedPlugins: () => ipcRenderer.invoke('plugin:get-loaded')
    },

    'menu-actions': MenuActionsAPI.create(),

    electron: {
        isPackaged: process.env.NODE_ENV === 'production',
        resourcesPath: process.resourcesPath,
        appPath: process.env.APP_PATH
    }
};

// Expose APIs through contextBridge
try {
    // Expose each API
    Object.entries(APIs).forEach(([name, api]) => {
        if (typeof window !== 'undefined' && window[name]) {
            console.warn(`[Preload] API '${name}' already exists on window object, skipping...`);
            return;
        }
        contextBridge.exposeInMainWorld(name, api);
        console.log(`[Preload] Exposed ${name} API`);
    });
} catch (error) {
    console.error('[Preload] Error exposing APIs:', error);
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('[Preload] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('[Preload] Unhandled rejection:', reason);
}); 