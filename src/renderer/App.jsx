import React, { useState, useEffect, Suspense, lazy, useCallback, useRef } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import path from 'path';
// Remove direct electron import and use the exposed API
const { ipcRenderer } = window.electron;
import './styles/App.css';

// Define themes
const lightTheme = {
  appBg: '#f0f0f0',
  panelBg: '#ffffff',
  textColor: '#333333',
  borderColor: '#cccccc',
  handleBg: '#cccccc',
  handleHoverBg: '#aaaaaa',
  panelLoadingBg: '#e0e0e0', // Background for loading state
};

const darkTheme = {
  appBg: '#1e1e1e',
  panelBg: '#1e1e1e',
  textColor: '#d4d4d4',
  borderColor: '#333333',
  handleBg: '#555555',
  handleHoverBg: '#777777',
  panelLoadingBg: '#2a2a2a', // Background for loading state
};

// Apply theme variables
const AppContainer = styled.div`
  display: flex; 
  flex-direction: column;
  height: 100vh; /* Fill the viewport */
  background-color: ${props => props.theme.appBg};
  color: ${props => props.theme.textColor};
  font-family: sans-serif;
  /* position: relative; Remove */
  /* overflow: hidden; Remove */
`;

// Restore simpler MainAreaContainer styles
const MainAreaContainer = styled.div`
  flex-grow: 1; /* Allow this area to fill space */
  display: flex; 
  background-color: ${props => props.theme.appBg}; /* Explicitly set background */
`;

// Renamed from Panel to prevent naming conflict with the library component
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
  padding: 5px; /* Add DEFAULT 5px padding */
`;

// Loading placeholder style
const LoadingPlaceholder = styled(StyledPanelContent)`
  background-color: ${props => props.theme.panelLoadingBg};
  align-items: center; 
  justify-content: center;
  font-style: italic;
`;

// Add ErrorPlaceholder component
const ErrorPlaceholder = styled(StyledPanelContent)`
  background-color: ${props => props.theme.panelLoadingBg};
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
  color: #ff6b6b;
  
  button {
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid currentColor;
    background: transparent;
    color: inherit;
    cursor: pointer;
    
    &:hover {
      background: rgba(255, 107, 107, 0.1);
    }
  }
`;

/* StatusBar component removed */

// Basic styles for the resize handle - can be customized further
const StyledResizeHandle = styled(PanelResizeHandle)`
  background-color: ${props => props.theme.handleBg}; // Use theme color
  position: relative; 

  // Force visibility for debugging - REMOVED
  /* background-color: yellow !important; */
  /* border: 1px dotted red; */

  &[data-resize-handle-state="drag"],
  &[data-resize-handle-state="hover"] {
    background-color: ${props => props.theme.handleHoverBg}; // Use theme hover color
  }

  // Vertical handle specific styles (between horizontal panels)
  &[aria-orientation="horizontal"] {
    height: 5px; // Remove !important
    cursor: row-resize;
  }

  // Horizontal handle specific styles (between vertical panels)
  &[aria-orientation="vertical"] {
    width: 5px; // Remove !important
    cursor: col-resize;
  }
