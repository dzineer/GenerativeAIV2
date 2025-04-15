import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const TerminalContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #1e1e1e;
  padding: 8px;
  overflow: hidden;
  
  .xterm {
    height: 100%;
    
    .xterm-viewport {
      background-color: transparent !important;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  padding: 16px;
  background: #2d2d2d;
  border-radius: 4px;
  margin: 16px;
  font-family: monospace;
`;

const Terminal = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [terminalId, setTerminalId] = useState(null);
  const [error, setError] = useState(null);
  const [isExited, setIsExited] = useState(false);

  return null;
};

export default Terminal; 