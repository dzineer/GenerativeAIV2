const Bridge = require('../core/bridge');
const Logger = require('../utils/logger');

class PluginAPI {
    static create() {
        Logger.log('PluginAPI', 'Creating plugin API');
        return {
            getUiPanelRegistry: () => 
                Bridge.createIPCHandler('get-ui-panel-registry')()
        };
    }

    static createSandboxed() {
        Logger.log('PluginAPI', 'Creating sandboxed plugin API');
        return {
            log: (level, ...args) => 
                Bridge.createIPCHandler('plugin:log')(level, ...args),
            
            registerAction: (actionName, handler) => {
                Logger.log('PluginAPI', `Registering action: ${actionName}`);
                window[`__pluginAction_${actionName}`] = handler;
                Bridge.createIPCHandler('plugin:actionRegistered')(actionName);
            },

            invokeMain: (channel, ...args) => {
                Logger.log('PluginAPI', `Invoking main channel: ${channel}`);
                return Bridge.createIPCHandler(channel)(...args);
            },

            onMainEvent: (channel, listener) => {
                Logger.log('PluginAPI', `Subscribing to main event: ${channel}`);
                return Bridge.createEventListener(channel, listener);
            }
        };
    }
}

module.exports = PluginAPI; 