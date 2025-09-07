import { configureStore } from '@reduxjs/toolkit';
import { productsApi } from './api';
import notificationsReducer from './slices/notificationsSlice';
import modalReducer from './slices/modalSlice';

export const store = configureStore({
  reducer: {
    [productsApi.reducerPath]: productsApi.reducer,
    notifications: notificationsReducer,
    modal: modalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(productsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
