import React from 'react';
import MonacoEditor from './MonacoEditor';
import Terminal from './Terminal';
import '../styles/Layout.css';

const Layout: React.FC = () => {
  return (
    <div className="layout">
      <div className="editor-section">
        <MonacoEditor />
      </div>
      <div className="terminal-section">
        <Terminal />
      </div>
    </div>
  );
};

export default Layout; 