// src/components/ConnectionPanelOverlay.jsx
import React from 'react';
import { useConnectionPanel } from '../context/ConnectionPanelContext';
import ConnectionPanel from './navigation/ConnectionPanel';
import './ConnectionPanelOverlay.css';

const ConnectionPanelOverlay = () => {
  const { isPanelOpen, closePanel, activePanelTab, setActivePanelTab } = useConnectionPanel();

  if (!isPanelOpen) return null;

  return (
    <>
      <div className="connection-panel-overlay" onClick={closePanel} />
      <div className="connection-panel-container">
        <ConnectionPanel 
          initialTab={activePanelTab}
          onClose={closePanel}
          onTabChange={setActivePanelTab}
          embedded={false}
        />
      </div>
    </>
  );
};

export default ConnectionPanelOverlay;