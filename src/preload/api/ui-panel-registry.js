const { ipcRenderer } = require('electron');
const Logger = require('../utils/logger');

class UIPanelRegistryAPI {
    static create() {
        return {
            getRegistry: async () => {
                try {
                    Logger.log('UIPanelRegistry', 'Fetching UI Panel Registry');
                    const registry = await ipcRenderer.invoke('ui-panel:get-registry');
                    Logger.log('UIPanelRegistry', 'Registry fetched successfully:', registry);
                    return registry;
                } catch (error) {
                    Logger.error('UIPanelRegistry', 'Failed to fetch registry:', error);
                    throw error;
                }
            },

            registerPanel: async (panelConfig) => {
                try {
                    Logger.log('UIPanelRegistry', 'Registering panel:', panelConfig);
                    const result = await ipcRenderer.invoke('ui-panel:register', panelConfig);
                    Logger.log('UIPanelRegistry', 'Panel registered successfully:', result);
                    return result;
                } catch (error) {
                    Logger.error('UIPanelRegistry', 'Failed to register panel:', error);
                    throw error;
                }
            },

            unregisterPanel: async (panelId) => {
                try {
                    Logger.log('UIPanelRegistry', 'Unregistering panel:', panelId);
                    const result = await ipcRenderer.invoke('ui-panel:unregister', panelId);
                    Logger.log('UIPanelRegistry', 'Panel unregistered successfully:', result);
                    return result;
                } catch (error) {
                    Logger.error('UIPanelRegistry', 'Failed to unregister panel:', error);
                    throw error;
                }
            }
        };
    }
}

module.exports = UIPanelRegistryAPI; 