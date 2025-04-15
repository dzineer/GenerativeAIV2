const { ipcMain } = require('electron');
const path = require('path');
const logger = require('../utils/logger');

class UIPanelRegistry {
    constructor() {
        this.panels = new Map();
        this.setupDefaultPanels();
        this.setupHandlers();
    }

    setupDefaultPanels() {
        // File Explorer panel
        this.panels.set('file-explorer', {
            id: 'file-explorer',
            name: 'File Explorer',
            component: 'plugins/file-explorer/index',
            position: 'left'
        });

        // Monaco Editor panel
        this.panels.set('editor', {
            id: 'editor',
            name: 'Monaco Editor',
            component: 'plugins/monaco-editor/index',
            position: 'center'
        });

        logger.info('Default panels have been set up');
    }

    setupHandlers() {
        ipcMain.handle('ui-panel:get-registry', () => {
            logger.debug('Getting UI Panel Registry');
            return Array.from(this.panels.values());
        });

        ipcMain.handle('ui-panel:register', (event, panelConfig) => {
            if (!panelConfig.id) {
                throw new Error('Panel ID is required');
            }
            console.log('[UIPanelRegistry] Registering panel:', panelConfig);
            this.panels.set(panelConfig.id, panelConfig);
            return { success: true, id: panelConfig.id };
        });

        ipcMain.handle('ui-panel:unregister', (event, panelId) => {
            if (!this.panels.has(panelId)) {
                throw new Error('Panel not found');
            }
            console.log('[UIPanelRegistry] Unregistering panel:', panelId);
            this.panels.delete(panelId);
            return { success: true };
        });
    }

    cleanup() {
        ipcMain.removeHandler('ui-panel:get-registry');
        ipcMain.removeHandler('ui-panel:register');
        ipcMain.removeHandler('ui-panel:unregister');
    }
}

module.exports = new UIPanelRegistry(); 