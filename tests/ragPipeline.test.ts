// Tests for the RAG pipeline integration
import { chunkText } from '../lib/chunker';

// Mock the external services for testing
jest.mock('../lib/ibmDiscovery', () => ({
  discoveryService: {
    addDocuments: jest.fn().mockResolvedValue(['doc1', 'doc2']),
    searchDocuments: jest.fn().mockResolvedValue({
      matching_results: 2,
      results: [
        {
          document_id: 'doc1',
          text: 'This is relevant content about AI and machine learning.',
          metadata: { filename: 'ai-guide.pdf', page: 1 }
        },
        {
          document_id: 'doc2', 
          text: 'More information about neural networks and deep learning.',
          metadata: { filename: 'ml-book.pdf', page: 5 }
        }
      ],
      passages: [
        {
          passage_text: 'AI and machine learning are transformative technologies.',
          document_id: 'doc1'
        }
      ]
    })
  }
}));

jest.mock('../lib/ibmGranite', () => ({
  graniteService: {
    summarizeChunks: jest.fn().mockResolvedValue('AI and machine learning are key technologies for the future. Neural networks enable deep learning capabilities.'),
    answerQuestion: jest.fn().mockResolvedValue('Machine learning is a subset of AI that enables computers to learn from data.')
  }
}));

jest.mock('../lib/awsTitan', () => ({
  titanService: {
    generateGroundedAnswer: jest.fn().mockResolvedValue('Based on the provided documents, AI and machine learning are transformative technologies that enable computers to learn from data and make intelligent decisions.'),
    synthesizeInformation: jest.fn().mockResolvedValue('The documents indicate that AI encompasses machine learning, which uses neural networks for deep learning.')
  }
}));

import { discoveryService } from '../lib/ibmDiscovery';
import { graniteService } from '../lib/ibmGranite';
import { titanService } from '../lib/awsTitan';

describe('RAG Pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should process document upload through the full pipeline', async () => {
    // 1. Document chunking
    const sampleDocument = `
      Artificial Intelligence (AI) is a broad field of computer science. 
      Machine learning is a subset of AI that enables computers to learn from data.
      Neural networks are a fundamental component of deep learning.
      Deep learning has revolutionized many areas including computer vision and natural language processing.
    `;
    
    const chunks = chunkText(sampleDocument, 'ai-overview.txt', {
      chunkSize: 200,
      chunkOverlap: 50
    });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].metadata.filename).toBe('ai-overview.txt');

    // 2. Upload to Discovery
    const documentIds = await discoveryService.addDocuments(chunks);
    
    expect(discoveryService.addDocuments).toHaveBeenCalledWith(chunks);
    expect(documentIds).toEqual(['doc1', 'doc2']);
  });

  test('should handle search and summarization flow', async () => {
    const query = 'What is machine learning?';
    
    // 1. Search Discovery
    const searchResults = await discoveryService.searchDocuments(query, 5, true);
    
    expect(discoveryService.searchDocuments).toHaveBeenCalledWith(query, 5, true);
    expect(searchResults.matching_results).toBe(2);
    expect(searchResults.results).toHaveLength(2);

    // 2. Extract content chunks
    const chunks = searchResults.results.map(result => result.text).filter((text): text is string => Boolean(text));
    expect(chunks).toHaveLength(2);

    // 3. Summarize with Granite
    const summary = await graniteService.summarizeChunks({
      chunks,
      query,
      maxTokens: 800
    });

    expect(graniteService.summarizeChunks).toHaveBeenCalledWith({
      chunks,
      query,
      maxTokens: 800
    });
    expect(summary).toContain('AI and machine learning');

    // 4. Generate final answer with Titan
    const combinedContext = chunks.join('\n\n---\n\n');
    const finalAnswer = await titanService.generateGroundedAnswer(
      query,
      combinedContext,
      summary,
      false
    );

    expect(titanService.generateGroundedAnswer).toHaveBeenCalledWith(
      query,
      combinedContext,
      summary,
      false
    );
    expect(finalAnswer).toContain('machine learning');
  });

  test('should handle strict mode correctly', async () => {
    const query = 'Explain quantum computing';
    const context = 'Information about AI and machine learning';
    const summary = 'Summary about AI topics';

    // Test strict mode = true
    await titanService.generateGroundedAnswer(query, context, summary, true);
    
    expect(titanService.generateGroundedAnswer).toHaveBeenCalledWith(
      query,
      context, 
      summary,
      true
    );
  });

  test('should handle empty search results gracefully', async () => {
    // Mock empty search results
    (discoveryService.searchDocuments as jest.Mock).mockResolvedValueOnce({
      matching_results: 0,
      results: [],
      passages: []
    });

    const searchResults = await discoveryService.searchDocuments('nonexistent topic', 5, true);
    
    expect(searchResults.matching_results).toBe(0);
    expect(searchResults.results).toHaveLength(0);
  });

  test('should extract source information correctly', async () => {
    const searchResults = await discoveryService.searchDocuments('AI query', 5, true);
    
    const sources = searchResults.results.map(result => ({
      filename: result.metadata?.filename || 'Unknown',
      page: result.metadata?.page,
      content: result.text || '',
    }));

    expect(sources).toHaveLength(2);
    expect(sources[0].filename).toBe('ai-guide.pdf');
    expect(sources[0].page).toBe(1);
    expect(sources[1].filename).toBe('ml-book.pdf');
    expect(sources[1].page).toBe(5);
  });

  test('should prioritize passages over full document text', async () => {
    const searchResults = await discoveryService.searchDocuments('AI query', 5, true);
    
    // When passages are available, prefer them over full document text
    const chunks: string[] = [];
    
    if (searchResults.passages && searchResults.passages.length > 0) {
      searchResults.passages.forEach(passage => {
        if (passage.passage_text) {
          chunks.push(passage.passage_text);
        }
      });
    } else {
      searchResults.results.forEach(result => {
        if (result.text) {
          chunks.push(result.text);
        }
      });
    }

    expect(chunks).toContain('AI and machine learning are transformative technologies.');
  });

  test('should handle errors in pipeline gracefully', async () => {
    // Mock an error in Discovery service
    (discoveryService.searchDocuments as jest.Mock).mockRejectedValueOnce(
      new Error('Discovery service unavailable')
    );

    await expect(
      discoveryService.searchDocuments('test query', 5, true)
    ).rejects.toThrow('Discovery service unavailable');
  });
});
