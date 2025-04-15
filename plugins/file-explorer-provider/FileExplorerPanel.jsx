import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

// --- Styled Components ---
const TreeContainer = styled.div`
  padding: 5px;
  height: 100%;
  overflow-y: auto;
  font-family: sans-serif;
  font-size: 13px;
  line-height: 1.4;
`;

const TreeNodeContainer = styled.div`
  padding-left: ${props => (props.level || 0) * 18}px;
`;

const NodeLabel = styled.span`
  cursor: pointer;
  padding: 1px 3px;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;

  &:hover {
    background-color: ${props => props.theme.panelLoadingBg || '#eee'};
  }

  /* Styling for the icon span itself */
  .codicon {
    /* Use theme color for icons */
    color: ${props => props.theme.textColor || 'inherit'};
    margin-right: 4px;
    font-size: 15px;
    vertical-align: middle;
    /* Ensure chevron width doesn't collapse */
    min-width: 1em; 
  }
`;

const ErrorMessage = styled.p`
  color: red;
  padding: 5px;
`;

// --- TreeNode Component ---
const TreeNode = ({ node, level, onFileSelect, onToggleExpand }) => {
  const handleNodeClick = () => {
    if (node.isDirectory) {
      onToggleExpand(node.path, !node.isExpanded);
    } else {
      onFileSelect(node.path);
    }
  };

  // Determine icon class based on type and state
  let iconClass;
  if (node.isDirectory) {
    // Use Chevrons for directories
    iconClass = node.isExpanded ? 'codicon codicon-chevron-down' : 'codicon codicon-chevron-right';
  } else {
    // Use File icon for files
    iconClass = 'codicon codicon-file'; 
  }

  return (
    <TreeNodeContainer level={level}>
      <NodeLabel 
        $isDirectory={node.isDirectory} 
        onClick={handleNodeClick}
      >
        <i className={iconClass}></i> 
        {node.name}
      </NodeLabel>
      {node.isExpanded && node.isDirectory && node.children && (
        <div>
          {node.isLoading && <div style={{ paddingLeft: '20px', fontStyle: 'italic' }}>Loading...</div>}
          {node.children.sort((a, b) => {
            // Sort folders first, then alphabetically
            if (a.isDirectory !== b.isDirectory) {
              return a.isDirectory ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          }).map(child => (
            <TreeNode 
              key={child.path}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </TreeNodeContainer>
  );
};

// --- FileExplorerPanel Component ---
const FileExplorerPanel = ({ onFileSelect }) => {
  const [treeData, setTreeData] = useState({ name: '.', path: '.', isDirectory: true, isExpanded: false, children: [], isLoading: false });
  const [error, setError] = useState(null);

  // Function to fetch directory contents
  const fetchDirectoryContents = useCallback(async (dirPath) => {
    setError(null);
    try {
      if (!window.fsService) {
        throw new Error('File service is not available.');
      }
      console.log(`[FileExplorer] Fetching contents for: ${dirPath}`);
      const files = await window.fsService.listFiles(dirPath);
      console.log(`[FileExplorer] Received contents for ${dirPath}:`, files);
      return files.map(file => ({ ...file, isExpanded: false, children: [], isLoading: false })); // Add tree node properties
    } catch (err) {
      console.error(`[FileExplorer] Error fetching contents for ${dirPath}:`, err);
      setError(`Error loading ${dirPath}: ${err.message}`);
      return []; // Return empty on error
    }
  }, []);

  // Function to update the tree state recursively
  const updateTreeNode = (nodes, targetPath, updates) => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return { ...node, ...updates };
      }
      if (node.isDirectory && targetPath.startsWith(node.path + '/') && node.children?.length > 0) {
          // Recurse into children if the target path could be within this expanded node
          return { ...node, children: updateTreeNode(node.children, targetPath, updates) };
      }
      return node;
    });
  };
  
  // Function to handle expanding/collapsing folders
  const handleToggleExpand = useCallback(async (nodePath, expand = true) => {
    console.log(`[FileExplorer] Toggling expand for ${nodePath} to ${expand}`);
    
    // Optimistically update expansion state and set loading
    setTreeData(currentTree => {
      if (currentTree.path === nodePath) {
        return { ...currentTree, isExpanded: expand, isLoading: expand }; // Handle root toggle
      } 
      return { ...currentTree, children: updateTreeNode(currentTree.children, nodePath, { isExpanded: expand, isLoading: expand }) };
    });
    
    if (expand) {
      const children = await fetchDirectoryContents(nodePath);
      // Update tree with fetched children and turn off loading
       setTreeData(currentTree => {
         if (currentTree.path === nodePath) {
            return { ...currentTree, children: children, isLoading: false }; // Handle root
         }
         return { ...currentTree, children: updateTreeNode(currentTree.children, nodePath, { children: children, isLoading: false }) };
       });
    } else {
        // If collapsing, we can optionally clear children or just visually hide them
        // For simplicity, just update loading state (already done optimistically)
         setTreeData(currentTree => {
            if (currentTree.path === nodePath) {
                return { ...currentTree, isLoading: false }; // Handle root
            }
           return { ...currentTree, children: updateTreeNode(currentTree.children, nodePath, { isLoading: false }) }; // Turn off loading
         });
    }
  }, [fetchDirectoryContents]);

  // Initial fetch for root directory
  useEffect(() => {
    handleToggleExpand('.', true); // Expand root on mount
  }, [handleToggleExpand]);

  return (
    <TreeContainer>
      <h3>File Explorer</h3>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <TreeNode 
        node={treeData} 
        level={0} 
        onFileSelect={onFileSelect} 
        onToggleExpand={handleToggleExpand} 
      />
    </TreeContainer>
  );
};

export default FileExplorerPanel; 