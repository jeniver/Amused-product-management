import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import Button from './common/Button';

interface NotificationBellProps {
  onClick: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const { unreadCount, isConnected } = useNotifications();

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="medium"
        onClick={onClick}
        className="relative"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
      
      {/* Connection Status Indicator */}
      <div className="absolute -bottom-1 -right-1">
        <div className={`w-3 h-3 rounded-full border-2 border-white ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`} />
      </div>
    </div>
  );
};

export default NotificationBell;
