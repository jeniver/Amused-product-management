import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification, SSEEvent } from '../../types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
      }
    },
    
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount -= 1;
        }
        state.notifications.splice(index, 1);
      }
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    
    handleSSEEvent: (state, action: PayloadAction<SSEEvent>) => {
      const event = action.payload;
      const timestamp = new Date().toISOString();

      // Function to check for recent duplicate notifications
      const hasDuplicateNotification = (id: string, timeWindow: number = 5000) => {
        const recent = state.notifications[0];
        if (!recent) return false;
        
        // Check if we have a similar notification in the last 5 seconds
        return (
          recent.id.includes(id) &&
          new Date(recent.timestamp).getTime() > Date.now() - timeWindow
        );
      };
      
      switch (event.type) {
        case 'Connected':
          state.isConnected = true;
          break;
          
        case 'LowStockWarning': {
          console.log('Processing low stock warning:', event);
          const { product } = event;
          
          // Validate product data
          if (!product || typeof product !== 'object') {
            console.error('Invalid product data in low stock warning:', event);
            return;
          }

          // Create notification with validated data
          const notification: Notification = {
            id: `low-stock-${product.id}-${timestamp}`,
            type: 'warning' as const,
            title: 'Low Stock Alert',
            message: `${product.name} is running low (${product.quantity} remaining)`,
            timestamp: event.timestamp || timestamp,
            read: false,
            product_id: product.id,
            data: {
              productId: product.id,
              product_name: product.name,
              current_quantity: product.quantity,
              threshold: 5, // You can adjust this or include it in the event data
              category: product.category || 'N/A',
              price: typeof product.price === 'number' ? 
                Number(product.price.toFixed(2)) : 0
            }
          };

          // Check for duplicate notifications
          if (!hasDuplicateNotification(`low-stock-${product.id}`)) {
            console.log('Created notification:', notification);
            state.notifications.unshift(notification);
            state.unreadCount += 1;
          } else {
            console.log('Skipping duplicate low stock notification:', product.id);
          }
          break;
        }
          
        case 'ProductCreated':
          if (!hasDuplicateNotification(`created-${event.product_id}`)) {
            state.notifications.unshift({
              id: `created-${event.product_id}-${timestamp}`,
              type: 'info',
              title: 'Product Created',
              message: `New product "${event.payload.name}" has been added`,
              timestamp,
              read: false,
              product_id: event.product_id,
            });
            state.unreadCount += 1;
          }
          break;
          
        case 'ProductUpdated':
          if (!hasDuplicateNotification(`updated-${event.product_id}`)) {
            state.notifications.unshift({
              id: `updated-${event.product_id}-${timestamp}`,
              type: 'info',
              title: 'Product Updated',
              message: `Product "${event.payload.name}" has been updated`,
              timestamp,
              read: false,
              product_id: event.product_id,
            });
            state.unreadCount += 1;
          }
          break;
          
        case 'ProductDeleted':
          if (!hasDuplicateNotification(`deleted-${event.product_id}`)) {
            state.notifications.unshift({
              id: `deleted-${event.product_id}-${timestamp}`,
              type: 'info',
              title: 'Product Deleted',
              message: `Product has been removed from inventory`,
              timestamp,
              read: false,
              product_id: event.product_id,
            });
            state.unreadCount += 1;
          }
          break;
      }
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  setConnectionStatus,
  handleSSEEvent,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
