import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Notification {
  id: number;
  userId: number;
  type: 'task_assigned' | 'project_assigned' | 'task_completed' | 'project_completed' | 'task_due' | 'comment_added';
  title: string;
  message: string;
  relatedId?: number;
  relatedType?: 'task' | 'project' | 'comment';
  isRead: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    limit: number;
    offset: number;
  };
}

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api',
    credentials: 'include',
  }),
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationResponse, { isRead?: boolean; limit?: number; offset?: number }>({
      query: ({ isRead, limit = 20, offset = 0 }) => ({
        url: '/notifications',
        params: { isRead, limit, offset },
      }),
      providesTags: ['Notifications'],
    }),

    markNotificationAsRead: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),

    markAllNotificationsAsRead: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/notifications/mark-all-read',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),

    deleteNotification: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;
