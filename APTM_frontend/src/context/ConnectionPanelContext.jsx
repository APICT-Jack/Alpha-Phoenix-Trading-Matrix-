// src/context/ConnectionPanelContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';

const ConnectionPanelContext = createContext();

export const useConnectionPanel = () => {
  const context = useContext(ConnectionPanelContext);
  if (!context) {
    throw new Error('useConnectionPanel must be used within ConnectionPanelProvider');
  }
  return context;
};

export const ConnectionPanelProvider = ({ children }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [initialTab, setInitialTab] = useState('followers');

  const openPanel = useCallback((tab = 'followers') => {
    setInitialTab(tab);
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  return (
    <ConnectionPanelContext.Provider
      value={{
        isPanelOpen,
        initialTab,
        openPanel,
        closePanel,
        togglePanel
      }}
    >
      {children}
    </ConnectionPanelContext.Provider>
  );
};