import React, { createContext, useContext, ReactNode } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { NotificationContainer } from '@/components/NotificationContainer';

interface NotificationContextType {
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showLoading: (message: string) => string;
  showInfo: (message: string, duration?: number) => string;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showLoading,
    showInfo,
  } = useNotification();

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showLoading,
        showInfo,
        removeNotification,
      }}
    >
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};
