# Plugin System & Monaco Editor Integration Design (V3 - Finalized Approach)

## 1. Goals

-   Build an "AI Studio" Electron application using React and Vite.
-   Integrate the Monaco Editor for a high-quality code editing experience within a specific, assignable resizable panel (e.g., Panel 2).
-   Implement a **two-tiered plugin system**:
    1.  **Sandboxed Backend Plugins:** For extending application-level features (AI Agents, MCP, background tasks) securely.
    2.  **Trusted UI Contribution Plugins:** For providing core UI components (like the Monaco Editor) to be dynamically rendered within designated panels.
-   Ensure seamless integration between the application shell, the Monaco editor, and the different plugin types.
-   Prioritize security (for backend plugins) and performance (for UI components).

## 2. Overall Architecture & Plugin Types Explained

-   **Electron Shell:** Manages windows, main process logic (`src/main.js`), IPC.
-   **Main React App (`src/App.jsx`):** Renders `react-resizable-panels`. **Dynamically loads and renders components from Trusted UI Contribution Plugins** (e.g., `EditorPanel` into Panel 2, `FileExplorerPanel` into Panel 1). Hosts the main window's preload (`src/preload.js`).
-   **Monaco Editor:** Provided by a **Trusted UI Contribution Plugin** (`plugins/monaco-editor-provider/`). Its React component (`EditorPanel.jsx`) runs **within the main React App's renderer process**.
-   **File Explorer:** Provided by a **separate** Trusted UI Contribution Plugin (`plugins/file-explorer-provider/`). Runs in the main renderer process.
-   **Status Bar (`BrowserView`):** Separate view.
-   **Sandboxed Backend Plugin System:** Manages external plugins for backend/agent tasks. Each runs in its own sandboxed, hidden `BrowserWindow` host process with `src/pluginPreload.js`.
-   **Preload Scripts:**
    -   `src/preload.js`: For main React window. Exposes app APIs (fsService, theme, `editorBridge` for mediating editor interactions).
    -   `src/statusBarPreload.js`: For status bar.
    -   `src/pluginPreload.js`: For sandboxed plugin hosts. Exposes limited `pluginAPI`.
-   **IPC Communication:** Securely managed via `contextBridge` and `ipcMain`. Main process acts as mediator, especially between sandboxed plugins and UI components (like Monaco).

## 3. UI Contribution Plugins (Monaco Editor & File Explorer)

This section now covers both core UI components treated as plugins.

### 3.1. Plugin Structures

-   `plugins/monaco-editor-provider/`
    -   `package.json`
    -   `EditorPanel.jsx` (Wraps Monaco)
-   `plugins/file-explorer-provider/`
    -   `package.json`
    -   `FileExplorerPanel.jsx` (Displays file tree)

### 3.2. Manifests

```json
// plugins/monaco-editor-provider/package.json
{
  "name": "monaco-editor-provider",
  "version": "0.1.0",
  "description": "Provides the Monaco Editor component.",
  "main": "EditorPanel.jsx", // For reference, componentPath used
  "electronPlugin": {
    "contributes": {
      "uiPanels": [
        { "id": "monacoEditor", "componentPath": "./EditorPanel.jsx" }
      ]
    }
  }
}
```

```json
// plugins/file-explorer-provider/package.json
{
  "name": "file-explorer-provider",
  "version": "0.1.0",
  "description": "Provides the File Explorer panel.",
  "main": "FileExplorerPanel.jsx", // For reference, componentPath used
  "electronPlugin": {
    "contributes": {
      "uiPanels": [
        { "id": "fileExplorer", "componentPath": "./FileExplorerPanel.jsx" }
      ]
    }
  }
}
```

### 3.3. Dependencies & Vite Config

-   Monaco dependencies (`@monaco-editor/react`, `monaco-editor`, `vite-plugin-monaco-editor`) are needed for the Monaco provider.
-   Configure Vite for Monaco workers.
-   Ensure Vite/build process handles dynamic imports from `plugins/` (See Section 7).

### 3.4. React Components

-   **`EditorPanel.jsx`:** Wraps Monaco editor (as previously defined). Will receive `fileContent` and potentially `filePath` as props from `App.jsx`.
-   **`FileExplorerPanel.jsx`:**
    -   Uses `window.fsService.listFiles` to fetch directory contents on mount and expansion.
    -   Renders a tree view (using a library like `react-accessible-treeview` or custom implementation).
    -   Takes an `onFileSelect` function prop from `App.jsx`.
    -   On file click, calls `onFileSelect(filePath)`.

### 3.5. Dynamic Loading and Interaction (`src/App.jsx`)

