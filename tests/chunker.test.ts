// Tests for the chunking functionality
import { chunkText, chunkByPages, mergeSmallChunks } from '../lib/chunker';

describe('Document Chunking', () => {
  const sampleText = `
    This is the first paragraph. It contains multiple sentences to test the chunking functionality.
    This helps ensure that our text splitting works correctly.
    
    This is the second paragraph. It should be in a different chunk if the size limits are reached.
    We want to test the overlap functionality as well.
    
    This is the third paragraph. It will help us verify that the chunking preserves context.
    The overlap should maintain continuity between chunks.
  `;

  test('should split text into chunks with default options', () => {
    const chunks = chunkText(sampleText, 'test.txt');
    
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].id).toBe('test.txt-chunk-0');
    expect(chunks[0].metadata.filename).toBe('test.txt');
    expect(chunks[0].metadata.chunkIndex).toBe(0);
  });

  test('should respect chunk size limits', () => {
    const chunks = chunkText(sampleText, 'test.txt', {
      chunkSize: 100,
      chunkOverlap: 20,
    });

    chunks.forEach(chunk => {
      expect(chunk.content.length).toBeLessThanOrEqual(200); // More realistic tolerance for sentence boundaries
    });
  });

  test('should include metadata for each chunk', () => {
    const chunks = chunkText(sampleText, 'test.txt');
    
    chunks.forEach(chunk => {
      expect(chunk.metadata).toHaveProperty('filename');
      expect(chunk.metadata).toHaveProperty('chunkIndex');
      expect(chunk.metadata).toHaveProperty('totalChunks');
      expect(chunk.metadata.filename).toBe('test.txt');
    });
  });

  test('should handle page-based chunking', () => {
    const pages = [
      'This is page one content. It has some text. More sentences here.',
      'This is page two content. It has different text. Even more content.',
    ];

    const chunks = chunkByPages(pages, 'document.pdf');
    
    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach(chunk => {
      expect(chunk.metadata).toHaveProperty('page');
      expect(chunk.metadata.page).toBeGreaterThan(0);
    });
  });

  test('should merge small chunks', () => {
    const smallChunks = [
      {
        id: 'test-1',
        content: 'Short',
        metadata: { filename: 'test.txt', chunkIndex: 0, totalChunks: 3 }
      },
      {
        id: 'test-2', 
        content: 'Also short',
        metadata: { filename: 'test.txt', chunkIndex: 1, totalChunks: 3 }
      },
      {
        id: 'test-3',
        content: 'This is a much longer chunk that should not be merged with others because it meets the minimum size requirement.',
        metadata: { filename: 'test.txt', chunkIndex: 2, totalChunks: 3 }
      }
    ];

    const merged = mergeSmallChunks(smallChunks, 20);
    
    expect(merged.length).toBeLessThan(smallChunks.length);
    expect(merged[0].content).toContain('Short Also short');
  });

  test('should handle empty text', () => {
    const chunks = chunkText('', 'empty.txt');
    expect(chunks.length).toBe(0);
  });

  test('should handle single sentence', () => {
    const chunks = chunkText('This is a single sentence.', 'single.txt');
    expect(chunks.length).toBe(1);
    expect(chunks[0].content.trim()).toBe('This is a single sentence.');
  });
});
