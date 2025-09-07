import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { addNotification } from '../store/slices/notificationsSlice';

interface ErrorHandlerOptions {
  showNotification?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = () => {
  const dispatch = useDispatch<AppDispatch>();

  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showNotification = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    // Log error for debugging
    if (logError) {
      console.error('Error handled:', error);
    }

    // Extract error message
    let errorMessage = fallbackMessage;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    }

    // Show notification if enabled
    if (showNotification) {
      dispatch(addNotification({
        id: `error-${Date.now()}`,
        type: 'error',
        title: 'Error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        read: false,
      }));
    }

    return errorMessage;
  }, [dispatch]);

  return { handleError };
};
