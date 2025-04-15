import { copyFileSync, mkdirSync } from 'fs';
import fs from 'fs';
import path from 'path';  
import { glob } from 'glob';

// Helper function to copy file with logging
const copyFileWithLog = (src, dest) => {
    try {
      copyFileSync(src, dest);
      console.log(`✅ Copied ${src} to ${dest}`);
    } catch (err) {
      console.error(`❌ Failed to copy ${src} to ${dest}:`, err);
    }
  }
  

// Helper function to ensure directory exists
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }  

// Custom plugin to copy and process plugin files
const copyElectronFilesPlugin = (electronFilesConfig) => ({
    name: 'copy-electron-files',
    closeBundle: () => {
      console.log('\n=== Organizing Electron Files in dist ===\n');
  
      // Ensure expected directories exist
      electronFilesConfig.expectedDirectories.forEach(dir => {
        ensureDir(dir);
      });
      
      // Helper function to copy files for a section
      const copyFiles = (section) => {
        section.files.forEach(file => {
          const sourcePath = path.join(section.from, file);
          
          if (fs.existsSync(sourcePath)) {
            const targetPath = path.join(section.to, file);
            copyFileWithLog(sourcePath, targetPath);
          } else {
            console.warn(`⚠️ Source file not found: ${sourcePath}`);
          }
        });
      };
  
      // Copy files for each section
      copyFiles(electronFilesConfig.main);
      copyFiles(electronFilesConfig.preload);
  
      console.log('\n=== File Organization Complete ===\n');
    }
  });

/**
 * Plugin to copy plugin files during build
 */
const copyPluginsPlugin = (pluginsDir, outputDir, resourcesDir) => ({
    name: 'copy-plugins',
    closeBundle: () => {
      const distPluginsDir = path.join(outputDir, 'plugins');
      ensureDir(distPluginsDir);
      
      const pluginFiles = glob.sync(`${pluginsDir}/**/*.{jsx,js,css,json}`);
      for (const file of pluginFiles) {
        const relativePath = file.replace('plugins/', '');
        const distTarget = path.join(distPluginsDir, relativePath);
        ensureDir(path.dirname(distTarget));
        copyFileWithLog(file, distTarget);
  
        if (process.env.NODE_ENV === 'production') {
          const resourcesTarget = path.join(resourcesDir, 'plugins', relativePath);
          ensureDir(path.dirname(resourcesTarget));
          copyFileWithLog(file, resourcesTarget);
        }
      }
    }
  });  
  
export {
  copyElectronFilesPlugin,
  copyPluginsPlugin
};