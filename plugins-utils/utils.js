import fs from 'fs';
import path from 'path';

// Scan plugins directory to get all plugin entry points
function getPluginEntries($pluginsDir) {
    const entries = {};
    
    if (!fs.existsSync($pluginsDir)) {
      console.warn('Plugins directory not found:', $pluginsDir);
      return entries;
    }
  
    const plugins = fs.readdirSync($pluginsDir);
  
    plugins.forEach(plugin => {
      const _pluginDir = path.resolve($pluginsDir, plugin);
      if (fs.statSync(_pluginDir).isDirectory()) {
        const manifestPath = path.resolve(_pluginDir, 'package.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            // Handle both manifest formats
            const uiPanels = manifest.electronPlugin?.contributes?.uiPanels || [];
            uiPanels.forEach(panel => {
              if (panel.componentPath) {
                const componentPath = path.resolve(_pluginDir, panel.componentPath);
                const outPath = `plugins/${plugin}/${panel.componentPath.replace(/\.jsx$/, '')}`;
                entries[outPath] = componentPath;
              }
            });
          } catch (err) {
            console.error(`Error processing plugin manifest for ${plugin}:`, err);
          }
        }
      }
    });
  
    return entries;
  }

export {
  getPluginEntries
};