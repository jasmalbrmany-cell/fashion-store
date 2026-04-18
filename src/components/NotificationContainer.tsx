import React from 'react';
import { Notification } from '@/hooks/useNotification';
import { X, CheckCircle, AlertCircle, Info, Loader } from 'lucide-react';

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`flex items-center gap-3 p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : notification.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : notification.type === 'loading'
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-gray-50 border border-gray-200'
          }`}
        >
          {notification.type === 'success' && (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          )}
          {notification.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          {notification.type === 'loading' && (
            <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
          )}
          {notification.type === 'info' && (
            <Info className="w-5 h-5 text-gray-600 flex-shrink-0" />
          )}

          <p
            className={`flex-1 text-sm font-medium ${
              notification.type === 'success'
                ? 'text-green-800'
                : notification.type === 'error'
                ? 'text-red-800'
                : notification.type === 'loading'
                ? 'text-blue-800'
                : 'text-gray-800'
            }`}
          >
            {notification.message}
          </p>

          <button
            onClick={() => onRemove(notification.id)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
