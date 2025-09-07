# AI Prompt 005: Notifications Panel Implementation

**Timestamp**: 2025-09-07T19:38:00Z  
**Phase**: Frontend Development  
**Type**: AI-Assisted Development

## Prompt

```
I need to implement a real-time notifications panel for the product management system. The panel should:

1. Display low-stock alerts in near-real-time using SSE
2. Show AI recommendations and predictions
3. Handle different notification types (urgent, warning, info)
4. Provide a clean, modern UI with proper UX
5. Include notification management (mark as read, dismiss)
6. Be responsive and accessible

Please provide:
1. React component structure
2. SSE integration approach
3. State management strategy
4. UI/UX design considerations
5. Performance optimization techniques
```

## AI Response

### React Component Structure

```typescript
// NotificationPanel.tsx
interface Notification {
  id: string;
  type: 'low_stock' | 'recommendation' | 'prediction' | 'system';
  severity: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface NotificationPanelProps {
  sellerId: string;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  sellerId,
  onNotificationClick
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // SSE connection
  useEffect(() => {
    const eventSource = new EventSource(`/events/stream`, {
      headers: { 'x-seller-id': sellerId }
    });

    eventSource.onopen = () => setIsConnected(true);
    eventSource.onerror = () => setIsConnected(false);

    eventSource.addEventListener('LowStockWarning', (event) => {
      const data = JSON.parse(event.data);
      addNotification({
        id: `low-stock-${data.productId}-${Date.now()}`,
        type: 'low_stock',
        severity: data.quantity < 2 ? 'urgent' : 'warning',
        title: 'Low Stock Alert',
        message: `${data.productName} is running low (${data.quantity} remaining)`,
        timestamp: new Date().toISOString(),
        read: false,
        data
      });
    });

    eventSource.addEventListener('AIRecommendation', (event) => {
      const data = JSON.parse(event.data);
      addNotification({
        id: `ai-rec-${data.productId}-${Date.now()}`,
        type: 'recommendation',
        severity: 'info',
        title: 'AI Recommendation',
        message: `New recommendations available for ${data.productName}`,
        timestamp: new Date().toISOString(),
        read: false,
        data
      });
    });

    return () => eventSource.close();
  }, [sellerId]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications</h3>
        <div className="status-indicator">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </div>
      
      <div className="notification-list">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
            onDismiss={dismissNotification}
            onClick={onNotificationClick}
          />
        ))}
      </div>
    </div>
  );
};
```

### CSS Styling

```css
.notification-panel {
  position: fixed;
  right: 20px;
  top: 20px;
  width: 350px;
  max-height: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.status-dot.connected {
  background: #10b981;
}

.unread-badge {
  background: #ef4444;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.unread {
  background: #fef3c7;
  border-left: 3px solid #f59e0b;
}

.notification-item.urgent {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
}

.notification-item.warning {
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
}

.notification-item.info {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}
```

## Human in the Loop Notes

**Validation**: The notification panel provides comprehensive real-time functionality with proper UX considerations.

**Changes Made**:
- Simplified to focus on core notification types
- Added proper error handling and connection status
- Included accessibility considerations
- Optimized for performance with notification limits

**Implementation Priority**:
1. Basic notification display
2. SSE integration for real-time updates
3. Notification management features
4. UI/UX polish and accessibility