```jsx
import React, { useState, useEffect, Suspense, lazy, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
// ... other imports

// Map panel IDs to UI Contribution Plugins
const panelRegistry = { // Example, could be loaded from manifests
  fileExplorer: {
      pluginName: 'file-explorer-provider',
      componentPath: './FileExplorerPanel.jsx',
      loader: () => lazy(() => import('../plugins/file-explorer-provider/FileExplorerPanel.jsx'))
  },
  monacoEditor: {
      pluginName: 'monaco-editor-provider',
      componentPath: './EditorPanel.jsx',
      loader: () => lazy(() => import('../plugins/monaco-editor-provider/EditorPanel.jsx'))
  }
};

// User/default layout configuration
const panelLayoutConfig = {
  panel1: 'fileExplorer', // ID from panelRegistry
  panel2: 'monacoEditor'
  // ...
};

// Function to get the component loader based on layout config
const getPanelComponent = (panelId) => {
    const componentId = panelLayoutConfig[panelId];
    return panelRegistry[componentId]?.loader() || (() => <div>Panel Component Not Found</div>);
};

function App() {
  // ... theme state ...
  const [activeFileContent, setActiveFileContent] = useState('');
  const [activeFilePath, setActiveFilePath] = useState(null);

  // Dynamically load components for layout
  const Panel1Component = getPanelComponent('panel1');
  const Panel2Component = getPanelComponent('panel2');
  // ... other panels

  // Callback for File Explorer to open a file
  const handleFileSelect = useCallback(async (filePath) => {
    console.log('[App] File selected:', filePath);
    try {
      const content = await window.fsService.readFile(filePath);
      setActiveFilePath(filePath);
      setActiveFileContent(content);
    } catch (error) {
      console.error('[App] Error reading file:', error);
      // Show error to user
      setActiveFilePath(filePath); // Show path even if read fails
      setActiveFileContent(`// Error loading file: ${error.message}`);
    }
  }, []);

  // Logic for handling sandboxed plugin -> editor interaction via editorBridge
  // ... (as defined previously, interacting with EditorPanel via ref/props) ...

  return (
    <ThemeProvider theme={currentTheme}>
      <AppContainer>
        <MainAreaContainer>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={25} minSize={10}> {/* Panel 1: File Explorer */}
              <Suspense fallback={<div>Loading Explorer...</div>}>
                <Panel1Component onFileSelect={handleFileSelect} />
              </Suspense>
            </Panel>
            <StyledResizeHandle />
            <Panel minSize={10}> {/* Panels 2 & 3 Area */}
              <PanelGroup direction="horizontal">
                <Panel defaultSize={70} minSize={10}> {/* Panel 2: Editor */}
                  <Suspense fallback={<div>Loading Editor...</div>}>
                    {/* Pass content and path to Editor component */}
                    <Panel2Component
                       theme={currentTheme}
                       fileContent={activeFileContent}
                       filePath={activeFilePath}
                       key={activeFilePath} // Force re-mount on file change if needed by EditorPanel
                       /* ref={editorPanelRef} for IPC interaction */
                    />
                  </Suspense>
                </Panel>
                {/* ... other panels ... */}
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </MainAreaContainer>
      </AppContainer>
    </ThemeProvider>
  );
}

```

## 4. Sandboxed Backend Plugin System

(Design remains largely the same as `docs/features/plugin-system.md (Revised V1)`)

-   **Goal:** Extend backend/agent features securely.
-   **Execution:** Hidden, sandboxed `BrowserWindow` per plugin.
-   **Manifest:** Defines `activationEvents`, `permissions` (e.g., `notifications`, `agentAPI:*`, `editor:read`), `contributes.commands`.
-   **API (`pluginAPI`):** Minimal, exposed via `src/pluginPreload.js`. Includes methods like `log`, `registerCommand`, `notify`, `agent.*`, `editor.*`.
-   **IPC:** Main process mediates ALL communication, performs rigorous permission checks based on plugin manifest. Editor interactions are relayed to the main React app.

## 5. Communication Flow (Sandboxed Plugin <-> Monaco)

1.  Sandboxed Plugin calls `pluginAPI.editor.getText()`.
2.  `src/pluginPreload.js` sends `'plugin:editor:getText'` IPC invoke to Main Process.
3.  Main Process handler receives invoke, **checks sender identity and manifest permissions (e.g., `"editor:read"`)**.
4.  If permitted, Main Process generates `requestId` and sends `'app:editor:action'` IPC message (with `{ action: 'getText', requestId }`) to the Main Window (`mainWindow.webContents.send`).
5.  `src/preload.js` (Main Window) listener (`editorBridge.onEditorAction`) receives the message and calls a callback function registered by `App.jsx`.
6.  `App.jsx` callback finds the `EditorPanel` instance (e.g., via ref) and calls its `getEditorText()` method.
7.  `EditorPanel` gets text from Monaco (`editorRef.current.getValue()`).
8.  `App.jsx` calls `window.editorBridge.sendEditorResult(requestId, editorText)` via `src/preload.js`.
9.  `src/preload.js` sends `'app:editor:result'` IPC message to Main Process.
10. Main Process handler matches `requestId` and resolves the original `'plugin:editor:getText'` invoke call with `editorText`.
11. Sandboxed Plugin receives the text from the resolved Promise.

## 6. Implementation Details & Configuration

-   **React App (`App.jsx`):**
    -   Implement state management for active file path/content.
    -   Implement dynamic loading logic for UI Contribution Plugins based on manifests/config.
    -   Pass props (`onFileSelect`, `fileContent`, `filePath`, `theme`) between `App` and dynamically loaded UI components.
    -   Implement `editorBridge` listener/handler logic.

## 7. Security Considerations

-   **Crucial Distinction:** Sandboxed Backend Plugins are untrusted; UI Contribution Plugins (like Monaco) run with full renderer privileges and **must be trusted**.
-   Sandboxing (`sandbox: true`) remains the core defense for Backend Plugins.
-   Permission model and IPC validation in the main process are essential for controlling Backend Plugin actions.
-   Minimize the `pluginAPI` surface.
-   Validate all IPC data.

## 8. Conclusion

This two-tiered plugin architecture allows integrating core UI components like Monaco Editor and a File Explorer as **trusted, dynamically loaded modules** within the main React application, enabling direct communication between them via standard React patterns for optimal performance. Simultaneously, it provides a secure mechanism for extending backend functionality through **sandboxed plugins** with a minimal, permission-controlled API, mediated by the main process. Careful implementation of dynamic loading, state management in `App.jsx`, and IPC bridging is key.

This revised architecture integrates Monaco as a dynamically loaded, trusted UI component within the main React application, assigned to a specific panel. A separate system handles sandboxed backend plugins for extending application-specific features securely. Interaction between backend plugins and UI components like Monaco is carefully mediated via IPC through the main process, incorporating permission checks. This provides modularity and security while ensuring performance for the core editor. 