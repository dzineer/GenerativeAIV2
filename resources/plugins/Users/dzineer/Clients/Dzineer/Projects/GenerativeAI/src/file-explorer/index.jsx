import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ExplorerContainer = styled.div`
  background: #1e1e1e;
  color: #d4d4d4;
  height: 100%;
  overflow-y: auto;
  padding: 8px;
`;

const ExplorerHeader = styled.div`
  font-weight: bold;
  padding: 4px 8px;
  border-bottom: 1px solid #333;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FileTree = styled.div`
  padding-left: ${props => props.depth * 16}px;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 2px 8px;
  cursor: pointer;
  user-select: none;
  
  &:hover {
    background: #2a2d2e;
  }
  
  ${props => props.$selected && `
    background: #094771;
    &:hover {
      background: #094771;
    }
  `}
`;

const FileIcon = styled.span`
  margin-right: 6px;
  font-size: 14px;
`;

const FileName = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FolderArrow = styled.span`
  display: inline-block;
  margin-right: 4px;
  transform: ${props => props.$expanded ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 0.15s ease;
`;

const LoadingMessage = styled.div`
  padding: 8px;
  color: #888;
`;

const ErrorMessage = styled.div`
  padding: 8px;
  color: #f14c4c;
  background-color: #1e1e1e;
  border: 1px solid #f14c4c;
  margin: 8px;
  border-radius: 4px;
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  color: #d4d4d4;
  cursor: pointer;
  padding: 4px;
  &:hover {
    color: #ffffff;
  }
`;

const FileExplorer = ({ onFileSelect }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['/']));
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isElectron = window['fs-service']?.isElectron === true;

  const loadFiles = async (path) => {
    if (!isElectron) return;
    
    try {
      setLoading(true);
      setError(null);
      const fileList = await window['fs-service'].listFiles(path);
      setFiles(fileList);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

  const getIcon = (item) => {
    if (item.isDirectory) {
      return '📁';
    }
    
    const ext = item.name?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return '🟨';
      case 'css':
        return '🎨';
      case 'json':
        return '🔧';
      case 'md':
        return '📝';
      default:
        return '📄';
    }
  };

  const handleFileClick = async (item) => {
    const newPath = item.path;
    if (item.isDirectory) {
      if (expandedFolders.has(newPath)) {
        const next = new Set(expandedFolders);
        next.delete(newPath);
        setExpandedFolders(next);
      } else {
        setExpandedFolders(new Set([...expandedFolders, newPath]));
        await loadFiles(newPath);
      }
    } else {
      setSelectedFile(newPath);
      onFileSelect?.(newPath);
    }
  };

  const renderFileTree = (items, depth = 0) => {
    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path);

      return (
        <React.Fragment key={item.path}>
          <FileItem
            $selected={selectedFile === item.path}
            onClick={() => handleFileClick(item)}
          >
            {item.isDirectory && (
              <FolderArrow $expanded={isExpanded}>▶</FolderArrow>
            )}
            <FileIcon>{getIcon(item)}</FileIcon>
            <FileName>{item.name}</FileName>
          </FileItem>
          {item.isDirectory && isExpanded && (
            <FileTree depth={depth + 1}>
              {renderFileTree(
                files.filter(f => f.path.startsWith(item.path + '/') &&
                  f.path.split('/').length === item.path.split('/').length + 1),
                depth + 1
              )}
            </FileTree>
          )}
        </React.Fragment>
      );
    });
  };

  if (!isElectron) {
    return (
      <ExplorerContainer>
        <ErrorMessage>
          ⚠️ File Explorer is only available in Electron mode
          <br /><br />
          To use the file explorer:
          <br />
          1. Close this browser window
          <br />
          2. Run the app using electron (npm run electron)
        </ErrorMessage>
      </ExplorerContainer>
    );
  }

  return (
    <ExplorerContainer>
      <ExplorerHeader>
        Files
        <RefreshButton onClick={() => loadFiles(currentPath)} title="Refresh">
          🔄
        </RefreshButton>
      </ExplorerHeader>
      {loading ? (
        <LoadingMessage>Loading files...</LoadingMessage>
      ) : error ? (
        <ErrorMessage>Error: {error}</ErrorMessage>
      ) : (
        <FileTree depth={0}>
          {renderFileTree(files.filter(f => f.path.split('/').length === 2))}
        </FileTree>
      )}
    </ExplorerContainer>
  );
};

export default FileExplorer; 