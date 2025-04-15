const { contextBridge, ipcRenderer } = require('electron');

class Bridge {
    static exposeAPI(name, api) {
        console.log(`[Bridge] Exposing API: ${name}`);
        try {
            contextBridge.exposeInMainWorld(name, api);
            console.log(`[Bridge] Successfully exposed API: ${name}`);
        } catch (error) {
            console.error(`[Bridge] Failed to expose API: ${name}`, error);
            throw error;
        }
    }

    static createIPCHandler(channel, handler) {
        return (...args) => {
            console.log(`[Bridge] IPC Handler called: ${channel}`, args);
            return ipcRenderer.invoke(channel, ...args);
        };
    }

    static createEventListener(channel, callback) {
        console.log(`[Bridge] Creating event listener for: ${channel}`);
        const handler = (event, ...args) => callback(...args);
        ipcRenderer.on(channel, handler);
        return () => {
            console.log(`[Bridge] Removing event listener for: ${channel}`);
            ipcRenderer.removeListener(channel, handler);
        };
    }
}

module.exports = Bridge; 