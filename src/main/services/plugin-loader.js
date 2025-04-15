const fs = require('fs/promises');
const path = require('path');
const { app } = require('electron');

// Determine plugins directory based on environment
const getPluginsDir = () => {
  const isPackaged = app.isPackaged;
  console.log('[PluginLoader] App is packaged:', isPackaged);
  console.log('[PluginLoader] __dirname:', __dirname);
  console.log('[PluginLoader] process.resourcesPath:', process.resourcesPath);
  console.log('[PluginLoader] app.getAppPath():', app.getAppPath());
  
  let pluginsDir;
  if (isPackaged) {
    // Try multiple possible locations in production
    const possiblePaths = [
      path.join(process.resourcesPath, 'plugins'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'plugins'),
      path.join(app.getAppPath(), 'plugins')
    ];

    // Find the first path that exists
    for (const testPath of possiblePaths) {
      try {
        if (fs.existsSync(testPath)) {
          pluginsDir = testPath;
          break;
        }
      } catch (err) {
        console.warn(`[PluginLoader] Path ${testPath} not accessible:`, err);
      }
    }

    if (!pluginsDir) {
      console.error('[PluginLoader] No valid plugins directory found in production. Tried:', possiblePaths);
      pluginsDir = path.join(process.resourcesPath, 'plugins'); // Default fallback
    }
  } else {
    // In development, plugins are in the project root
    pluginsDir = path.join(__dirname, '..', '..', 'plugins');
  }
  
  console.log('[PluginLoader] Using plugins path:', pluginsDir);
  return pluginsDir;
};

/**
 * Extract UI panel information from the manifest
 */
function extractUiPanels(manifest, pluginDirName) {
  const panels = {};
  
  // Try new format first (preferred)
  if (manifest.electronPlugin?.contributes?.uiPanels) {
    console.log(`[PluginLoader] Found UI panels in ${pluginDirName}`);
    const uiPanels = manifest.electronPlugin.contributes.uiPanels;
    if (Array.isArray(uiPanels)) {
      uiPanels.forEach(panel => {
        if (panel.id && panel.componentPath) {
          // Store both the ID and path
          panels[panel.id] = {
            path: panel.componentPath,
            pluginDir: pluginDirName
          };
        }
      });
    }
  }
  
  // Try legacy format as fallback
  if (manifest.uiPanels && Object.keys(panels).length === 0) {
    console.log(`[PluginLoader] Found legacy format UI panels in ${pluginDirName}`);
    for (const [panelId, panelInfo] of Object.entries(manifest.uiPanels)) {
      if (panelInfo.component) {
        panels[panelId] = {
          path: panelInfo.component,
          pluginDir: pluginDirName
        };
      }
    }
  }
  
  return panels;
}

/**
 * Scans the plugins directory and builds a registry of UI Panel contributions.
 */
async function loadUiPanelPlugins() {
  const PLUGINS_DIR = getPluginsDir();
  console.log(`[PluginLoader] Scanning for UI plugins in: ${PLUGINS_DIR}`);
  
  const uiPanelRegistry = {};

  try {
    // First check if directory exists
    try {
      await fs.access(PLUGINS_DIR);
    } catch (err) {
      console.error('[PluginLoader] Plugins directory does not exist:', PLUGINS_DIR);
      console.error('[PluginLoader] Error:', err);
      return {}; // Return empty registry rather than throwing
    }

    // List directory contents
    const contents = await fs.readdir(PLUGINS_DIR);
    console.log('[PluginLoader] Found plugin directories:', contents);

    // Process each plugin directory
    for (const pluginDirName of contents) {
      const pluginPath = path.join(PLUGINS_DIR, pluginDirName);
      const manifestPath = path.join(pluginPath, 'package.json');
      
      try {
        // Check if it's a directory
        const stat = await fs.stat(pluginPath);
        if (!stat.isDirectory()) continue;

        // Read and parse manifest
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);

        // Extract UI panels with plugin directory info
        const panels = extractUiPanels(manifest, pluginDirName);

        // Register each panel with proper path resolution
        for (const [panelId, panelInfo] of Object.entries(panels)) {
          const { path: componentPath, pluginDir } = panelInfo;
          
          // Resolve the path based on environment
          let resolvedPath;
          if (app.isPackaged) {
            // In production, use path relative to plugins directory
            resolvedPath = path.join('plugins', pluginDir, componentPath);
          } else {
            // In development, use absolute path
            resolvedPath = path.join(PLUGINS_DIR, pluginDir, componentPath);
          }

          console.log(`[PluginLoader] Registering panel ${panelId}:`, {
            componentPath,
            resolvedPath,
            isPackaged: app.isPackaged
          });

          uiPanelRegistry[panelId] = resolvedPath;
        }
      } catch (err) {
        console.error(`[PluginLoader] Error processing plugin ${pluginDirName}:`, err);
        // Continue with next plugin
      }
    }

    // Validate registry
    console.log('[PluginLoader] Final UI Panel Registry:', uiPanelRegistry);
    const panelCount = Object.keys(uiPanelRegistry).length;
    if (panelCount === 0) {
      console.warn('[PluginLoader] No UI panels were registered!');
      console.warn('[PluginLoader] Plugins directory:', PLUGINS_DIR);
      console.warn('[PluginLoader] Is packaged:', app.isPackaged);
    } else {
      console.log(`[PluginLoader] Successfully registered ${panelCount} panels`);
    }

    return uiPanelRegistry;

  } catch (err) {
    console.error('[PluginLoader] Fatal error loading UI panel plugins:', err);
    console.error('[PluginLoader] Stack:', err.stack);
    return {}; // Return empty registry rather than throwing
  }
}

module.exports = {
  loadUiPanelPlugins
};