// WallpaperPanel.jsx - Fixed version with valid icons
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './WallpaperPanel.module.css';

// Valid icons from react-icons/fa
import { 
  FaTimes, 
  FaSun, 
  FaMoon, 
  FaImage, 
  FaTint, 
  FaAdjust,
  FaEyeDropper,
  FaMagic
} from 'react-icons/fa';

const wallpapers = [
  { id: 1, name: 'macOS Default', url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)' },
  { id: 2, name: 'iOS Sunset', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)' },
  { id: 3, name: 'Abstract Ocean', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 100%)' },
  { id: 4, name: 'Mountain Peak', url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 100%)' },
  { id: 5, name: 'Night City', url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)' },
  { id: 6, name: 'Forest Dreams', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)' },
  { id: 7, name: 'Aurora Borealis', url: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)' },
  { id: 8, name: 'Starry Night', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&h=1080&fit=crop', gradient: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)' }
];

const WallpaperPanel = ({ isOpen, onClose, onSelectWallpaper, currentWallpaper, onUpdateSetting, settings }) => {
  const { darkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${darkMode ? styles.dark : styles.light}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Customize Wallpaper</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className={styles.wallpaperGrid}>
          {wallpapers.map(wallpaper => (
            <div
              key={wallpaper.id}
              className={`${styles.wallpaperOption} ${currentWallpaper === wallpaper.url ? styles.selected : ''}`}
              style={{ backgroundImage: `url(${wallpaper.url})` }}
              onClick={() => onSelectWallpaper(wallpaper)}
            >
              <div className={styles.wallpaperOverlay}>
                <span>{wallpaper.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.settingsSection}>
          <h4>Adjust Settings</h4>
          
          <div className={styles.setting}>
            <div className={styles.settingLabel}>
              <FaSun size={14} />
              <span>Brightness</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.01"
              value={settings.brightness}
              onChange={(e) => onUpdateSetting('brightness', parseFloat(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.settingValue}>{Math.round(settings.brightness * 100)}%</span>
          </div>

          <div className={styles.setting}>
            <div className={styles.settingLabel}>
              <FaEyeDropper size={14} />
              <span>Blur Effect</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={settings.blur}
              onChange={(e) => onUpdateSetting('blur', parseInt(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.settingValue}>{settings.blur}px</span>
          </div>

          <div className={styles.setting}>
            <div className={styles.settingLabel}>
              <FaAdjust size={14} />
              <span>Opacity</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1"
              step="0.01"
              value={settings.opacity}
              onChange={(e) => onUpdateSetting('opacity', parseFloat(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.settingValue}>{Math.round(settings.opacity * 100)}%</span>
          </div>
        </div>

        <button className={styles.resetButton} onClick={() => {
          onUpdateSetting('brightness', 0.6);
          onUpdateSetting('blur', 0);
          onUpdateSetting('opacity', 0.8);
        }}>
          <FaMagic size={14} /> Reset to Default
        </button>
      </div>
    </div>
  );
};

export default WallpaperPanel;