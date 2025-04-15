console.log('[StatusBar Preload] Executing src/statusBarPreload.js');

const { contextBridge, ipcRenderer } = require('electron');

// Expose theme API specifically for the status bar
contextBridge.exposeInMainWorld('theme', {
  // Listener now receives { isDarkMode, preference }
  onUpdate: (callback) => {
    const handler = (event, themeInfo) => callback(themeInfo);
    ipcRenderer.on('theme:set', handler);
    // Return a cleanup function to remove the listener
    return () => ipcRenderer.removeListener('theme:set', handler);
  },
  // Expose the toggle function
  toggle: () => ipcRenderer.invoke('theme:toggle'),
  // *** Add function to get initial state ***
  getInitialState: () => ipcRenderer.invoke('theme:get-initial-state')
});

console.log('[StatusBar Preload] APIs exposed.'); 