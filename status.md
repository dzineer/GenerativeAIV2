# Project Status: Monaco Editor & Plugin System

## Completed Tasks

-   **Phase 1, Task 1: Dependencies**
    *   Installed `@monaco-editor/react`, `monaco-editor`.
    *   Installed `vite-plugin-monaco-editor` (dev dependency).

-   **Phase 1, Task 2: Vite Configuration (`vite.config.js`)**
    *   Integrated `monacoEditorPlugin`.
    *   Configured basic options (language workers).
    *   Ensured `optimizeDeps.esbuildOptions.define.global = 'globalThis'` for Electron compatibility.
    *   *(Note: Dynamic import resolution from `plugins/` deferred to Task 6)*.

-   **Phase 1, Task 3: Monaco UI Plugin (`plugins/monaco-editor-provider/`)**

    This involved two sub-steps:
    3a. Create the `plugins/monaco-editor-provider/` directory and the `package.json` manifest file within it.
    3b. Create the `plugins/monaco-editor-provider/EditorPanel.jsx` component file.

    **Step 3a: Create directory and `package.json`**

    ```bash
    mkdir -p plugins/monaco-editor-provider
    ```

    ```json:plugins/monaco-editor-provider/package.json
    {
      "name": "monaco-editor-provider",
      "version": "0.1.0",
      "description": "Provides the Monaco Editor component as a trusted UI Contribution Plugin.",
      "main": "EditorPanel.jsx",
      "private": true,
      "electronPlugin": {
        "contributes": {
          "uiPanels": [
            {
              "id": "monacoEditor",
              "componentPath": "./EditorPanel.jsx"
            }
          ]
        }
      }
    }
    ```
    **Step 3b: Create `EditorPanel.jsx` component**

    This is the basic React component that wraps the Monaco Editor.

    ```javascript jsx:plugins/monaco-editor-provider/EditorPanel.jsx
    import React, { useRef, forwardRef, useImperativeHandle } from 'react';
    import Editor from '@monaco-editor/react';

    // Use forwardRef to allow parent components (App.jsx) to get the editor instance
    const EditorPanel = forwardRef(({ theme, fileContent, filePath }, ref) => {
      const editorInstanceRef = useRef(null);

      function handleEditorDidMount(editor, monaco) {
        console.log('Monaco Editor Mounted in EditorPanel.jsx');
        editorInstanceRef.current = editor;
        // Focus the editor on mount
        editor.focus();
      }

      // Expose essential editor methods to the parent component (App.jsx) via the ref
      useImperativeHandle(ref, () => ({
        getValue: () => {
          return editorInstanceRef.current?.getValue();
        },
        insertText: (text) => {
          const editor = editorInstanceRef.current;
          if (!editor) return;
          const selection = editor.getSelection();
          if (!selection) return;
          // Need Monaco instance from handleEditorDidMount or context/props if not global
          // Assuming `monaco` instance is available in scope or passed down
          // If using '@monaco-editor/react' hooks, might get it differently.
          // For simplicity, let's assume access to monaco instance here.
          // If not, adjust handleEditorDidMount to store monaco instance.
          const monaco = window.monaco; // Or get it properly
          if (!monaco) {
             console.error("Monaco instance not available for insertText");
             return;
          }
          const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
          const op = { range: range, text: text, forceMoveMarkers: true };
          editor.executeEdits("plugin-insert", [op]);
        },
        // Add other methods as needed (e.g., setContent, getSelection, etc.)
      }));

      console.log(`[EditorPanel] Rendering/Updating. Path: ${filePath}`);

      return (
        <Editor
          height="100%"
          width="100%"
          // Determine language based on filePath extension (basic example)
          language={filePath?.split('.').pop() || 'plaintext'}
          theme={theme?.isDarkMode ? 'vs-dark' : 'vs'}
          value={fileContent}
          onMount={handleEditorDidMount}
          // We don't use onChange here to prevent potential loops if content is prop-driven
          // If local editing is needed, manage state carefully
          options={{
            automaticLayout: true,
            selectOnLineNumbers: true,
            minimap: { enabled: true }, // Example option
            // Add other Monaco options
          }}
          // Consider adding key={filePath} in App.jsx if full re-mount is desired on file change
        />
      );
    });

    export default EditorPanel;
    ```

    Task 3 complete. I have:
    - Created the `plugins/monaco-editor-provider/` directory.
    - Created the `package.json` manifest file inside it, declaring it as a `uiPanel` contributor with ID `monacoEditor`.
    - Created the `EditorPanel.jsx` React component inside it. This component wraps the Monaco Editor, accepts necessary props (`theme`, `fileContent`, `filePath`), determines the language based on the file path, applies the theme, uses `forwardRef` and `useImperativeHandle` to expose methods like `getValue` and `insertText` to parent components (like `App.jsx` for handling IPC calls).

    The application should still be runnable as we haven't yet tried to dynamically load or render this new component in `App.jsx`.

