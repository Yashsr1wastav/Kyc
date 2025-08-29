// Chat API route for RAG pipeline
import { NextRequest, NextResponse } from 'next/server';
import { discoveryService } from '@/lib/ibmDiscovery';
import { graniteService } from '@/lib/ibmGranite';
import { titanService } from '@/lib/awsTitan';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: Array<{
    filename: string;
    page?: number;
    content: string;
  }>;
}

export interface ChatRequest {
  message: string;
  strictMode?: boolean;
  maxSources?: number;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  sources?: Array<{
    filename: string;
    page?: number;
    content: string;
    relevanceScore?: number;
  }>;
  processingSteps?: {
    discoveryResults: number;
    chunksProcessed: number;
    summaryGenerated: boolean;
    finalAnswerGenerated: boolean;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, strictMode = false, maxSources = 5 } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Step 1: Search IBM Discovery for relevant documents
    console.log('Searching Discovery for:', message);
    const searchResults = await discoveryService.searchDocuments(
      message,
      maxSources * 2, // Get more results to filter later
      true // Enable passages
    );

    if (searchResults.matching_results === 0) {
      return NextResponse.json({
        success: true,
        response: strictMode 
          ? "I cannot answer this question based on the provided documents."
          : "I couldn't find relevant information in the uploaded documents. Please try rephrasing your question or upload more relevant documents.",
        sources: [],
        processingSteps: {
          discoveryResults: 0,
          chunksProcessed: 0,
          summaryGenerated: false,
          finalAnswerGenerated: true,
        },
      });
    }

    // Step 2: Extract and prepare content chunks
    const chunks: string[] = [];
    const sources: Array<{
      filename: string;
      page?: number;
      content: string;
      relevanceScore?: number;
    }> = [];

    // Use passages if available, otherwise use document content
    if (searchResults.passages && searchResults.passages.length > 0) {
      for (const passage of searchResults.passages.slice(0, maxSources)) {
        if (passage.passage_text) {
          chunks.push(passage.passage_text);
          
          // Find corresponding document for metadata
          const doc = searchResults.results.find(
            d => d.document_id === passage.document_id
          );
          
          sources.push({
            filename: doc?.metadata?.filename || 'Unknown',
            page: doc?.metadata?.page,
            content: passage.passage_text,
            relevanceScore: 0.8, // Passages are generally high relevance
          });
        }
      }
    } else {
      // Use full document content
      for (const doc of searchResults.results.slice(0, maxSources)) {
        if (doc.text) {
          chunks.push(doc.text);
          sources.push({
            filename: doc.metadata?.filename || doc.filename || 'Unknown',
            page: doc.metadata?.page,
            content: doc.text,
            relevanceScore: 0.6,
          });
        }
      }
    }

    if (chunks.length === 0) {
      return NextResponse.json({
        success: true,
        response: "Found relevant documents but couldn't extract readable content.",
        sources: [],
        processingSteps: {
          discoveryResults: searchResults.matching_results,
          chunksProcessed: 0,
          summaryGenerated: false,
          finalAnswerGenerated: true,
        },
      });
    }

    // Step 3: Summarize chunks using IBM Granite
    console.log('Summarizing chunks with Granite...');
    const summary = await graniteService.summarizeChunks({
      chunks,
      query: message,
      maxTokens: 800,
    });

    // Step 4: Generate final grounded answer using AWS Titan
    console.log('Generating final answer with Titan...');
    const combinedContext = chunks.join('\n\n---\n\n');
    const finalAnswer = await titanService.generateGroundedAnswer(
      message,
      combinedContext,
      summary,
      strictMode
    );

    const response: ChatResponse = {
      success: true,
      response: finalAnswer,
      sources: sources,
      processingSteps: {
        discoveryResults: searchResults.matching_results,
        chunksProcessed: chunks.length,
        summaryGenerated: summary.length > 0,
        finalAnswerGenerated: finalAnswer.length > 0,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process your question. Please try again.',
        details: String(error),
      },
      { status: 500 }
    );
  }
}

// Streaming endpoint for real-time responses
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const message = searchParams.get('message');
  const strictMode = searchParams.get('strictMode') === 'true';

  if (!message) {
    return new Response('Message parameter is required', { status: 400 });
  }

  // Set up streaming response
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial status
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Searching documents...' })}\n\n`)
        );

        // Search Discovery
        const searchResults = await discoveryService.searchDocuments(message, 10, true);
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'discovery', 
            resultsCount: searchResults.matching_results 
          })}\n\n`)
        );

        if (searchResults.matching_results === 0) {
          const noResultsMessage = strictMode 
            ? "I cannot answer this question based on the provided documents."
            : "I couldn't find relevant information in the uploaded documents.";
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'answer', content: noResultsMessage })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        // Extract chunks
        const chunks: string[] = [];
        const sources: any[] = [];

        if (searchResults.passages && searchResults.passages.length > 0) {
          for (const passage of searchResults.passages.slice(0, 5)) {
            if (passage.passage_text) {
              chunks.push(passage.passage_text);
              const doc = searchResults.results.find(d => d.document_id === passage.document_id);
              sources.push({
                filename: doc?.metadata?.filename || 'Unknown',
                page: doc?.metadata?.page,
                content: passage.passage_text,
              });
            }
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
        );

        // Summarize with Granite
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Summarizing content...' })}\n\n`)
        );

        const summary = await graniteService.summarizeChunks({ chunks, query: message });

        // Generate streaming answer with Titan
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Generating answer...' })}\n\n`)
        );

        const combinedContext = chunks.join('\n\n---\n\n');
        const answerStream = titanService.generateTextStream({
          prompt: `Based on the following context, answer the question: "${message}"\n\nContext: ${combinedContext}\n\nAnswer:`,
          temperature: 0.3,
          maxTokenCount: 1500,
        });

        for await (const chunk of answerStream) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'answer_chunk', content: chunk })}\n\n`)
          );
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();

      } catch (error) {
        console.error('Streaming error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: String(error) })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
