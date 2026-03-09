// services/notificationService.js
import api from './api';

// notification.js
// Simple notification service for user feedback
// Can be replaced with a proper toast library later

export const notificationService = {
  success: (message) => {
    console.log(`✅ Success: ${message}`);
    // You can replace with toast.success(message) when using a library
  },
  
  error: (message) => {
    console.error(`❌ Error: ${message}`);
    // You can replace with toast.error(message)
  },
  
  warning: (message) => {
    console.warn(`⚠️ Warning: ${message}`);
    // You can replace with toast.warning(message)
  },
  
  info: (message) => {
    console.log(`ℹ️ Info: ${message}`);
    // You can replace with toast.info(message)
  }
};