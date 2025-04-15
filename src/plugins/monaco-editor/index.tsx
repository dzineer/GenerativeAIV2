import React, { forwardRef } from 'react';

interface MonacoEditorProps {
  theme?: any;
  fileContent?: string;
  filePath?: string;
}

export const MonacoEditor = forwardRef<HTMLDivElement, MonacoEditorProps>(
  ({ theme, fileContent = '', filePath }, ref) => {
    return (
      <div ref={ref} className="monaco-editor" style={{ width: '100%', height: '100%' }}>
        {/* Monaco editor implementation will go here */}
        <pre>{fileContent}</pre>
      </div>
    );
  }
);

MonacoEditor.displayName = 'MonacoEditor';

export default MonacoEditor; 