-   **Phase 1, Task 4: File Explorer UI Plugin (`plugins/file-explorer-provider/`)**
    *   Create `package.json` (declares `contributes.uiPanels` with ID `fileExplorer`).
    *   Create `FileExplorerPanel.jsx` component:
        *   Implemented basic file tree display using a simple list.
        *   Used `window.fsService.listFiles` to fetch root directory contents.
        *   Accepts `onFileSelect` prop and calls it on file click (for files only).

    ```javascript jsx:plugins/file-explorer-provider/FileExplorerPanel.jsx
    import React, { useState, useEffect } from 'react';

    const FileExplorerPanel = ({ onFileSelect }) => {
      const [files, setFiles] = useState([]);
      const [error, setError] = useState(null);

      useEffect(() => {
        const fetchFiles = async () => {
          try {
            if (window.fsService) {
              console.log('[FileExplorerPanel] Fetching files from root...');
              const fileList = await window.fsService.listFiles('.'); // Fetch root directory
              console.log('[FileExplorerPanel] Files received:', fileList);
              setFiles(fileList || []); // Ensure fileList is an array
              setError(null);
            } else {
              setError('File service is not available.');
              console.error('[FileExplorerPanel] fsService not found on window.');
            }
          } catch (err) {
            console.error('[FileExplorerPanel] Error fetching files:', err);
            setError(`Error fetching files: ${err.message}`);
            setFiles([]);
          }
        };

        fetchFiles();
      }, []); // Run only on mount

      const handleFileClick = (file) => {
        if (!file.isDirectory && typeof onFileSelect === 'function') {
          onFileSelect(file.path); // Pass the full path
        }
        // TODO: Handle directory expansion later
      };

      return (
        <div style={{ padding: '10px', height: '100%', overflowY: 'auto' }}>
          <h3>File Explorer</h3>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {files.length === 0 && !error && <p>Loading files...</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {files.map((file) => (
              <li
                key={file.path}
                onClick={() => handleFileClick(file)}
                style={{
                  cursor: file.isDirectory ? 'default' : 'pointer',
                  padding: '2px 0',
                  color: file.isDirectory ? 'inherit' : 'blue', // Basic distinction
                  textDecoration: file.isDirectory ? 'none' : 'underline' // Basic distinction
                }}
              >
                {file.isDirectory ? '[D] ' : '[F] '}{file.name}
              </li>
            ))}
          </ul>
        </div>
      );
    };

    export default FileExplorerPanel;
    ```

