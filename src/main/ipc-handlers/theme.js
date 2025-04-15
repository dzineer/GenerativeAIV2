const { ipcMain, nativeTheme } = require('electron');

class ThemeHandler {
    constructor(store, windows) {
        this.store = store;
        this.windows = windows;
    }

    getEffectiveTheme() {
        if (!this.store) return nativeTheme.shouldUseDarkColors;
        const preference = this.store.get('theme');
        if (preference === 'light') return false;
        if (preference === 'dark') return true;
        return nativeTheme.shouldUseDarkColors;
    }

    setNativeThemeSource() {
        const preference = this.store.get('theme');
        console.log(`[Theme] Setting nativeTheme.themeSource: ${preference}`);
        nativeTheme.themeSource = preference;
    }

    sendThemeUpdate() {
        if (!this.store) return;
        const isDarkMode = this.getEffectiveTheme();
        const preference = this.store.get('theme');
        console.log(`[Theme] Sending update. Preference: ${preference}, Dark Mode: ${isDarkMode}`);

        const themeInfo = { isDarkMode, preference };
        if (this.windows.mainWindow?.webContents) {
            this.windows.mainWindow.webContents.send('theme:set', themeInfo);
        }
        if (this.windows.statusBarView?.webContents) {
            this.windows.statusBarView.webContents.send('theme:set', themeInfo);
        }
    }

    registerHandlers() {
        console.log('[Theme] Registering IPC handlers...');

        ipcMain.handle('theme:get-initial-state', () => {
            console.log('[Theme] Handling get-initial-state request');
            if (!this.store) {
                return { isDarkMode: nativeTheme.shouldUseDarkColors, preference: 'system' };
            }
            const isDarkMode = this.getEffectiveTheme();
            const preference = this.store.get('theme');
            return { isDarkMode, preference };
        });

        ipcMain.handle('theme:toggle', () => {
            console.log('[Theme] Handling toggle request');
            if (!this.store) return;
            
            const currentPreference = this.store.get('theme');
            let newPreference;
            if (currentPreference === 'system') {
                newPreference = nativeTheme.shouldUseDarkColors ? 'light' : 'dark';
            } else if (currentPreference === 'light') {
                newPreference = 'dark';
            } else {
                newPreference = 'system';
            }

            this.store.set('theme', newPreference);
            this.setNativeThemeSource();
            this.sendThemeUpdate();
            return newPreference;
        });

        // Listen for system theme changes
        nativeTheme.on('updated', () => {
            if (!this.store) return;
            if (this.store.get('theme') === 'system') {
                console.log('[Theme] System theme changed, updating...');
                this.sendThemeUpdate();
            }
        });
    }
}

module.exports = ThemeHandler;