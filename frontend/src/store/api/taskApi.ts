import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Task, Comment } from '../../types';

export const taskApi = createApi({
  reducerPath: 'taskApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/tasks',
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Task'],
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], { status?: string; assigneeId?: number; projectId?: number }>({
      query: ({ status, assigneeId, projectId }) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (assigneeId) params.append('assigneeId', assigneeId.toString());
        if (projectId) params.append('projectId', projectId.toString());
        return `/?${params.toString()}`;
      },
      providesTags: ['Task'],
      transformResponse: (response: Task[]) => {
        // Ensure dependencies and timeEntries are included
        return response.map(task => ({
          ...task,
          dependencies: task.dependencies || [],
          timeEntries: task.timeEntries || []
        }));
      },
    }),
    getTask: builder.query<Task, number>({
      query: (id) => `/${id}`,
      providesTags: ['Task'],
    }),
    createTask: builder.mutation<Task, Partial<Task>>({
      query: (body) => ({
        url: '/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation<Task, Partial<Task> & { id: number }>({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation<void, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
    // Comment endpoints
    getCommentsByTask: builder.query<Comment[], number>({
      query: (taskId) => `/comments/task/${taskId}`,
      providesTags: ['Task'],
    }),
    createComment: builder.mutation<Comment, { taskId: number; content: string }>({
      query: ({ taskId, content }) => ({
        url: `/comments/task/${taskId}`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['Task'],
    }),
    updateComment: builder.mutation<Comment, { id: number; content: string }>({
      query: ({ id, content }) => ({
        url: `/comments/${id}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: ['Task'],
    }),
    deleteComment: builder.mutation<void, number>({
      query: (id) => ({
        url: `/comments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetCommentsByTaskQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = taskApi;
