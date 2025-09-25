import React, { useState } from 'react';
import { useGetCommentsByTaskQuery, useCreateCommentMutation, useUpdateCommentMutation, useDeleteCommentMutation } from '../store/api/taskApi';
import { useTheme } from '../contexts/ThemeContext';
import { Comment } from '../types';

interface TaskCommentsProps {
  taskId: number;
  currentUserId: number;
  currentUserRole: string;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, currentUserId, currentUserRole }) => {
  const { isDark } = useTheme();
  const { data: comments, isLoading } = useGetCommentsByTaskQuery(taskId);
  const [createComment] = useCreateCommentMutation();
  const [updateComment] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      await createComment({ taskId, content: newComment.trim() });
      setNewComment('');
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingComment && editContent.trim()) {
      await updateComment({ id: editingComment, content: editContent.trim() });
      setEditingComment(null);
      setEditContent('');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(commentId);
    }
  };

  const canEditComment = (comment: Comment) => {
    return comment.userId === currentUserId || currentUserRole === 'admin';
  };

  const canDeleteComment = (comment: Comment) => {
    return comment.userId === currentUserId || currentUserRole === 'admin';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`mt-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <h3 className="text-lg font-semibold mb-4">Comments</h3>

      {/* Add new comment form */}
      <form onSubmit={handleCreateComment} className="mb-6">
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className={`flex-1 p-3 border rounded-lg resize-none ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            rows={3}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </div>
      </form>

      {/* Comments list */}
      {isLoading ? (
        <div className="text-center py-4">Loading comments...</div>
      ) : (
        <div className="space-y-4">
          {comments?.map((comment) => (
            <div
              key={comment.id}
              className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}
            >
              {editingComment === comment.id ? (
                <form onSubmit={handleUpdateComment} className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={`w-full p-3 border rounded-lg resize-none ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingComment(null)}
                      className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {comment.author?.name || 'Unknown User'}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(comment.createdAt || '')}
                      </span>
                    </div>
                    {(canEditComment(comment) || canDeleteComment(comment)) && (
                      <div className="flex gap-1">
                        {canEditComment(comment) && (
                          <button
                            onClick={() => handleEditComment(comment)}
                            className="text-blue-500 hover:text-blue-600 text-sm"
                          >
                            Edit
                          </button>
                        )}
                        {canDeleteComment(comment) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {comment.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {comments?.length === 0 && !isLoading && (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>No comments yet. Be the first to add one!</p>
        </div>
      )}
    </div>
  );
};

export default TaskComments;