`;

// --- Dynamic Component Loading Logic ---
const createLazyLoader = (registryEntry) => {
  if (!registryEntry) {
    console.error('[App:createLazyLoader:100] Attempted to create lazy loader with undefined registryEntry');
    return React.lazy(() => Promise.resolve({
      default: () => <div>Error: Plugin path not found in registry</div>
    }));
  }

  console.log('[App:createLazyLoader:107] Creating lazy loader for path:', registryEntry);
  return React.lazy(() => {
    // Get the component name and create the plugin path
    const componentName = registryEntry.split('/').pop();
    const pluginName = componentName.toLowerCase();
    const isPackaged = window.electron?.isPackaged;
    
    console.log('[App:createLazyLoader:115] Environment check:', {
      isPackaged,
      componentName,
      pluginName,
      resourcesPath: window.electron?.resourcesPath
    });

    // In production, load the transpiled plugin from dist/plugins
    // In development, load from src/plugins
    const basePath = isPackaged ? 'dist' : 'src';
    const loadPath = isPackaged
      ? `./${basePath}/plugins/${pluginName}/index.js`  // Production: load transpiled plugin
      : `./${basePath}/plugins/${pluginName}/index.jsx`; // Dev: load source
    
    console.log('[App:createLazyLoader:115] Dynamic import debug info:', {
      originalPath: registryEntry,
      processedPath: loadPath,
      componentName,
      pluginName,
      isPackaged,
      currentLocation: window.location.href,
      baseURI: document.baseURI,
      resourcesPath: window.electron?.resourcesPath,
      appPath: window.electron?.appPath
    });
    
    console.log('[App:createLazyLoader:125] Attempting to load component from:', loadPath);
    return import(/* @vite-ignore */ loadPath)
      .catch(error => {
        console.error('[App:createLazyLoader:128] Failed to dynamically import', loadPath, ':', error);
        console.log('[App:createLazyLoader:129] Error details:', {
          originalPath: registryEntry,
          processedPath: loadPath,
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
          isPackaged,
          resourcesPath: window.electron?.resourcesPath,
          appPath: window.electron?.appPath
        });

        // Try alternative paths
        const alternativePaths = isPackaged ? [
          // Production paths - look for transpiled plugins
          loadPath,
          `./${basePath}/plugins/${pluginName}/index.js`,
          `../${basePath}/plugins/${pluginName}/index.js`,
          // Try with absolute path
          `${window.electron.resourcesPath}/app/${basePath}/plugins/${pluginName}/index.js`,
          // Try in different base locations
          `./plugins/${pluginName}/index.js`,
          `../plugins/${pluginName}/index.js`,
          // Try in assets directory
          `./assets/plugins/${pluginName}/index.js`
        ] : [
          // Development paths - look for source files
          loadPath,
          `./${basePath}/plugins/${pluginName}/index.jsx`,
          `../${basePath}/plugins/${pluginName}/index.jsx`,
          // Try TypeScript for editor
          ...(componentName.includes('Editor') ? [
            `./${basePath}/plugins/${pluginName}/index.tsx`,
            `../${basePath}/plugins/${pluginName}/index.tsx`
          ] : [])
        ];

        console.log('[App:createLazyLoader:154] Trying alternative paths:', alternativePaths);

        // Try each alternative path
        return Promise.any(
          alternativePaths.map(path => {
            console.log(`[App:createLazyLoader:159] Attempting to load from: ${path}`);
            return import(/* @vite-ignore */ path)
              .catch(e => {
                console.log(`[App:createLazyLoader:162] Alternative path ${path} failed:`, e.message);
                return Promise.reject(e);
              });
          })
        ).catch(errors => {
          console.error('[App:createLazyLoader:166] All alternative paths failed');
          return { default: () => (
            <div style={{ padding: '1rem', color: 'red', whiteSpace: 'pre-wrap' }}>
              Error Loading Component: {error.message}
              <br />
              Attempted paths:
              {alternativePaths.map(p => `\n- ${p}`).join('')}
            </div>
          )};
        });
      });
  });
};

// --- App Component ---

const REQUIRED_PANELS = ['file-explorer', 'editor'];

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themePreference, setThemePreference] = useState('system');
  const [panels, setPanels] = useState(new Map());
  const [activeFilePath, setActiveFilePath] = useState(null);
  const [activeFileContent, setActiveFileContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const editorPanelRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  // Layout Configuration - Map panel slots to plugin IDs
  const panelLayoutConfig = {
    panel1: 'file-explorer',
    panel2: 'editor'
  };

  const fetchRegistry = useCallback(async () => {
    try {
      console.log(`[App] Attempt ${retryCountRef.current + 1}/${MAX_RETRIES} to fetch UI Panel Registry...`);
      
      if (!window['ui-panel-registry']?.getRegistry) {
        throw new Error('UI Panel Registry API not available');
      }

      const registry = await window['ui-panel-registry'].getRegistry();
      console.log('[App] Raw registry response:', registry);
      
      // Validate registry structure
      if (!registry || !Array.isArray(registry)) {
        throw new Error('Registry response is not a valid array');
      }

      // Convert array to map for easier lookup
      const panelMap = registry.reduce((acc, panel) => {
        acc[panel.id] = panel;
        return acc;
      }, {});

      // Check if registry has the expected panel entries
      const requiredPanels = [panelLayoutConfig.panel1, panelLayoutConfig.panel2];
      const missingPanels = requiredPanels.filter(panelId => !panelMap[panelId]);
      
      if (missingPanels.length > 0) {
        console.warn('[App] Missing required panels:', missingPanels);
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.log(`[App] Will retry in ${RETRY_DELAY}ms...`);
          retryTimeoutRef.current = setTimeout(fetchRegistry, RETRY_DELAY);
          return;
        } else {
          throw new Error(`Missing required panels: ${missingPanels.join(', ')}`);
        }
      }

      // If we get here, we have a valid registry with required panels
      console.log('[App] Successfully received UI Panel Registry:', panelMap);
      setPanels(new Map(Object.entries(panelMap)));
      setError(null);
      retryCountRef.current = 0;
      setLoading(false);

      // Log panel paths for debugging
      console.log('[App] Panel paths:', {
        panel1: panelMap[panelLayoutConfig.panel1].component,
        panel2: panelMap[panelLayoutConfig.panel2].component
      });
    } catch (error) {
      console.error('[App] Error fetching UI Panel Registry:', error);
      console.error('[App] Error details:', {
        retryCount: retryCountRef.current,
        hasUiPanelRegistry: !!window['ui-panel-registry'],
        hasGetRegistry: !!window['ui-panel-registry']?.getRegistry,
        error: error.message,
        stack: error.stack
      });

      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        console.log(`[App] Will retry in ${RETRY_DELAY}ms...`);
        retryTimeoutRef.current = setTimeout(fetchRegistry, RETRY_DELAY);
      } else {
        setError(`Failed to load UI Panel Registry: ${error.message}`);
        setLoading(false);
      }
    }
  }, [panelLayoutConfig.panel1, panelLayoutConfig.panel2]);

  useEffect(() => {
    // Fetch initial theme state
    window.theme?.getInitialState().then(initialState => {
      if (initialState) {
        console.log('[App] Received initial theme state:', initialState);
        setIsDarkMode(initialState.isDarkMode);
        setThemePreference(initialState.preference);
      }
    }).catch(err => console.error('[App] Error getting initial theme state:', err));

    // Setup theme update listener
    const removeThemeListener = window.theme?.onUpdate(({ isDarkMode, preference }) => {
      console.log('[App] Theme info received via listener:', { isDarkMode, preference });
      setIsDarkMode(isDarkMode);
      setThemePreference(preference);
    });

    // Log initial environment state
    console.log('[App] Initial environment check:', {
      hasWindow: typeof window !== 'undefined',
      hasUiPanels: !!window['ui-panel-registry'],
      hasGetRegistry: !!window['ui-panel-registry']?.getRegistry,
      isPackaged: window.electron?.isPackaged,
      resourcesPath: window.electron?.resourcesPath
    });

    // Start fetching the registry
    fetchRegistry();

    // Cleanup
    return () => {
      removeThemeListener?.();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchRegistry]);

  // Debug logging for current state
  useEffect(() => {
    console.log('[App] Current state:', {
      loading,
      panels,
      panel1: panels.get(panelLayoutConfig.panel1),
      panel2: panels.get(panelLayoutConfig.panel2)
    });
  }, [loading, panels, panelLayoutConfig]);

  // Create lazy loaders only if we have the registry and the panel exists
  const Panel1Component = !loading && panels.has(panelLayoutConfig.panel1) 
    ? createLazyLoader(panels.get(panelLayoutConfig.panel1).component) 
    : null;
  const Panel2Component = !loading && panels.has(panelLayoutConfig.panel2)
    ? createLazyLoader(panels.get(panelLayoutConfig.panel2).component)
    : null;

  // Callback for File Explorer to open a file
  const handleFileSelect = useCallback(async (filePath) => {
    console.log('[App] File selected:', filePath);
    // Basic check to prevent reloading the same file unnecessarily
    if (filePath === activeFilePath) {
        console.log('[App] File already active.');
        return; 
    }
    try {
      if (!window['fs-service']) throw new Error('fs-service not available');
      const content = await window['fs-service'].readFile(filePath);
      setActiveFilePath(filePath);
      setActiveFileContent(content);
      console.log('[App] File loaded successfully into state.');
    } catch (error) {
      console.error('[App] Error reading file:', error);
      // Show error to user - update state to reflect error
      setActiveFilePath(filePath); // Show path even if read fails
      setActiveFileContent(`// Error loading file: ${error.message}`);
    }
  }, [activeFilePath]);

  const currentTheme = isDarkMode ? darkTheme : lightTheme;
  currentTheme.isDarkMode = isDarkMode;

  console.log(`[App] Rendering. Loading: ${loading}`);

  // Loading state while registry is fetched
  if (loading) {
    return (
      <ThemeProvider theme={currentTheme}>
        <AppContainer>
          <LoadingPlaceholder>Loading Application Core...</LoadingPlaceholder>
        </AppContainer>
      </ThemeProvider>
    );
  }

  // Error state if registry fetch failed
  if (error) {
    return (
      <ThemeProvider theme={currentTheme}>
        <AppContainer>
          <ErrorPlaceholder>
            Error Loading Application: {error}
            <button onClick={() => fetchRegistry()}>Retry</button>
          </ErrorPlaceholder>
        </AppContainer>
      </ThemeProvider>
    );
  }

  const fileExplorerPanel = panels.get('file-explorer');
  const editorPanel = panels.get('editor');

  if (!fileExplorerPanel || !editorPanel) {
    return <div className="error">Required panels are not properly configured.</div>;
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <AppContainer>
        <MainAreaContainer>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={36} minSize={10}>
              <PanelGroup direction="vertical">
                <Panel defaultSize={70} minSize={10} id="panel1">
                  {Panel1Component ? (
                    <Suspense fallback={<LoadingPlaceholder>Loading Explorer...</LoadingPlaceholder>}>
                      <StyledPanelContent>
                        <Panel1Component onFileSelect={handleFileSelect} />
                      </StyledPanelContent>
                    </Suspense>
                  ) : (
                    <StyledPanelContent>File Explorer Panel (Not Loaded)</StyledPanelContent>
                  )}
                </Panel>
                <StyledResizeHandle />
                <Panel minSize={10} id="panel4">
                  <StyledPanelContent>Panel 4</StyledPanelContent>
                </Panel>
              </PanelGroup>
            </Panel>
            <StyledResizeHandle />
            <Panel minSize={10}>
              <PanelGroup direction="horizontal">
                <Panel defaultSize={50} minSize={10}>
                  <PanelGroup direction="vertical">
                    <Panel defaultSize={70} minSize={10} id="panel2">
                      {Panel2Component ? (
                        <Suspense fallback={<LoadingPlaceholder>Loading Editor...</LoadingPlaceholder>}>
                          <StyledPanelContent style={{ padding: '3px' }}>
                            <Panel2Component
                              ref={editorPanelRef}
                              theme={currentTheme}
                              fileContent={activeFileContent}
                              filePath={activeFilePath}
                              key={activeFilePath}
                            />
                          </StyledPanelContent>
                        </Suspense>
                      ) : (
                        <StyledPanelContent>Editor Panel (Not Loaded)</StyledPanelContent>
                      )}
                    </Panel>
                    <StyledResizeHandle />
                    <Panel minSize={10} id="panel5">
                      <StyledPanelContent>Panel 5</StyledPanelContent>
                    </Panel>
                  </PanelGroup>
                </Panel>
                <StyledResizeHandle />
                <Panel minSize={10}>
                  <PanelGroup direction="vertical">
                    <Panel defaultSize={70} minSize={10}>
                      <StyledPanelContent>Panel 3</StyledPanelContent>
                    </Panel>
                    <StyledResizeHandle />
                    <Panel minSize={10}>
                      <StyledPanelContent>Panel 6</StyledPanelContent>
                    </Panel>
                  </PanelGroup>
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </MainAreaContainer>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;