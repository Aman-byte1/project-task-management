import React, { useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Attachment } from '../types';

interface FileAttachmentsProps {
  taskId?: number;
  projectId?: number;
  attachments: Attachment[];
  currentUserId: number;
  currentUserRole: string;
  onUpload?: (formData: FormData) => Promise<void>;
  onDelete?: (attachmentId: number) => Promise<void>;
}

const FileAttachments: React.FC<FileAttachmentsProps> = ({
  taskId,
  projectId,
  attachments,
  currentUserId,
  currentUserRole,
  onUpload,
  onDelete
}) => {
  const { isDark } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        if (taskId) {
          formData.append('taskId', taskId.toString());
        } else if (projectId) {
          formData.append('projectId', projectId.toString());
        }

        // Upload directly to the API
        const response = await fetch('http://localhost:5000/api/attachments/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        console.log('File uploaded successfully:', result);

        // Trigger a page refresh or update to show the new attachment
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      // Use the API endpoint which will handle proper download headers
      const response = await fetch(`http://localhost:5000/api/attachments/${attachment.id}/download`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Get the filename from the response headers if available
      const contentDisposition = response.headers.get('content-disposition');
      let filename = attachment.originalName;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/attachments/${attachmentId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Delete failed');
        }

        console.log('File deleted successfully');
        // Trigger a page refresh to update the attachments list
        window.location.reload();
      } catch (error) {
        console.error('Error deleting file:', error);
        alert(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const canDeleteAttachment = (attachment: Attachment) => {
    return attachment.uploadedBy === currentUserId || currentUserRole === 'admin';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType.includes('pdf')) {
      return '📄';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return '📝';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return '📊';
    } else if (mimeType.includes('text')) {
      return '📄';
    } else {
      return '📎';
    }
  };

  return (
    <div className={`mt-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <h3 className="text-lg font-semibold mb-4">Attachments</h3>

      {/* Upload Section */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Files
            </>
          )}
        </label>
        <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Supported: Images, PDF, Word, Excel, Text files (max 10MB each)
        </p>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 ? (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(attachment.mimeType)}</span>
                  <div>
                    <p className="font-medium">{attachment.originalName}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatFileSize(attachment.size)} • Uploaded by {attachment.uploader?.name || 'Unknown'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(attachment.createdAt || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                  >
                    Download
                  </button>
                  {canDeleteAttachment(attachment) && (
                    <button
                      onClick={() => handleDelete(attachment.id)}
                      className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <p className="text-lg">No attachments yet</p>
          <p className="text-sm mt-2">Upload files to share documents, images, and more</p>
        </div>
      )}
    </div>
  );
};

export default FileAttachments;
