const Bridge = require('./core/bridge');
const Logger = require('./utils/logger');
const ThemeAPI = require('./api/theme');

Logger.log('StatusBarPreload', 'Loading preload script for status bar...');

try {
    Bridge.exposeAPI('theme', ThemeAPI.create());
    Logger.log('StatusBarPreload', 'Theme API exposed successfully');
} catch (error) {
    Logger.error('StatusBarPreload', 'Failed to expose Theme API', error);
    throw error;
} 