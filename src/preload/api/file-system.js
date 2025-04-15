const path = require('path');
const fs = require('fs');
const Bridge = require('../core/bridge');
const Logger = require('../utils/logger');

class FileSystemAPI {
    static VFS_ROOT = path.resolve(process.cwd(), '.vfs');

    static async ensureVFSExists() {
        try {
            if (!fs.existsSync(this.VFS_ROOT)) {
                fs.mkdirSync(this.VFS_ROOT, { recursive: true });
                Logger.log('FileSystemAPI', 'Created .vfs directory');
            }
        } catch (error) {
            Logger.error('FileSystemAPI', 'Failed to create .vfs directory', error);
            throw error;
        }
    }

    static create() {
        this.ensureVFSExists();
        
        return {
            listFiles: async (relativePath = '.') => {
                try {
                    const safeRelativePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
                    const targetPath = path.resolve(this.VFS_ROOT, safeRelativePath);
                    
                    if (!targetPath.startsWith(this.VFS_ROOT)) {
                        throw new Error('Access denied: Cannot list files outside the virtual directory.');
                    }
                    
                    const entries = await fs.promises.readdir(targetPath, { withFileTypes: true });
                    return entries.map(entry => ({
                        name: entry.name,
                        isDirectory: entry.isDirectory(),
                        path: path.relative(this.VFS_ROOT, path.join(targetPath, entry.name)).replace(/\\/g, '/')
                    }));
                } catch (error) {
                    Logger.error('FileSystemAPI', `Error listing files: ${error.message}`);
                    throw error;
                }
            },
            readFile: async (filePath) => {
                try {
                    const targetPath = path.join(this.VFS_ROOT, filePath);
                    if (!targetPath.startsWith(this.VFS_ROOT)) {
                        throw new Error('Access denied: Cannot access files outside .vfs directory');
                    }
                    return await fs.promises.readFile(targetPath, 'utf8');
                } catch (error) {
                    Logger.error('FileSystemAPI', `Error reading file: ${error.message}`);
                    throw error;
                }
            },
            writeFile: async (filePath, content) => {
                try {
                    const targetPath = path.join(this.VFS_ROOT, filePath);
                    if (!targetPath.startsWith(this.VFS_ROOT)) {
                        throw new Error('Access denied: Cannot access files outside .vfs directory');
                    }
                    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
                    await fs.promises.writeFile(targetPath, content, 'utf8');
                } catch (error) {
                    Logger.error('FileSystemAPI', `Error writing file: ${error.message}`);
                    throw error;
                }
            },
            getCurrentDir: (fsPath) => {
                const dir = fsPath === '.' ? '/' : `/${fsPath}`;
                return dir;
            },
            VFS_ROOT: this.VFS_ROOT,
            getVfsPath: () => this.VFS_ROOT,
            isElectron: true
        };
    }
}

module.exports = FileSystemAPI; 