-   **Phase 1, Task 5: Plugin Loader (`src/core/pluginLoader.js`)**
    *   Created the `loadUiPanelPlugins` function in `src/core/pluginLoader.js` (intended for main process).
    *   Scans the `plugins/` directory for subdirectories.
    *   Reads `package.json` from each potential plugin directory.
    *   Validates manifests for `electronPlugin.contributes.uiPanels` array.
    *   Builds and returns a registry mapping panel IDs to `{ pluginName, componentPath, pluginPath }`.
    *   Includes basic error handling for missing directories/manifests and JSON parsing errors.

    ```javascript js:src/core/pluginLoader.js
    import fs from 'fs/promises';
    import path from 'path';

    const PLUGINS_DIR = path.join(__dirname, '..', '..', 'plugins'); // Assuming loader is in src/core

    /**
     * Scans the plugins directory, reads manifests, validates them,
     * and builds a registry of UI Panel contributions.
     * 
     * @returns {Promise<Object>} A promise that resolves to an object mapping panel IDs 
     *                           to their plugin details { pluginName, componentPath, pluginPath }.
     */
    export async function loadUiPanelPlugins() {
      console.log(`[PluginLoader] Scanning for UI plugins in: ${PLUGINS_DIR}`);
      const uiPanelRegistry = {};

      try {
        const pluginFolders = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });

        for (const dirent of pluginFolders) {
          if (dirent.isDirectory()) {
            const pluginPath = path.join(PLUGINS_DIR, dirent.name);
            const manifestPath = path.join(pluginPath, 'package.json');

            try {
              const manifestContent = await fs.readFile(manifestPath, 'utf-8');
              const manifest = JSON.parse(manifestContent);

              // Validate manifest for UI Panel contributions
              if (
                manifest.electronPlugin?.contributes?.uiPanels &&
                Array.isArray(manifest.electronPlugin.contributes.uiPanels)
              ) {
                console.log(`[PluginLoader] Found valid UI plugin manifest: ${manifest.name}`);
                for (const panel of manifest.electronPlugin.contributes.uiPanels) {
                  if (panel.id && panel.componentPath) {
                    if (uiPanelRegistry[panel.id]) {
                      console.warn(`[PluginLoader] Warning: Duplicate UI Panel ID "${panel.id}" found in plugin "${manifest.name}". Overwriting previous entry from "${uiPanelRegistry[panel.id].pluginName}".`);
                    }
                    // Store registry entry
                    uiPanelRegistry[panel.id] = {
                      pluginName: manifest.name,
                      // IMPORTANT: Store the *relative* path from the plugin dir for dynamic import
                      componentPath: panel.componentPath, // e.g., "./EditorPanel.jsx"
                      pluginPath: pluginPath, // Absolute path to the plugin directory
                    };
                    console.log(`[PluginLoader] Registered UI Panel: ID="${panel.id}", Component="${panel.componentPath}", Plugin="${manifest.name}"`);
                  } else {
                    console.warn(`[PluginLoader] Invalid UI Panel entry in "${manifest.name}": Missing id or componentPath.`);
                  }
                }
              } else {
                // console.log(`[PluginLoader] Plugin "${manifest.name || dirent.name}" does not contribute UI panels or manifest is invalid.`);
              }
            } catch (err) {
              if (err.code === 'ENOENT') {
                console.warn(`[PluginLoader] No package.json found in plugin directory: ${dirent.name}`);
              } else if (err instanceof SyntaxError) {
                console.error(`[PluginLoader] Error parsing package.json in ${dirent.name}:`, err.message);
              } else {
                console.error(`[PluginLoader] Error reading or processing manifest for ${dirent.name}:`, err);
              }
            }
          }
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.error(`[PluginLoader] Plugins directory not found: ${PLUGINS_DIR}`);
        } else {
          console.error('[PluginLoader] Error scanning plugins directory:', err);
        }
        // Return empty registry or re-throw depending on desired behavior
        return {};
      }

      console.log('[PluginLoader] UI Panel Registry complete:', uiPanelRegistry);
      return uiPanelRegistry;
    }
    ```

