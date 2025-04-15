const Bridge = require('../core/bridge');
const Logger = require('../utils/logger');

class ThemeAPI {
    static create() {
        Logger.log('ThemeAPI', 'Creating theme API');
        return {
            onUpdate: (callback) => 
                Bridge.createEventListener('theme:set', callback),
            toggle: () => 
                Bridge.createIPCHandler('theme:toggle')(),
            getInitialState: () => 
                Bridge.createIPCHandler('theme:get-initial-state')()
        };
    }
}

module.exports = ThemeAPI; 