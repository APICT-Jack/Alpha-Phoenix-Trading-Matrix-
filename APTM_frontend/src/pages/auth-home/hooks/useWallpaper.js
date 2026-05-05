// src/pages/auth-home/hooks/useWallpaper.js
import { useState, useEffect } from 'react';

export const useWallpaper = () => {
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [activeWallpaperCategory, setActiveWallpaperCategory] = useState('all');
  const [wallpaperSettings, setWallpaperSettings] = useState(() => {
    const saved = localStorage.getItem('wallpaper_settings');
    return saved ? JSON.parse(saved) : {
      url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop',
      brightness: 0.5,
      blur: 0,
      opacity: 1
    };
  });

  const updateWallpaper = (key, value) => {
    setWallpaperSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('wallpaper_settings', JSON.stringify(updated));
      
      // Apply to DOM
      const root = document.querySelector('.auth-homepage');
      if (root) {
        if (key === 'url') root.style.setProperty('--wallpaper-url', `url(${value})`);
        else if (key === 'brightness') root.style.setProperty('--wallpaper-brightness', value);
        else if (key === 'blur') root.style.setProperty('--wallpaper-blur', `${value}px`);
        else if (key === 'opacity') root.style.setProperty('--wallpaper-opacity', value);
      }
      
      return updated;
    });
  };

  const handleWallpaperSelect = (wallpaper) => {
    updateWallpaper('url', wallpaper.url);
    setShowWallpaperModal(false);
  };

  // Apply wallpaper on mount
  useEffect(() => {
    const root = document.querySelector('.auth-homepage');
    if (root) {
      root.style.setProperty('--wallpaper-url', `url(${wallpaperSettings.url})`);
      root.style.setProperty('--wallpaper-brightness', wallpaperSettings.brightness);
      root.style.setProperty('--wallpaper-blur', `${wallpaperSettings.blur}px`);
      root.style.setProperty('--wallpaper-opacity', wallpaperSettings.opacity);
    }
  }, []);

  const wallpaperCategories = [
    { id: 'all', label: 'All' },
    { id: 'nature', label: 'Nature' },
    { id: 'trading', label: 'Trading' },
    { id: 'city', label: 'City' },
    { id: 'abstract', label: 'Abstract' }
  ];

  const wallpaperOptions = [
    { id: 1, name: 'Ocean', url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop', category: 'nature' },
    { id: 2, name: 'Mountain', url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&h=1080&fit=crop', category: 'nature' },
    { id: 3, name: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop', category: 'nature' },
    { id: 4, name: 'Charts', url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&h=1080&fit=crop', category: 'trading' },
    { id: 5, name: 'Market', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop', category: 'trading' },
    { id: 6, name: 'Crypto', url: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=1920&h=1080&fit=crop', category: 'trading' },
    { id: 7, name: 'City Night', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop', category: 'city' },
    { id: 8, name: 'Tokyo', url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&h=1080&fit=crop', category: 'city' },
    { id: 9, name: 'Neon', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&h=1080&fit=crop', category: 'abstract' },
    { id: 10, name: 'Digital', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&h=1080&fit=crop', category: 'abstract' },
  ];

  const getFilteredWallpapers = () => {
    if (activeWallpaperCategory === 'all') return wallpaperOptions;
    return wallpaperOptions.filter(w => w.category === activeWallpaperCategory);
  };

  return {
    // State
    showWallpaperModal,
    activeWallpaperCategory,
    wallpaperSettings,
    
    // Actions
    setShowWallpaperModal,
    setActiveWallpaperCategory,
    updateWallpaper,
    handleWallpaperSelect,
    getFilteredWallpapers,
    wallpaperCategories
  };
};