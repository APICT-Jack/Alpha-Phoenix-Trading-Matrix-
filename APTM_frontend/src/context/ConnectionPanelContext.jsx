// src/context/ConnectionPanelContext.jsx
import React, { createContext, useState, useContext } from 'react';

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
  const [activePanelTab, setActivePanelTab] = useState('followers');

  const openPanel = (tab = 'followers') => {
    setActivePanelTab(tab);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <ConnectionPanelContext.Provider
      value={{
        isPanelOpen,
        activePanelTab,
        openPanel,
        closePanel,
        togglePanel,
        setActivePanelTab
      }}
    >
      {children}
    </ConnectionPanelContext.Provider>
  );
};