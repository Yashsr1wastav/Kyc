'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Bot, 
  Database, 
  RefreshCw, 
  Trash2, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Upload,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface CollectionStatus {
  name: string;
  description: string;
  document_count: number;
  status: string;
  created: string;
  updated: string;
}

interface Document {
  id: string;
  filename: string;
  status: string;
  created: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [collectionStatus, setCollectionStatus] = useState<CollectionStatus | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin?action=status');
      if (response.ok) {
        const data = await response.json();
        setCollectionStatus(data.collection);
        setDocuments(data.documents || []);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const handleClearCollection = async () => {
    if (!confirm('Are you sure you want to clear all documents? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading('clear');
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear' }),
      });

      if (response.ok) {
        toast.success('Collection cleared successfully');
        await fetchData();
      } else {
        throw new Error('Failed to clear collection');
      }
    } catch (error) {
      console.error('Error clearing collection:', error);
      toast.error('Failed to clear collection');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRebuildCollection = async () => {
    if (!confirm('Are you sure you want to rebuild the collection? This will clear all documents.')) {
      return;
    }

    try {
      setActionLoading('rebuild');
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'rebuild' }),
      });

      if (response.ok) {
        toast.success('Collection rebuilt successfully');
        await fetchData();
      } else {
        throw new Error('Failed to rebuild collection');
      }
    } catch (error) {
      console.error('Error rebuilding collection:', error);
      toast.error('Failed to rebuild collection');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setActionLoading(`delete-${documentId}`);
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete_document', documentId }),
      });

      if (response.ok) {
        toast.success('Document deleted successfully');
        await fetchData();
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-white" />
            </div>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Please sign in to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => window.location.href = '/api/auth/signin'}
              >
                Sign In
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Admin Panel</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage your knowledge base</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/upload">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Collection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Collection Status
              </CardTitle>
              <CardDescription>
                Overview of your IBM Watson Discovery collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading collection status...</span>
                </div>
              ) : collectionStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {collectionStatus.document_count}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Documents</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {collectionStatus.status === 'available' ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-yellow-500" />
                      )}
                      <span className="text-lg font-semibold capitalize">
                        {collectionStatus.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {collectionStatus.name || 'GenAI Collection'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Collection Name</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  Failed to load collection status
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Management</CardTitle>
              <CardDescription>
                Manage your document collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => fetchData()}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Status
                </Button>
                
                <Button
                  onClick={handleRebuildCollection}
                  disabled={actionLoading === 'rebuild'}
                  variant="outline"
                  className="flex-1"
                >
                  {actionLoading === 'rebuild' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  Rebuild Collection
                </Button>
                
                <Button
                  onClick={handleClearCollection}
                  disabled={actionLoading === 'clear'}
                  variant="destructive"
                  className="flex-1"
                >
                  {actionLoading === 'clear' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Clear All Documents
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents ({documents.length})
              </CardTitle>
              <CardDescription>
                Manage individual documents in your collection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No documents found</p>
                  <p className="text-sm text-gray-400 mb-4">Upload some documents to get started</p>
                  <Link href="/upload">
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Documents
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.filename}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Badge variant="outline" className="text-xs">
                              {doc.status}
                            </Badge>
                            <span>•</span>
                            <span>{doc.created}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={actionLoading === `delete-${doc.id}`}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {actionLoading === `delete-${doc.id}` ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
