'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, File, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FileUpload {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: {
    chunksCreated: number;
    documentsUploaded: number;
  };
}

interface UploadBoxProps {
  onUploadComplete?: (result: any) => void;
}

export function UploadBox({ onUploadComplete }: UploadBoxProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    const newUploads: FileUpload[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Start uploading files
    newUploads.forEach(upload => {
      uploadFile(upload);
    });
  }, []);

  const uploadFile = async (upload: FileUpload) => {
    try {
      setUploads(prev => 
        prev.map(u => 
          u.id === upload.id 
            ? { ...u, status: 'uploading', progress: 0 }
            : u
        )
      );

      const formData = new FormData();
      formData.append('file', upload.file);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploads(prev => 
            prev.map(u => 
              u.id === upload.id 
                ? { ...u, progress }
                : u
            )
          );
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setUploads(prev => 
            prev.map(u => 
              u.id === upload.id 
                ? { 
                    ...u, 
                    status: 'success', 
                    progress: 100,
                    result: response.details 
                  }
                : u
            )
          );
          toast.success(`${upload.file.name} uploaded successfully`);
          onUploadComplete?.(response);
        } else {
          const errorResponse = JSON.parse(xhr.responseText);
          setUploads(prev => 
            prev.map(u => 
              u.id === upload.id 
                ? { 
                    ...u, 
                    status: 'error', 
                    error: errorResponse.error || 'Upload failed' 
                  }
                : u
            )
          );
          toast.error(`Failed to upload ${upload.file.name}`);
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        setUploads(prev => 
          prev.map(u => 
            u.id === upload.id 
              ? { ...u, status: 'error', error: 'Network error' }
              : u
          )
        );
        toast.error(`Network error uploading ${upload.file.name}`);
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);

    } catch (error) {
      setUploads(prev => 
        prev.map(u => 
          u.id === upload.id 
            ? { ...u, status: 'error', error: String(error) }
            : u
        )
      );
      toast.error(`Error uploading ${upload.file.name}`);
    }
  };

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const getStatusIcon = (status: FileUpload['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: FileUpload['status']) => {
    switch (status) {
      case 'uploading':
        return 'blue';
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Upload PDF, Word documents, or text files to add them to the knowledge base.
            Maximum file size: 10MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supported: PDF, DOCX, DOC, TXT
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Select Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload List */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
            <CardDescription>
              Track the status of your file uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploads.map((upload) => (
                <div key={upload.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(upload.status)}
                      <div>
                        <p className="font-medium text-sm">{upload.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-${getStatusColor(upload.status)}-600`}>
                        {upload.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUpload(upload.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>

                  {upload.status === 'uploading' && (
                    <Progress value={upload.progress} className="mb-2" />
                  )}

                  {upload.status === 'success' && upload.result && (
                    <div className="text-xs text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded">
                      ✓ Created {upload.result.chunksCreated} chunks, uploaded {upload.result.documentsUploaded} documents
                    </div>
                  )}

                  {upload.status === 'error' && upload.error && (
                    <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                      ✗ {upload.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
