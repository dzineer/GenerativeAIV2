const Logger = require('../utils/logger');

class ElectronInfoAPI {
    static create() {
        Logger.log('ElectronInfoAPI', 'Creating electron info API');
        return {
            isPackaged: process.env.NODE_ENV === 'production',
            resourcesPath: process.resourcesPath,
            appPath: process.cwd(),
            platform: process.platform
        };
    }
}

module.exports = ElectronInfoAPI; 