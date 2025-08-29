// Document chunking utilities for processing large text files
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    filename: string;
    page?: number;
    chunkIndex: number;
    totalChunks: number;
  };
}

export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  minChunkSize: number;
}

const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  chunkSize: 1000,
  chunkOverlap: 200,
  minChunkSize: 100,
};

/**
 * Split text into chunks with specified size and overlap
 */
export function chunkText(
  text: string,
  filename: string,
  options: Partial<ChunkingOptions> = {}
): DocumentChunk[] {
  const { chunkSize, chunkOverlap, minChunkSize } = {
    ...DEFAULT_CHUNKING_OPTIONS,
    ...options,
  };

  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: DocumentChunk[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) {
    return [];
  }
  
  let currentChunk = '';
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const sentenceText = sentence.trim() + '.';
    
    // If adding this sentence would exceed chunk size, save current chunk
    if (currentChunk.length + sentenceText.length > chunkSize && currentChunk.length >= minChunkSize) {
      chunks.push({
        id: `${filename}-chunk-${chunkIndex}`,
        content: currentChunk.trim(),
        metadata: {
          filename,
          chunkIndex,
          totalChunks: 0, // Will be updated later
        },
      });
      
      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, chunkOverlap);
      currentChunk = overlapText + ' ' + sentenceText;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentenceText;
    }
  }

  // Add the last chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${filename}-chunk-${chunkIndex}`,
      content: currentChunk.trim(),
      metadata: {
        filename,
        chunkIndex,
        totalChunks: 0,
      },
    });
  }

  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.metadata.totalChunks = chunks.length;
  });

  return chunks;
}

/**
 * Get overlap text from the end of a chunk
 */
function getOverlapText(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) return text;
  
  const endText = text.slice(-overlapSize);
  const lastSentenceStart = endText.lastIndexOf('.');
  
  if (lastSentenceStart > 0) {
    return endText.slice(lastSentenceStart + 1).trim();
  }
  
  return endText;
}

/**
 * Chunk text by pages (for PDFs)
 */
export function chunkByPages(
  pages: string[],
  filename: string,
  options: Partial<ChunkingOptions> = {}
): DocumentChunk[] {
  const allChunks: DocumentChunk[] = [];
  
  pages.forEach((pageText, pageIndex) => {
    const pageChunks = chunkText(pageText, filename, options);
    
    // Add page information to metadata
    const chunksWithPageInfo = pageChunks.map((chunk, chunkIndex) => ({
      ...chunk,
      id: `${filename}-page${pageIndex + 1}-chunk-${chunkIndex}`,
      metadata: {
        ...chunk.metadata,
        page: pageIndex + 1,
      },
    }));
    
    allChunks.push(...chunksWithPageInfo);
  });
  
  return allChunks;
}

/**
 * Merge small chunks that are below minimum size
 */
export function mergeSmallChunks(chunks: DocumentChunk[], minSize: number = 100): DocumentChunk[] {
  const mergedChunks: DocumentChunk[] = [];
  let i = 0;

  while (i < chunks.length) {
    let currentChunk = chunks[i];
    
    // If chunk is too small, try to merge with next chunk
    while (
      i + 1 < chunks.length &&
      currentChunk.content.length < minSize &&
      chunks[i + 1].metadata.filename === currentChunk.metadata.filename
    ) {
      const nextChunk = chunks[i + 1];
      currentChunk = {
        ...currentChunk,
        content: currentChunk.content + ' ' + nextChunk.content,
        metadata: {
          ...currentChunk.metadata,
          totalChunks: currentChunk.metadata.totalChunks - 1,
        },
      };
      i++;
    }
    
    mergedChunks.push(currentChunk);
    i++;
  }

  return mergedChunks;
}
