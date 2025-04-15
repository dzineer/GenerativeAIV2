"use strict";
const fs = require("fs/promises");
const path = require("path");
const { app } = require("electron");
const getPluginsDir = () => {
  const isPackaged = app.isPackaged;
  console.log("[PluginLoader] App is packaged:", isPackaged);
  console.log("[PluginLoader] __dirname:", __dirname);
  console.log("[PluginLoader] process.resourcesPath:", process.resourcesPath);
  console.log("[PluginLoader] app.getAppPath():", app.getAppPath());
  let pluginsDir;
  if (isPackaged) {
    const possiblePaths = [
      path.join(process.resourcesPath, "plugins"),
      path.join(process.resourcesPath, "app.asar.unpacked", "plugins"),
      path.join(app.getAppPath(), "plugins")
    ];
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
      console.error("[PluginLoader] No valid plugins directory found in production. Tried:", possiblePaths);
      pluginsDir = path.join(process.resourcesPath, "plugins");
    }
  } else {
    pluginsDir = path.join(__dirname, "..", "..", "plugins");
  }
  console.log("[PluginLoader] Using plugins path:", pluginsDir);
  return pluginsDir;
};
function extractUiPanels(manifest, pluginDirName) {
  var _a, _b;
  const panels = {};
  if ((_b = (_a = manifest.electronPlugin) == null ? void 0 : _a.contributes) == null ? void 0 : _b.uiPanels) {
    console.log(`[PluginLoader] Found UI panels in ${pluginDirName}`);
    const uiPanels = manifest.electronPlugin.contributes.uiPanels;
    if (Array.isArray(uiPanels)) {
      uiPanels.forEach((panel) => {
        if (panel.id && panel.componentPath) {
          panels[panel.id] = {
            path: panel.componentPath,
            pluginDir: pluginDirName
          };
        }
      });
    }
  }
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
async function loadUiPanelPlugins() {
  const PLUGINS_DIR = getPluginsDir();
  console.log(`[PluginLoader] Scanning for UI plugins in: ${PLUGINS_DIR}`);
  const uiPanelRegistry = {};
  try {
    try {
      await fs.access(PLUGINS_DIR);
    } catch (err) {
      console.error("[PluginLoader] Plugins directory does not exist:", PLUGINS_DIR);
      console.error("[PluginLoader] Error:", err);
      return {};
    }
    const contents = await fs.readdir(PLUGINS_DIR);
    console.log("[PluginLoader] Found plugin directories:", contents);
    for (const pluginDirName of contents) {
      const pluginPath = path.join(PLUGINS_DIR, pluginDirName);
      const manifestPath = path.join(pluginPath, "package.json");
      try {
        const stat = await fs.stat(pluginPath);
        if (!stat.isDirectory()) continue;
        const manifestContent = await fs.readFile(manifestPath, "utf-8");
        const manifest = JSON.parse(manifestContent);
        const panels = extractUiPanels(manifest, pluginDirName);
        for (const [panelId, panelInfo] of Object.entries(panels)) {
          const { path: componentPath, pluginDir } = panelInfo;
          let resolvedPath;
          if (app.isPackaged) {
            resolvedPath = path.join("plugins", pluginDir, componentPath);
          } else {
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
      }
    }
    console.log("[PluginLoader] Final UI Panel Registry:", uiPanelRegistry);
    const panelCount = Object.keys(uiPanelRegistry).length;
    if (panelCount === 0) {
      console.warn("[PluginLoader] No UI panels were registered!");
      console.warn("[PluginLoader] Plugins directory:", PLUGINS_DIR);
      console.warn("[PluginLoader] Is packaged:", app.isPackaged);
    } else {
      console.log(`[PluginLoader] Successfully registered ${panelCount} panels`);
    }
    return uiPanelRegistry;
  } catch (err) {
    console.error("[PluginLoader] Fatal error loading UI panel plugins:", err);
    console.error("[PluginLoader] Stack:", err.stack);
    return {};
  }
}
module.exports = {
  loadUiPanelPlugins
};
//# sourceMappingURL=pluginLoader.js.map
