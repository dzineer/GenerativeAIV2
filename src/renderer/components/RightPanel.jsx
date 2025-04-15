import React, { useState } from 'react';
import styled from 'styled-components';

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 400px;
  background-color: #1e1e1e;
  color: #fff;
  border-left: 1px solid #333;
`;

const TabContainer = styled.div`
  display: flex;
  background-color: #252526;
  border-bottom: 1px solid #333;
`;

const Tab = styled.div`
  padding: 8px 16px;
  cursor: pointer;
  background-color: ${props => props.$isActive ? '#1e1e1e' : '#252526'};
  border-right: 1px solid #333;
  &:hover {
    background-color: ${props => props.$isActive ? '#1e1e1e' : '#2d2d2d'};
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: auto;
`;

const DebugConsole = styled.div`
  padding: 8px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  white-space: pre-wrap;
`;

const RightPanel = () => {
  const [activeTab, setActiveTab] = useState('problems');
  const [debugOutput, setDebugOutput] = useState([
    { type: 'error', message: 'Failed to connect to debugger: Error' },
    { type: 'info', message: 'at TCPConnectionWrap.afterConnect' },
    { type: 'error', message: 'errno: -61,' },
    { type: 'error', message: 'code: \'ECONNREFUSED\',' },
    { type: 'info', message: 'syscall: \'connect\',' },
    { type: 'info', message: 'address: \'::1\',' },
    { type: 'info', message: 'port: 9222' }
  ]);

  const renderContent = () => {
    switch (activeTab) {
      case 'problems':
        return (
          <DebugConsole>
            {debugOutput.map((line, index) => (
              <div key={index} style={{ color: line.type === 'error' ? '#f48771' : '#75beff' }}>
                {line.message}
              </div>
            ))}
          </DebugConsole>
        );
      case 'output':
        return <DebugConsole>Output content here...</DebugConsole>;
      case 'debug':
        return <DebugConsole>Debug content here...</DebugConsole>;
      default:
        return null;
    }
  };

  return (
    <PanelContainer>
      <TabContainer>
        <Tab 
          $isActive={activeTab === 'problems'} 
          onClick={() => setActiveTab('problems')}
        >
          Problems
        </Tab>
        <Tab 
          $isActive={activeTab === 'output'} 
          onClick={() => setActiveTab('output')}
        >
          Output
        </Tab>
        <Tab 
          $isActive={activeTab === 'debug'} 
          onClick={() => setActiveTab('debug')}
        >
          Debug Console
        </Tab>
      </TabContainer>
      <ContentArea>
        {renderContent()}
      </ContentArea>
    </PanelContainer>
  );
};

export default RightPanel; 