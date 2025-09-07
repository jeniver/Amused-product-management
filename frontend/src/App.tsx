import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useSSE } from './hooks/useSSE';
import ProductsDashboard from './components/ProductsDashboard';
import NotificationsPanel from './components/NotificationsPanel';
import NotificationBell from './components/NotificationBell';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';

const AppContent: React.FC = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Initialize SSE connection
  useSSE();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Products Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell onClick={() => setIsNotificationsOpen(true)} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <ProductsDashboard />
      </main>

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ToastProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ToastProvider>
    </Provider>
  );
};

export default App;