-   **Phase 1, Task 6: Integrate Plugin Loader & Dynamic Loading (`src/main/main.js`, `src/preload.js`, `src/App.jsx`)**
    *   **Main Process (`main.js`):**
        *   Imported and called `loadUiPanelPlugins` during app initialization.
        *   Stored the resulting `uiPanelRegistry`.
        *   Set up an IPC handler (`handle('get-ui-panel-registry', ...)` ) for the renderer to request the registry.
    *   **Preload Script (`preload.js`):**
        *   Exposed `window.pluginService.getUiPanelRegistry()` that invokes the main process handler.
    *   **React App (`App.jsx`):**
        *   Fetches the `uiPanelRegistry` using the preload API on mount.
        *   Stores the registry in state.
        *   Implemented dynamic import logic using `React.lazy` and `createLazyLoader` function based on the fetched registry and a layout configuration.
        *   Uses `Suspense` with a loading placeholder.
        *   Renders the dynamically loaded components (`FileExplorerPanel`, `EditorPanel`) into their respective `Panel` components in a simplified 2-panel layout.
        *   Passes necessary props (`onFileSelect`, `fileContent`, `filePath`, `theme`) to the dynamically loaded components.
        *   Implemented `handleFileSelect` callback to load file content from `fsService` into state for the editor.

    ```javascript jsx:src/App.jsx
    import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
    import styled, { ThemeProvider } from 'styled-components';
    import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

    // ... existing themes and styled components ...

    const lightTheme = {
      // ... 
      panelLoadingBg: '#e0e0e0', // Background for loading state
    };

    const darkTheme = {
      // ...
      panelLoadingBg: '#2a2a2a', // Background for loading state
    };

    // ... AppContainer, MainAreaContainer ...

    const StyledPanelContent = styled.div`
      background-color: ${props => props.theme.panelBg};
      border: 1px solid ${props => props.theme.borderColor};
      height: 100%;
      width: 100%;
      display: flex;
      /* Remove alignment/justify for general content */
      /* align-items: center; */ 
      /* justify-content: center; */
      font-size: 1.2em;
      overflow: auto;
      box-sizing: border-box;
      color: ${props => props.theme.textColor};
    `;

    // Loading placeholder style
    const LoadingPlaceholder = styled(StyledPanelContent)`
      background-color: ${props => props.theme.panelLoadingBg};
      align-items: center; 
      justify-content: center;
      font-style: italic;
    `;

    // ... StyledResizeHandle ...

    // --- Dynamic Component Loading Logic ---

    // Function to create the lazy loader based on registry info
    // Note: Vite/Webpack needs to handle these dynamic imports.
    // The path assumes App.jsx is in src/ and plugins are in plugins/
    const createLazyLoader = (registryEntry) => {
      if (!registryEntry) {
        return () => () => <div>Component Not Found in Registry</div>;
      }
      // Construct the relative path from src/App.jsx to the plugin component
      // registryEntry.componentPath is like './EditorPanel.jsx'
      // registryEntry.pluginName is like 'monaco-editor-provider'
      const importPath = `../plugins/${registryEntry.pluginName}/${registryEntry.componentPath.replace('./', '')}`;
      console.log(`[App] Creating lazy loader for path: ${importPath}`);
      return lazy(() => import(/* @vite-ignore */ /* webpackIgnore: true */ importPath)
        .catch(err => {
          console.error(`[App] Failed to dynamically import ${importPath}:`, err);
          return { default: () => <div>Error Loading Component: {err.message}</div> };
        }));
    };

    // --- App Component ---

    function App() {
      const [isDarkMode, setIsDarkMode] = useState(false);
      const [themePreference, setThemePreference] = useState('system');
      const [uiPanelRegistry, setUiPanelRegistry] = useState({});
      const [activeFilePath, setActiveFilePath] = useState(null);
      const [activeFileContent, setActiveFileContent] = useState('');
      const [isLoadingRegistry, setIsLoadingRegistry] = useState(true);

      // Layout Configuration - Map panel slots to plugin IDs
      const panelLayoutConfig = {
        panel1: 'fileExplorer', 
        panel2: 'monacoEditor', 
        // panel4: 'terminal' // Example for later
      };

      useEffect(() => {
        // Fetch initial theme state
        window.theme?.getInitialState().then(initialState => {
          // ... existing theme init logic ...
        }).catch(err => console.error('[App] Error getting initial theme state:', err));

        // Setup theme update listener
        const removeThemeListener = window.theme?.onUpdate(({ isDarkMode, preference }) => {
          // ... existing theme update logic ...
        });

        // Fetch UI Panel Registry
        window.pluginService?.getUiPanelRegistry().then(registry => {
          console.log('[App] Received UI Panel Registry:', registry);
          setUiPanelRegistry(registry || {});
          setIsLoadingRegistry(false);
        }).catch(err => {
          console.error('[App] Error getting UI Panel Registry:', err);
          setUiPanelRegistry({});
          setIsLoadingRegistry(false); // Still finish loading even if registry fails
        });

        return () => {
          if (removeThemeListener) removeThemeListener();
        };
      }, []); // Run only once on mount

      // Dynamically load components based on layout config and registry
      const Panel1Component = !isLoadingRegistry ? createLazyLoader(uiPanelRegistry[panelLayoutConfig.panel1]) : null;
      const Panel2Component = !isLoadingRegistry ? createLazyLoader(uiPanelRegistry[panelLayoutConfig.panel2]) : null;
      // Add loaders for other panels as needed

      // Callback for File Explorer to open a file
      const handleFileSelect = useCallback(async (filePath) => {
        console.log('[App] File selected:', filePath);
        // Basic check to prevent reloading the same file unnecessarily
        if (filePath === activeFilePath) {
            console.log('[App] File already active.');
            return; 
        }
        try {
          if (!window.fsService) throw new Error('fsService not available');
          const content = await window.fsService.readFile(filePath);
          setActiveFilePath(filePath);
          setActiveFileContent(content);
          console.log('[App] File loaded successfully into state.');
        } catch (error) {
          console.error('[App] Error reading file:', error);
          // Show error to user - update state to reflect error
          setActiveFilePath(filePath); // Show path even if read fails
          setActiveFileContent(`// Error loading file: ${error.message}`);
        }
      }, [activeFilePath]); // Depend on activeFilePath to avoid stale closure issues if needed

      const currentTheme = isDarkMode ? darkTheme : lightTheme;
      currentTheme.isDarkMode = isDarkMode; // Add isDarkMode to theme object for convenience

      console.log(`[App] Rendering. LoadingRegistry: ${isLoadingRegistry}`);

      // Loading state while registry is fetched
      if (isLoadingRegistry) {
        return (
          <ThemeProvider theme={currentTheme}>
            <AppContainer>
              <LoadingPlaceholder>Loading Application Core...</LoadingPlaceholder>
            </AppContainer>
          </ThemeProvider>
        );
      }

      return (
        <ThemeProvider theme={currentTheme}>
          <AppContainer>
            <MainAreaContainer>
              {/* Simplified Layout: File Explorer | Editor | (Empty/Placeholder) */}
              <PanelGroup direction="horizontal">
                {/* === Panel 1: File Explorer === */}
                <Panel defaultSize={25} minSize={15} maxSize={50}>
                  {Panel1Component ? (
                    <Suspense fallback={<LoadingPlaceholder>Loading Explorer...</LoadingPlaceholder>}>
                      <Panel1Component onFileSelect={handleFileSelect} />
                    </Suspense>
                  ) : (
                    <StyledPanelContent>File Explorer Panel (Not Loaded)</StyledPanelContent>
                  )}
                </Panel>
                <StyledResizeHandle />
                {/* === Panel 2: Editor === */}
                <Panel minSize={30}>
                  {Panel2Component ? (
                    <Suspense fallback={<LoadingPlaceholder>Loading Editor...</LoadingPlaceholder>}>
                      {/* Key prop forces re-mount when file path changes, if EditorPanel needs it */}
                      <Panel2Component 
                        theme={currentTheme} 
                        fileContent={activeFileContent} 
                        filePath={activeFilePath} 
                        key={activeFilePath} 
                        /* ref={editorPanelRef} // Add ref later if needed for IPC */
                      /> 
                    </Suspense>
                  ) : (
                    <StyledPanelContent>Editor Panel (Not Loaded)</StyledPanelContent>
                  )}
                </Panel>
                {/* Optional: Add a third panel area if desired */}
                {/* 
                <StyledResizeHandle />
                <Panel defaultSize={25} minSize={10}>
                   <StyledPanelContent>Panel 3 (Empty)</StyledPanelContent>
                </Panel>
                */}
              </PanelGroup>
            </MainAreaContainer>
          </AppContainer>
        </ThemeProvider>
      );
    }

    export default App;
    ```

-   **Phase 1, Task 7: Initial Testing & Vite Build Check**
    *   Ran the application in development mode (`npm run dev`) and verified core functionality (plugin loading, UI rendering, editor interaction, themes, padding, etc.).
    *   Encountered build error: `Application entry file "src/main.js" in the "...app.asar" does not exist.`
    *   **Fixed build error:**
        *   Installed `vite-plugin-electron` dev dependency.
        *   Configured `vite-plugin-electron` in `vite.config.js` to bundle `src/main.js` into `dist-electron`.
        *   Updated `package.json`:
            *   Changed `"main"` field to `"dist-electron/main.js"`.
            *   Added `"dist-electron/**/*"` to `"build.files"` array.
    *   Ran `npm run build` again.
    *   Verified the production build completed successfully.

## Current Task

-   **Phase 2, Task 10 (Revised): Understand macOS Menu Label Behavior**
    *   Researched why the first menu item label remained "Electron" during development on macOS.
    *   **Finding:** macOS ignores the `label` set in the menu template for the first item and uses the application name from `Info.plist` (`CFBundleName`). During development, this defaults to "Electron".
    *   **Confirmation:** The successful production build indicates `electron-builder` is correctly setting the `productName` ("Vibe AI Studio") in the packaged app's `Info.plist`, meaning the built app will display the correct name.
    *   **Decision:** Accept the "Electron" label during development on macOS as expected behavior, relying on the build process for the correct production name.

-   **Phase 2, Task 11: Refine Backend Plugin Loading & Manifest**
    *   Define a structure in `package.json` for backend plugins to declare themselves (e.g., using `electronPlugin.contributes.backend` or a specific top-level key).
    *   Update `loadBackendPlugins` to only load directories containing a valid backend plugin manifest.
    *   Read the `main` field (or a custom field like `backendEntry`) from the manifest to determine the correct HTML/JS file to load, instead of assuming `index.html`.

    *(Phase 1 Complete - Ready for next steps)* 

## Phase 2: Sandboxed Backend & Editor Bridge

*   [x] Task 8: Setup Sandboxed Plugin Infrastructure (`pluginPreload.js`, initial `loadBackendPlugins`)
*   [x] Task 9: Create Example Backend Plugin (`example-backend-plugin`)
*   [x] Task 10: Refine Backend Loading & Menu (`main.js` logging, Menu IPC, macOS menu label research)
*   [x] Task 11: Refine Backend Plugin Manifest (`package.json`, `loadBackendPlugins` validation)
*   [ ] Task 12: Test Backend Plugin Loading
*   [ ] Task 13: Define Plugin Communication API
*   [ ] Task 14: Implement Editor Bridge API
*   [ ] Task 15: Integrate Bridge with Monaco
*   [ ] Task 16: Add Command Palette

## Future Phases (Potential)

*   More Core Features (Settings UI, Search, etc.)
*   Advanced Plugin Capabilities (Extending Menus, Contributing Commands)
*   Packaging & Distribution Improvements
*   Testing Framework
*   Performance Optimization 