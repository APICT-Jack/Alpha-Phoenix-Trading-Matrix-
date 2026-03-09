// components/Chat/MediaUploader.jsx - NEW COMPONENT
import React, { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './MediaUploader.module.css';

const MediaUploader = ({ onUpload, onCancel, maxFiles = 10, maxSize = 100 }) => {
  const { darkMode } = useTheme();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Filter by size
    const validFiles = selectedFiles.filter(file => {
      const sizeInMB = file.size / (1024 * 1024);
      return sizeInMB <= maxSize;
    });

    if (validFiles.length < selectedFiles.length) {
      alert(`Some files were too large. Max size is ${maxSize}MB`);
    }

    // Check total count
    if (files.length + validFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`);
      return;
    }

    // Create previews
    const newFiles = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('video/') ? 'video' : 'file',
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2)
    }));

    setFiles([...files, ...newFiles]);
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    files.forEach((fileObj, index) => {
      formData.append('media', fileObj.file);
    });

    try {
      const response = await fetch('http://localhost:5000/api/chat/upload/media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        onUpload(data.files);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type) => {
    switch(type) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      default: return '📎';
    }
  };

  return (
    <div className={`${styles.mediaUploader} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.header}>
        <h3>Upload Media</h3>
        <button className={styles.closeButton} onClick={onCancel}>×</button>
      </div>

      <div className={styles.uploadArea}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          className={styles.fileInput}
        />
        
        {files.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.uploadIcon}>📎</div>
            <p>Click to select files</p>
            <p className={styles.hint}>Max {maxFiles} files, {maxSize}MB each</p>
            <button 
              className={styles.selectButton}
              onClick={() => fileInputRef.current.click()}
            >
              Select Files
            </button>
          </div>
        )}

        {files.length > 0 && (
          <div className={styles.fileList}>
            {files.map(file => (
              <div key={file.id} className={styles.fileItem}>
                {file.preview ? (
                  <img src={file.preview} alt={file.name} className={styles.filePreview} />
                ) : (
                  <div className={styles.fileIcon}>{getFileIcon(file.type)}</div>
                )}
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>{file.size} MB</div>
                </div>
                <button 
                  className={styles.removeButton}
                  onClick={() => removeFile(file.id)}
                  disabled={uploading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className={styles.actions}>
            <button 
              className={styles.addMoreButton}
              onClick={() => fileInputRef.current.click()}
              disabled={files.length >= maxFiles || uploading}
            >
              Add More
            </button>
            <button 
              className={styles.uploadButton}
              onClick={uploadFiles}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaUploader;