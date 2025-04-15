import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import Editor from '@monaco-editor/react';
import styled from 'styled-components'; // Import styled-components

// --- Styled Toolbar ---
const EditorContainer = styled.div`
  display: flex;
  flex-direction: column; /* Stack toolbar and editor vertically */
  height: 100%;
  width: 100%;
  overflow: hidden; /* Prevent potential overflow issues */
`;

const TOOLBAR_HEIGHT = '34px'; // Define toolbar height

const Toolbar = styled.div`
  display: flex;
  justify-content: center; /* Align items to the center */
  align-items: center;
  padding: 0 8px;
  height: ${TOOLBAR_HEIGHT};
  flex-shrink: 0;
  border-bottom: 1px solid ${props => props.theme.borderColor || '#555'};
  gap: 8px; /* Add space between toolbar items */
  margin-bottom: 22px; /* Increased margin below toolbar */
`;

// Use a styled component for icon buttons for consistency
const IconButton = styled.button`
  background: none;
  border: none;
  padding: 2px;
  margin: 0;
  cursor: pointer;
  color: ${props => props.theme.textColor || '#ccc'}; // Use theme text color
  display: inline-flex; // Ensure icon aligns correctly
  align-items: center;
  justify-content: center;
  border-radius: 3px; // Slight rounding

  &:hover {
    background-color: ${props => props.theme.panelLoadingBg || '#eee'}; // Use theme hover
  }

  .codicon {
    font-size: 16px;
  }
`;

// Wrapper for the editor itself to manage height
const EditorWrapper = styled.div`
  flex-grow: 1; /* Take remaining space */
  height: calc(100% - ${TOOLBAR_HEIGHT}); /* Calculate height */
  overflow: hidden; /* Prevent editor overflow issues */
`;
// --- End Styled Toolbar ---

// Use forwardRef to allow parent components (App.jsx) to get the editor instance
const EditorPanel = forwardRef(({ theme, fileContent, filePath }, ref) => {
  const editorInstanceRef = useRef(null);
  const [isMinimapVisible, setIsMinimapVisible] = useState(true); // State for minimap

  function handleEditorDidMount(editor, monaco) {
    console.log('[EditorPanel] Monaco Editor Mounted');
    editorInstanceRef.current = editor;
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
      const range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
      const op = { range: range, text: text, forceMoveMarkers: true };
      editor.executeEdits("plugin-insert", [op]);
    },
    // Add other methods as needed (e.g., setContent, getSelection, etc.)
  }));

  console.log(`[EditorPanel] Rendering/Updating. Path: ${filePath}`);

  const toggleMinimap = () => {
    setIsMinimapVisible(prev => !prev);
  };

  // Placeholder for future actions
  const handlePlaceholderClick = (iconName) => {
    console.log(`Placeholder icon clicked: ${iconName}`);
    alert(`Placeholder action for: ${iconName}`);
  };

  return (
    <EditorContainer> { /* Wrap toolbar and editor */ }
      <Toolbar theme={theme}> { /* Pass theme for button styling */ }
        {/* Placeholder Icons */}
        <IconButton theme={theme} onClick={() => handlePlaceholderClick('clippy')} title="Copy (Placeholder)">
          <i className="codicon codicon-clippy"></i>
        </IconButton>
        <IconButton theme={theme} onClick={() => handlePlaceholderClick('search')} title="Search (Placeholder)">
          <i className="codicon codicon-search"></i>
        </IconButton>
        <IconButton theme={theme} onClick={() => handlePlaceholderClick('git-branch')} title="Branch (Placeholder)">
          <i className="codicon codicon-git-branch"></i>
        </IconButton>

        {/* Minimap Toggle Icon */}
        <IconButton theme={theme} onClick={toggleMinimap} title={isMinimapVisible ? 'Hide Minimap' : 'Show Minimap'}>
          <i className={`codicon codicon-map${isMinimapVisible ? '' : '-filled'}`}></i> 
          {/* Or use codicon-layout-sidebar-right / codicon-layout-sidebar-right-off */}
        </IconButton>

        {/* More Placeholder Icons */}
        <IconButton theme={theme} onClick={() => handlePlaceholderClick('layout')} title="Layout (Placeholder)">
          <i className="codicon codicon-layout"></i>
        </IconButton>
        <IconButton theme={theme} onClick={() => handlePlaceholderClick('chevron-down')} title="More (Placeholder)">
          <i className="codicon codicon-chevron-down"></i>
        </IconButton>
      </Toolbar>
      {/* Wrap Editor in the height-managed wrapper */}
      <EditorWrapper>
        <Editor
          // Remove wrapperProps, height managed by EditorWrapper
          width="100%"
          // Setting height to 100% of the wrapper
          height="100%"
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
            // Control minimap visibility via state
            minimap: { enabled: isMinimapVisible }, 
            // Add option to reduce space reserved for line numbers
            lineNumbersMinChars: 3, 
            // Ensure glyph margin is on for line numbers
            glyphMargin: true, 
            // Add other Monaco options
          }}
          // Consider adding key={filePath} in App.jsx if full re-mount is desired on file change
        />
      </EditorWrapper>
    </EditorContainer>
  );
});

export default EditorPanel; 