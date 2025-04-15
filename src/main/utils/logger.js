const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class Logger {
    constructor() {
        this.logLevels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };
        this.currentLevel = this.logLevels.INFO;
        this.logFile = path.join(app.getPath('userData'), 'debug.log');
        
        // Ensure log directory exists
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}\n`;
    }

    log(level, message) {
        if (this.logLevels[level] >= this.currentLevel) {
            const formattedMessage = this.formatMessage(level, message);
            console.log(formattedMessage);
            fs.appendFileSync(this.logFile, formattedMessage);
        }
    }

    debug(message) {
        this.log('DEBUG', message);
    }

    info(message) {
        this.log('INFO', message);
    }

    warn(message) {
        this.log('WARN', message);
    }

    error(message) {
        this.log('ERROR', message);
    }

    setLogLevel(level) {
        if (this.logLevels.hasOwnProperty(level)) {
            this.currentLevel = this.logLevels[level];
        }
    }

    getLogFile() {
        return this.logFile;
    }
}

module.exports = new Logger(); 