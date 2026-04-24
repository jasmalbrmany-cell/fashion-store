import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'loading' | 'info';
  message: string;
  duration?: number;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    message: string,
    type: 'success' | 'error' | 'loading' | 'info' = 'info',
    duration: number = 3000
  ) => {
    const id = Date.now().toString();
    const notification: Notification = { id, type, message, duration };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after duration (using setState functional form to avoid stale closure)
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    return addNotification(message, 'success', duration);
  }, [addNotification]);

  const showError = useCallback((message: string, duration?: number) => {
    return addNotification(message, 'error', duration || 5000);
  }, [addNotification]);

  const showLoading = useCallback((message: string) => {
    return addNotification(message, 'loading', 0);
  }, [addNotification]);

  const showInfo = useCallback((message: string, duration?: number) => {
    return addNotification(message, 'info', duration);
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showLoading,
    showInfo,
  };
};
