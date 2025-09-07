import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { setConnectionStatus, handleSSEEvent } from '../store/slices/notificationsSlice';
import { SSEEvent } from '../types';
import { config } from '../config';
import { useErrorHandler } from './useErrorHandler';
import apiService from '../services/apiService';

export const useSSE = () => {
  const dispatch = useDispatch<AppDispatch>();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { handleError } = useErrorHandler();

  const connectSSE = useCallback(() => {
    if (!config.ENABLE_SSE) {
      console.log('SSE is disabled in configuration');
      return;
    }

    try {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const eventSource = apiService.createSSEConnection();

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        dispatch(setConnectionStatus(true));
        
        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Send a test event to verify the connection
        dispatch(handleSSEEvent({
          type: 'Connected',
          timestamp: new Date().toISOString(),
          seller_id: 'demo-seller',
          message: 'SSE connection established'
        }));

        // Send initial heartbeat
        eventSource.dispatchEvent(new MessageEvent('message', {
          data: JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })
        }));
      };

      // Listen for all events
      const handleEvent = (event: MessageEvent) => {
        console.log('SSE event received:', {
          type: event.type,
          data: event.data,
          lastEventId: event.lastEventId,
          origin: event.origin
        });

        try {
          const data = JSON.parse(event.data);
          console.log('Parsed event data:', data);

          if (data.type === 'heartbeat' || data.type === 'ping') {
            dispatch(setConnectionStatus(true));
            return;
          }

          if (data.type === 'LowStockWarning') {
            console.log('Processing low stock warning:', data);
            if (!data.product) {
              console.error('Missing product data in low stock warning:', data);
              return;
            }

            // Ensure we have all required product fields
            const { id, name, price, quantity } = data.product;
            if (!id || !name || price === undefined || quantity === undefined) {
              console.error('Missing required product fields:', data.product);
              return;
            }

            dispatch(handleSSEEvent(data));
            
            // Log successful dispatch
            console.log('Low stock warning dispatched successfully');
          } else {
            // Handle other event types
            dispatch(handleSSEEvent(data));
          }
        } catch (error) {
          console.error('Error processing SSE event:', error, 'Raw data:', event.data);
          handleError(error, {
            showNotification: false,
            logError: true,
          });
        }
      };

      // Listen for specific events
      eventSource.addEventListener('ping', () => {
        console.log('Ping received from server');
        dispatch(setConnectionStatus(true));
      });

      eventSource.addEventListener('LowStockWarning', handleEvent);
      eventSource.addEventListener('message', handleEvent);

      // Log connection state changes
      eventSource.addEventListener('open', () => {
        console.log('SSE connection opened');
        dispatch(setConnectionStatus(true));
      });

      eventSource.addEventListener('error', (error) => {
        console.error('SSE connection error:', error);
        dispatch(setConnectionStatus(false));
      });

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        dispatch(setConnectionStatus(false));

        // Close the current connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        // Attempt to reconnect after configured interval with exponential backoff
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        const backoffTime = Math.min(1000 * Math.pow(2, apiService.getRetryCount()), 30000); // Max 30 seconds
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect after ${backoffTime}ms...`);
          connectSSE();
        }, backoffTime);
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      handleError(error, {
        showNotification: false,
        logError: true,
      });
      dispatch(setConnectionStatus(false));
    }
  }, [dispatch, handleError]);

  useEffect(() => {
    connectSSE();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        dispatch(setConnectionStatus(false));
      }
    };
  }, [connectSSE, dispatch]);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: connectSSE,
  };
};
