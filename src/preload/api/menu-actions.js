const Bridge = require('../core/bridge');
const Logger = require('../utils/logger');

class MenuActionsAPI {
    static create() {
        Logger.log('MenuActionsAPI', 'Creating menu actions API');
        return {
            onSaveFile: (callback) => 
                Bridge.createEventListener('menu-action:save-file', callback),
            
            onSaveFileAs: (callback) => 
                Bridge.createEventListener('menu-action:save-file-as', callback),
            
            onCloseEditor: (callback) => 
                Bridge.createEventListener('menu-action:close-editor', callback),
            
            onOpenSettings: (callback) => 
                Bridge.createEventListener('menu-action:open-settings', callback)
        };
    }
}

module.exports = MenuActionsAPI; 