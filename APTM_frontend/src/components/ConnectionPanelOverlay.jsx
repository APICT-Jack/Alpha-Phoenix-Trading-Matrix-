// src/components/ConnectionPanelOverlay.jsx
import React from 'react';
import { useConnectionPanel } from '../context/ConnectionPanelContext';
import ConnectionPanel from './navigation/ConnectionPanel';

const ConnectionPanelOverlay = () => {
  const { isPanelOpen, closePanel, initialTab } = useConnectionPanel();

  if (!isPanelOpen) return null;

  return (
    <ConnectionPanel
      isOpen={isPanelOpen}
      onClose={closePanel}
      initialTab={initialTab}
      embedded={false}
    />
  );
};

export default ConnectionPanelOverlay;