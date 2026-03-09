// usePostMedia.js
// Manages media state and interactions (images, videos)
// Handles lightbox, video controls, and URL formatting

import { useState, useCallback, useRef } from 'react';
import { 
  FaExpand, 
  FaCompress, 
  FaVolumeUp, 
  FaVolumeMute,
  FaFileAlt,
  FaExternalLinkAlt 
} from 'react-icons/fa';  // Make sure to import these icons

const usePostMedia = ({ showMediaLightbox = true, autoPlayVideo = false, muteVideo = true }) => {
  // ===== IMAGE STATES =====
  const [imageError, setImageError] = useState({});
  
  // ===== VIDEO STATES =====
  const [videoPlaying, setVideoPlaying] = useState({});
  const [videoMuted, setVideoMuted] = useState({});
  const [videoFullscreen, setVideoFullscreen] = useState({});
  
  // ===== LIGHTBOX STATES =====
  const [showMediaLightboxState, setShowMediaLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // ===== REFS =====
  const videoRefs = useRef({});

  // ===== IMAGE HANDLERS =====
  const handleImageError = useCallback((mediaId) => {
    setImageError(prev => ({ ...prev, [mediaId]: true }));
  }, []);

  // ===== VIDEO HANDLERS =====
  const handleVideoPlay = useCallback((videoId) => {
    setVideoPlaying(prev => ({ ...prev, [videoId]: true }));
  }, []);

  const handleVideoPause = useCallback((videoId) => {
    setVideoPlaying(prev => ({ ...prev, [videoId]: false }));
  }, []);

  const handleVideoMute = useCallback((videoId) => {
    setVideoMuted(prev => ({ ...prev, [videoId]: !prev[videoId] }));
  }, []);

  const handleVideoFullscreen = useCallback((videoId) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setVideoFullscreen(prev => ({ ...prev, [videoId]: false }));
      } else {
        video.requestFullscreen();
        setVideoFullscreen(prev => ({ ...prev, [videoId]: true }));
      }
    }
  }, []);

  // ===== LIGHTBOX HANDLERS =====
  const openLightbox = useCallback((index) => {
    setLightboxIndex(index);
    setShowMediaLightbox(true);
  }, []);

  // ===== URL FORMATTING =====
  const formatMediaUrl = useCallback((media) => {
    if (!media) return null;
    
    if (typeof media === 'string') {
      if (media.startsWith('http') || media.startsWith('data:')) {
        return media;
      }
      const cleanPath = media.replace(/^\/+/, '');
      return `http://localhost:5000/${cleanPath}`;
    }
    
    if (media.url) {
      if (media.url.startsWith('http') || media.url.startsWith('data:')) {
        return media.url;
      }
      const cleanPath = media.url.replace(/^\/+/, '');
      return `http://localhost:5000/${cleanPath}`;
    }
    
    return null;
  }, []);

  const formatAvatarUrl = useCallback((avatar) => {
    if (!avatar) return null;
    
    if (typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('data:'))) {
      return avatar;
    }
    
    if (typeof avatar === 'object' && avatar?.url) {
      return avatar.url;
    }
    
    if (typeof avatar === 'string') {
      const cleanPath = avatar.replace(/^\/+/, '');
      if (cleanPath.startsWith('uploads/')) {
        return `http://localhost:5000/${cleanPath}`;
      }
      return `http://localhost:5000/uploads/${cleanPath}`;
    }
    
    return null;
  }, []);

  // ===== RENDER MEDIA FUNCTION =====
  const renderMedia = useCallback((media, index, postId) => {
    const mediaUrl = formatMediaUrl(media);
    if (!mediaUrl) return null;
    
    const mediaType = typeof media === 'object' ? media?.type : 
      (media.url ? media.type : media.split('.').pop()?.toLowerCase());
    
    const mediaId = `${postId}-${index}`;
    
    if (mediaType?.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(mediaType)) {
      return (
        <div 
          key={index} 
          className="mediaItem"
          onClick={() => showMediaLightbox && openLightbox(index)}
        >
          <img 
            src={mediaUrl} 
            alt={`Post media ${index + 1}`} 
            className="postImage"
            onError={(e) => e.target.style.display = 'none'}
            loading="lazy"
          />
          {showMediaLightbox && (
            <div className="mediaOverlay">
              <FaExpand />
            </div>
          )}
        </div>
      );
    }
    
    if (mediaType?.startsWith('video') || ['mp4', 'webm', 'mov', 'avi'].includes(mediaType)) {
      return (
        <div key={index} className="mediaItem">
          <video 
            ref={el => videoRefs.current[mediaId] = el}
            src={mediaUrl} 
            className="postVideo"
            controls
            autoPlay={autoPlayVideo && videoPlaying[mediaId]}
            muted={muteVideo || videoMuted[mediaId]}
            onPlay={() => handleVideoPlay(mediaId)}
            onPause={() => handleVideoPause(mediaId)}
          />
          <div className="videoControls">
            <button onClick={() => handleVideoMute(mediaId)}>
              {videoMuted[mediaId] ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            <button onClick={() => handleVideoFullscreen(mediaId)}>
              {videoFullscreen[mediaId] ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div key={index} className="mediaItem">
        <a 
          href={mediaUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="documentLink"
        >
          <FaFileAlt />
          <span>View Attachment</span>
          <FaExternalLinkAlt />
        </a>
      </div>
    );
  }, [formatMediaUrl, showMediaLightbox, autoPlayVideo, muteVideo, videoPlaying, videoMuted, videoFullscreen, openLightbox, handleVideoPlay, handleVideoPause, handleVideoMute, handleVideoFullscreen]);

  // Return everything including renderMedia
  return {
    imageError,
    videoPlaying,
    videoMuted,
    videoFullscreen,
    videoRefs,
    showMediaLightbox: showMediaLightboxState,
    lightboxIndex,
    setShowMediaLightbox,
    setLightboxIndex,
    handleImageError,
    formatMediaUrl,
    formatAvatarUrl,
    handleVideoPlay,
    handleVideoPause,
    handleVideoMute,
    handleVideoFullscreen,
    openLightbox,
    renderMedia  // <-- Now this is defined
  };
};

export default usePostMedia;