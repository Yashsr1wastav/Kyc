'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadBox } from '@/components/UploadBox';
import { ArrowLeft, Bot, MessageCircle, FileText, Database } from 'lucide-react';

export default function UploadPage() {
  const [uploadCount, setUploadCount] = useState(0);

  const handleUploadComplete = (result: any) => {
    setUploadCount(prev => prev + 1);
  };

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
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Upload Documents</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add files to your knowledge base</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/chat">
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Stats Section */}
          {uploadCount > 0 && (
            <div className="mb-8">
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                        Documents Successfully Uploaded
                      </h3>
                      <p className="text-green-700 dark:text-green-300">
                        {uploadCount} file{uploadCount !== 1 ? 's' : ''} processed and added to your knowledge base
                      </p>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        Ready for Chat
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Upload Component */}
          <UploadBox onUploadComplete={handleUploadComplete} />

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supported File Types</CardTitle>
                <CardDescription>
                  Upload any of these document formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    PDF
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Portable Document Format
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    DOCX
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Microsoft Word Document
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    DOC
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Legacy Word Document
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    TXT
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Plain Text File
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Pipeline</CardTitle>
                <CardDescription>
                  How your documents are processed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Text Extraction</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Extract readable content from your documents
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Smart Chunking</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Split content into searchable segments
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Watson Discovery</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Index in IBM Watson for intelligent search
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>
                After uploading your documents, you can start chatting with your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/chat" className="flex-1">
                  <Button className="w-full h-12">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start Asking Questions
                  </Button>
                </Link>
                <Link href="/admin" className="flex-1">
                  <Button variant="outline" className="w-full h-12">
                    <Database className="h-4 w-4 mr-2" />
                    Manage Documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="mt-8 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">💡 Tips for Better Results</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 dark:text-blue-200">
              <ul className="space-y-2 text-sm">
                <li>• Upload documents with clear, well-structured content</li>
                <li>• Ensure text is readable and not just scanned images</li>
                <li>• Keep file sizes under 10MB for optimal processing</li>
                <li>• Upload related documents together for better context</li>
                <li>• Use descriptive filenames to help identify sources later</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
