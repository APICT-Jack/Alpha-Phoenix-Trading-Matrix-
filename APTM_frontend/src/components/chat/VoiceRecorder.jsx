// components/Chat/VoiceRecorder.jsx - NEW COMPONENT
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import styles from './VoiceRecorder.module.css';

const VoiceRecorder = ({ onSend, onCancel, maxDuration = 60 }) => {
  const { darkMode } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState([]);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for waveform
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingComplete(true);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      let time = 0;
      timerRef.current = setInterval(() => {
        time++;
        setDuration(time);
        if (time >= maxDuration) {
          stopRecording();
        }
      }, 1000);

      // Start waveform visualization
      updateWaveform();

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const updateWaveform = () => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Get average of frequencies for waveform
    const levels = Array.from(dataArray.slice(0, 50)).map(v => v / 255);
    setAudioLevel(levels);

    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordingComplete(false);
    setDuration(0);
    setAudioLevel([]);
    if (onCancel) onCancel();
  };

  const sendRecording = async () => {
    if (audioChunksRef.current.length === 0) return;

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    // Create form data
    const formData = new FormData();
    formData.append('voice', audioBlob);
    formData.append('duration', duration.toString());
    formData.append('waveform', JSON.stringify(audioLevel));

    try {
      const response = await fetch('http://localhost:5000/api/chat/upload/voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (onSend) {
          onSend({
            voiceNote: data.voiceNote,
            duration,
            waveform: audioLevel
          });
        }
      }
    } catch (error) {
      console.error('Error uploading voice note:', error);
    }

    cancelRecording();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (recordingComplete) {
    return (
      <div className={`${styles.voiceRecorder} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.preview}>
          <audio src={audioUrl} controls className={styles.audioPreview} />
        </div>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={cancelRecording}>
            Cancel
          </button>
          <button className={styles.sendBtn} onClick={sendRecording}>
            Send
          </button>
        </div>
      </div>
    );
  }

  if (!isRecording) {
    return (
      <button className={styles.voiceButton} onClick={startRecording} title="Voice message">
        <span>🎤</span>
      </button>
    );
  }

  return (
    <div className={`${styles.voiceRecorder} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.recordingIndicator}>
        <div className={styles.recordingDot}></div>
        <span className={styles.duration}>{formatTime(duration)}</span>
      </div>
      
      <div className={styles.waveform}>
        {audioLevel.map((level, index) => (
          <div
            key={index}
            className={styles.waveformBar}
            style={{ height: `${level * 40}px` }}
          />
        ))}
      </div>

      <div className={styles.recordingActions}>
        <button className={styles.cancelBtn} onClick={cancelRecording}>
          Cancel
        </button>
        <button className={styles.stopBtn} onClick={stopRecording}>
          Stop
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;