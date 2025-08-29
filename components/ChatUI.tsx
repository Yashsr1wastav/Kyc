'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Copy, 
  User, 
  Bot, 
  Loader2, 
  Settings, 
  FileText,
  ToggleLeft,
  ToggleRight 
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: Array<{
    filename: string;
    page?: number;
    content: string;
  }>;
  processingSteps?: {
    discoveryResults: number;
    chunksProcessed: number;
    summaryGenerated: boolean;
    finalAnswerGenerated: boolean;
  };
}

interface ChatUIProps {
  className?: string;
}

export function ChatUI({ className }: ChatUIProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your GenAI Helpdesk assistant. I can help you find information from your uploaded documents. What would you like to know?',
      timestamp: Date.now(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [strictMode, setStrictMode] = useState(true);
  const [showSources, setShowSources] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          strictMode,
          maxSources: 5,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: Date.now(),
          sources: data.sources,
          processingSteps: data.processingSteps,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your GenAI Helpdesk assistant. I can help you find information from your uploaded documents. What would you like to know?',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Chat History Sidebar */}
      <div className="w-80 border-r bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Chat History</h3>
          <Button variant="ghost" size="sm" onClick={clearChat}>
            Clear
          </Button>
        </div>
        
        {/* Settings */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Strict Mode</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStrictMode(!strictMode)}
              className="h-6 w-12 p-0"
            >
              {strictMode ? (
                <ToggleRight className="h-4 w-4 text-blue-500" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            {strictMode 
              ? 'Only use information from uploaded documents'
              : 'Can use general knowledge to supplement answers'
            }
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Show Sources</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSources(!showSources)}
              className="h-6 w-12 p-0"
            >
              {showSources ? (
                <ToggleRight className="h-4 w-4 text-blue-500" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="space-y-2">
          {messages
            .filter(m => m.role === 'user')
            .slice(-10)
            .map((message, index) => (
              <div
                key={message.id}
                className="p-2 rounded text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer truncate"
                onClick={() => {
                  setInputMessage(message.content);
                  inputRef.current?.focus();
                }}
              >
                {message.content}
              </div>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-3xl ${message.role === 'user' ? 'order-1' : ''}`}>
                <Card className={message.role === 'user' ? 'bg-blue-50 dark:bg-blue-950/20' : ''}>
                  <CardContent className="p-4">
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        
                        {message.processingSteps && (
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">
                              {message.processingSteps.discoveryResults} results
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {message.processingSteps.chunksProcessed} chunks
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && showSources && (
                  <Card className="mt-3">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Sources ({message.sources.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {message.sources.map((source, index) => (
                          <div key={index} className="border-l-2 border-blue-500 pl-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{source.filename}</span>
                              {source.page && (
                                <Badge variant="secondary" className="text-xs">
                                  Page {source.page}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                              {source.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-3">
            <Textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your uploaded documents..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
