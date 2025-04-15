const path = require('path');

// Base directory for main process files
const MAIN_DIR = __dirname;

// Resolve paths relative to main directory
const resolveMain = (file) => path.resolve(MAIN_DIR, '..', file);

// Resolve paths for service files
const resolveService = (file) => path.resolve(MAIN_DIR, '..', 'services', file);

// Resolve paths for IPC handler files
const resolveHandler = (file) => path.resolve(MAIN_DIR, '..', 'ipc-handlers', file);

module.exports = {
    resolveMain,
    resolveService,
    resolveHandler
}; 