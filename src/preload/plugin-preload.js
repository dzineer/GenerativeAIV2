// src/pluginPreload.js
const { contextBridge, ipcRenderer } = require('electron');
const Bridge = require('./core/bridge');
const Logger = require('./utils/logger');
const PluginAPI = require('./api/plugin');

Logger.log('PluginPreload', 'Loading preload script for sandboxed plugin...');

const allowedIpcChannels = [
  // Define channels plugin is allowed to INVOKE on main process
  'plugin:log', 
  // Add other allowed channels for invoke as API grows (e.g., 'plugin:registerCommand')
];

// Define a secure API for the plugin
const pluginAPI = {
  log: (level, ...args) => {
    // Send log messages to the main process for unified logging
    // Prefixing helps main process identify source
    ipcRenderer.invoke('plugin:log', level, ...args);
  },
  // NEW: Register an action handler
  registerAction: (actionName, handler) => {
    // Store the handler locally for now
    // A more robust solution might involve registering with the main process
    // and having the main process invoke it via webContents.send
    window[`__pluginAction_${actionName}`] = handler; 
    ipcRenderer.send('plugin:actionRegistered', actionName); // Inform main process
    console.log(`[pluginPreload] Action registered: ${actionName}`); 
  },
  // NEW: Invoke a handler in the main process
  invokeMain: (channel, ...args) => {
    console.log(`[pluginPreload] Invoking main channel: ${channel}`);
    return ipcRenderer.invoke(channel, ...args);
  },
  // NEW: Listen for events from the main process
  onMainEvent: (channel, listener) => {
    console.log(`[pluginPreload] Subscribing to main event: ${channel}`);
    // Use a wrapper to remove the internal event argument
    const handler = (event, ...args) => listener(...args);
    ipcRenderer.on(channel, handler);
    // Return an unsubscribe function
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  },
  // Example placeholder for a future API function
  // registerCommand: (commandId, callback) => { 
  //   // Complex logic needed here involving storing callbacks securely
  //   // and setting up listeners from main process - TBD
  //   console.warn('[PluginPreload] registerCommand not fully implemented yet.');
  // },
  // Add other limited API functions here (e.g., access to specific agent functions)
};

// Expose the limited API to the sandboxed renderer process
try {
    Bridge.exposeAPI('pluginAPI', PluginAPI.createSandboxed());
    Logger.log('PluginPreload', 'Plugin API exposed successfully');
} catch (error) {
    Logger.error('PluginPreload', 'Failed to expose Plugin API', error);
    throw error;
}

// Temporary mechanism for main process to call registered actions
// Note: This is basic and potentially insecure for complex scenarios.
// A better approach uses ipcRenderer.on to listen for invocation requests from main.
ipcRenderer.on('invokePluginAction', (event, actionName, ...args) => {
  console.log(`[pluginPreload] Received invokePluginAction for: ${actionName}`);
  const handler = window[`__pluginAction_${actionName}`];
  if (typeof handler === 'function') {
    try {
      // We might want to handle async handlers too
      const result = handler(...args); 
      console.log(`[pluginPreload] Action ${actionName} executed.`);
      // Optionally send result back if needed, requires more IPC setup
    } catch (error) {
      console.error(`[pluginPreload] Error executing action ${actionName}:`, error);
      // Optionally send error back
    }
  } else {
    console.warn(`[pluginPreload] No handler found for action: ${actionName}`);
    // Optionally send 'not found' back
  }
});

console.log('[PluginPreload] pluginAPI exposed.');

// Basic security: Prevent plugins from easily accessing NodeJS stuff if nodeIntegration was somehow enabled
// (Should be disabled by default with contextIsolation: true, sandbox: true)
// process.crash(); // Example of removing dangerous globals
// delete window.require; // etc. 