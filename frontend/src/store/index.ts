import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import { authApi } from './api/authApi';
import { userApi } from './api/userApi';
import { projectApi } from './api/projectApi';
import { taskApi } from './api/taskApi';
import { notificationApi } from './api/notificationApi';
import { reportingApi } from './api/reportingApi';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [reportingApi.reducerPath]: reportingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(userApi.middleware)
      .concat(projectApi.middleware)
      .concat(taskApi.middleware)
      .concat(notificationApi.middleware)
      .concat(reportingApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
