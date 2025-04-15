import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import { PanelId, PanelRegistry, PanelRegistryEntry } from './types';
import './styles/App.css';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Add any initialization logic here
        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize app';
        console.error(`App initialization failed: ${errorMessage}`);
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <div className="app-loading">Loading application...</div>;
  }

  if (error) {
    return <div className="app-error">Error: {error}</div>;
  }

  return (
    <div className="app">
      <Layout />
    </div>
  );
};

export default App; 