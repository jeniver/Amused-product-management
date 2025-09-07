import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { 
  markAsRead, 
  markAllAsRead, 
  removeNotification, 
  clearAllNotifications 
} from '../store/slices/notificationsSlice';

export const useNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, unreadCount, isConnected } = useSelector(
    (state: RootState) => state.notifications
  );

  const handleMarkAsRead = useCallback((notificationId: string) => {
    dispatch(markAsRead(notificationId));
  }, [dispatch]);

  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  const handleRemoveNotification = useCallback((notificationId: string) => {
    dispatch(removeNotification(notificationId));
  }, [dispatch]);

  const handleClearAllNotifications = useCallback(() => {
    dispatch(clearAllNotifications());
  }, [dispatch]);

  const getNotificationsByType = useCallback((type: string) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.read);
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleRemoveNotification,
    handleClearAllNotifications,
    getNotificationsByType,
    getUnreadNotifications,
  };
};
