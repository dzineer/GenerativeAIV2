class Logger {
    static log(context, message, ...args) {
        console.log(`[${context}] ${message}`, ...args);
    }

    static error(context, message, ...args) {
        console.error(`[${context}] ${message}`, ...args);
    }

    static warn(context, message, ...args) {
        console.warn(`[${context}] ${message}`, ...args);
    }

    static info(context, message, ...args) {
        console.info(`[${context}] ${message}`, ...args);
    }
}

module.exports = Logger; 