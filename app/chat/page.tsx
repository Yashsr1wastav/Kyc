'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChatUI } from '@/components/ChatUI';
import { ArrowLeft, Bot, Upload, Database } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">AI Chat Assistant</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Ask questions about your documents</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/upload">
                <Button variant="outline" size="sm">
                  <Upload className="h-3 w-3 mr-1" />
                  Upload
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Database className="h-3 w-3 mr-1" />
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatUI className="h-full" />
      </div>
    </div>
  );
}
