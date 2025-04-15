const { ipcMain } = require('electron');
const fs = require('fs/promises');
const path = require('path');

class FileSystemHandler {
    constructor(store) {
        this.store = store;
        this.vfsRoot = this.store.get('vfsRoot');
    }

    async readFile(filePath) {
        console.log('[FileSystem] Reading file:', filePath);
        const fullPath = path.join(this.vfsRoot, filePath);
        return await fs.readFile(fullPath, 'utf-8');
    }

    async writeFile(filePath, content) {
        console.log('[FileSystem] Writing file:', filePath);
        const fullPath = path.join(this.vfsRoot, filePath);
        await fs.writeFile(fullPath, content, 'utf-8');
    }

    async listDirectory(dirPath) {
        console.log('[FileSystem] Listing directory:', dirPath);
        const fullPath = path.join(this.vfsRoot, dirPath);
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        return entries.map(entry => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile()
        }));
    }

    async createDirectory(dirPath) {
        console.log('[FileSystem] Creating directory:', dirPath);
        const fullPath = path.join(this.vfsRoot, dirPath);
        await fs.mkdir(fullPath, { recursive: true });
    }

    registerHandlers() {
        console.log('[FileSystem] Registering IPC handlers');

        ipcMain.handle('fs:read-file', async (event, filePath) => {
            try {
                return await this.readFile(filePath);
            } catch (error) {
                console.error('[FileSystem] Error reading file:', error);
                throw error;
            }
        });

        ipcMain.handle('fs:write-file', async (event, { filePath, content }) => {
            try {
                await this.writeFile(filePath, content);
                return true;
            } catch (error) {
                console.error('[FileSystem] Error writing file:', error);
                throw error;
            }
        });

        ipcMain.handle('fs:list-directory', async (event, dirPath) => {
            try {
                return await this.listDirectory(dirPath);
            } catch (error) {
                console.error('[FileSystem] Error listing directory:', error);
                throw error;
            }
        });

        ipcMain.handle('fs:create-directory', async (event, dirPath) => {
            try {
                await this.createDirectory(dirPath);
                return true;
            } catch (error) {
                console.error('[FileSystem] Error creating directory:', error);
                throw error;
            }
        });
    }
}

module.exports = FileSystemHandler;
