const { ipcMain } = require('electron');

class PluginHandler {
    constructor(pluginRegistry, backendPlugins) {
        this.pluginRegistry = pluginRegistry;
        this.backendPlugins = backendPlugins;
    }

    registerHandlers() {
        console.log('[Plugins] Registering IPC handlers...');

        ipcMain.handle('get-ui-panel-registry', async () => {
            console.log('[Plugins] Handling registry request. Registry:', this.pluginRegistry);
            if (!this.pluginRegistry || Object.keys(this.pluginRegistry).length === 0) {
                console.warn('[Plugins] Registry is empty or not initialized!');
            }
            return this.pluginRegistry;
        });

        ipcMain.handle('plugin:log', (event, level, message) => {
            const senderWebContentsId = event.sender.id;
            const pluginName = this.backendPlugins.get(senderWebContentsId) || 'UnknownPlugin';
            console.log(`[Plugin][${pluginName}][${level.toUpperCase()}] ${message}`);
        });

        console.log('[Plugins] IPC handlers registered');
    }
}

module.exports = PluginHandler;
