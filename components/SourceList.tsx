'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Source {
  filename: string;
  page?: number;
  content: string;
  relevanceScore?: number;
  documentId?: string;
}

interface SourceListProps {
  sources: Source[];
  title?: string;
  className?: string;
  maxHeight?: string;
}

export function SourceList({ 
  sources, 
  title = "Sources", 
  className = "",
  maxHeight = "400px" 
}: SourceListProps) {
  const copySource = async (source: Source) => {
    const text = `Source: ${source.filename}${source.page ? ` (Page ${source.page})` : ''}\n\n${source.content}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Source copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy source');
    }
  };

  const getRelevanceColor = (score?: number) => {
    if (!score) return 'gray';
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'yellow';
    return 'orange';
  };

  if (!sources || sources.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            No sources available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription>
          {sources.length} source{sources.length !== 1 ? 's' : ''} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="space-y-4 overflow-y-auto pr-2"
          style={{ maxHeight }}
        >
          {sources.map((source, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* Source Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {source.filename}
                    </h4>
                    {source.page && (
                      <Badge variant="outline" className="text-xs">
                        Page {source.page}
                      </Badge>
                    )}
                  </div>
                  
                  {source.relevanceScore && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Relevance:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs text-${getRelevanceColor(source.relevanceScore)}-600`}
                      >
                        {Math.round(source.relevanceScore * 100)}%
                      </Badge>
                    </div>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copySource(source)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {/* Source Content */}
              <div className="relative">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {source.content.length > 300 
                    ? `${source.content.substring(0, 300)}...`
                    : source.content
                  }
                </p>
                
                {source.content.length > 300 && (
                  <div className="absolute bottom-0 right-0 bg-gradient-to-l from-white dark:from-gray-950 to-transparent w-16 h-6 flex items-end justify-end">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs p-0 h-auto"
                      onClick={() => {
                        // You could implement a modal or expand functionality here
                        copySource(source);
                      }}
                    >
                      View all
                    </Button>
                  </div>
                )}
              </div>

              {/* Source Footer */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FileText className="h-3 w-3" />
                  <span>{source.content.length} characters</span>
                </div>
                
                {source.documentId && (
                  <Badge variant="outline" className="text-xs">
                    ID: {source.documentId.substring(0, 8)}...
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default SourceList;
