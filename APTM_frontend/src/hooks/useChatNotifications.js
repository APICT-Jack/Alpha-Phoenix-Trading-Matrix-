// hooks/useChatNotifications.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { socketService } from '../services/socketService';

export const useChatNotifications = (currentUser, activeChat) => {
  const [unreadCounts, setUnreadCounts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const processedMessageIds = useRef(new Set());
  const processedReadIds = useRef(new Set());

  // Load initial unread counts
  useEffect(() => {
    const stored = localStorage.getItem('chat_unread_counts');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUnreadCounts(parsed);
        setTotalUnread(Object.values(parsed).reduce((a, b) => a + b, 0));
      } catch (e) {
        console.error('Error loading unread counts:', e);
      }
    }
  }, []);

  // Save unread counts
  useEffect(() => {
    localStorage.setItem('chat_unread_counts', JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  // Handle new message
  const handleNewMessage = useCallback((message) => {
    // Prevent processing own messages
    const isOwnMessage = message.senderId === currentUser?.id || 
                         message.sender?._id === currentUser?.id;
    if (isOwnMessage) return;

    // Prevent duplicates
    const messageId = message._id || message.id;
    if (processedMessageIds.current.has(messageId)) return;
    
    if (messageId) {
      processedMessageIds.current.add(messageId);
      setTimeout(() => processedMessageIds.current.delete(messageId), 3000);
    }

    const conversationId = message.conversationId;
    
    // Don't increment if this conversation is active
    if (activeChat?.id === conversationId) {
      return;
    }

    // Update unread count
    setUnreadCounts(prev => {
      const current = prev[conversationId] || 0;
      const newCount = current + 1;
      
      setTotalUnread(prevTotal => prevTotal + 1);
      
      return {
        ...prev,
        [conversationId]: newCount
      };
    });

    // Add notification
    const senderName = message.sender?.name || message.senderName || 'Someone';
    const notification = {
      id: `notif_${Date.now()}_${Math.random()}`,
      type: 'message',
      title: `New message from ${senderName}`,
      body: message.text?.substring(0, 60) + (message.text?.length > 60 ? '...' : ''),
      conversationId,
      userId: message.senderId,
      senderName,
      timestamp: message.createdAt || new Date().toISOString()
    };

    setNotifications(prev => [notification, ...prev].slice(0, 20));
  }, [currentUser, activeChat]);

  // Handle messages read
  const handleMessagesRead = useCallback(({ conversationId, readerId }) => {
    // Prevent duplicate processing
    const readKey = `${conversationId}-${readerId}-${Date.now()}`;
    if (processedReadIds.current.has(readKey)) return;
    processedReadIds.current.add(readKey);
    setTimeout(() => processedReadIds.current.delete(readKey), 2000);

    // Clear unread count
    setUnreadCounts(prev => {
      const oldCount = prev[conversationId] || 0;
      if (oldCount === 0) return prev;
      
      const newState = { ...prev };
      delete newState[conversationId];
      
      setTotalUnread(prevTotal => Math.max(0, prevTotal - oldCount));
      
      return newState;
    });

    // Remove notifications for this conversation
    setNotifications(prev => 
      prev.filter(n => n.conversationId !== conversationId)
    );
  }, []);

  // Handle conversation opened
  const handleConversationOpened = useCallback((conversationId) => {
    const count = unreadCounts[conversationId] || 0;
    if (count > 0) {
      setUnreadCounts(prev => {
        const newState = { ...prev };
        delete newState[conversationId];
        return newState;
      });
      
      setTotalUnread(prev => Math.max(0, prev - count));
      
      setNotifications(prev => 
        prev.filter(n => n.conversationId !== conversationId)
      );
    }
  }, [unreadCounts]);

  // Setup socket listeners
  useEffect(() => {
    if (!socketService) return;

    socketService.on('message:receive', handleNewMessage);
    socketService.on('messages:read', handleMessagesRead);

    return () => {
      socketService.off('message:receive', handleNewMessage);
      socketService.off('messages:read', handleMessagesRead);
    };
  }, [handleNewMessage, handleMessagesRead]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Clear conversation
  const clearConversation = useCallback((conversationId) => {
    setUnreadCounts(prev => {
      const newState = { ...prev };
      delete newState[conversationId];
      return newState;
    });
    
    setNotifications(prev => 
      prev.filter(n => n.conversationId !== conversationId)
    );
    
    setTotalUnread(prev => {
      const count = unreadCounts[conversationId] || 0;
      return Math.max(0, prev - count);
    });
  }, [unreadCounts]);

  return {
    unreadCounts,
    notifications,
    totalUnread,
    handleConversationOpened,
    clearNotifications,
    clearConversation
  };
};