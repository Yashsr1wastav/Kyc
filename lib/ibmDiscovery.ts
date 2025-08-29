// IBM Watson Discovery integration
import DiscoveryV2 from 'ibm-watson/discovery/v2';
import { IamAuthenticator } from 'ibm-watson/auth';
import { env } from './env';
import { DocumentChunk } from './chunker';

export interface DiscoveryDocument {
  document_id?: string;
  filename?: string;
  title?: string;
  text?: string;
  metadata?: Record<string, any>;
}

export interface SearchPassage {
  passage_text?: string;
  document_id?: string;
  collection_id?: string;
  start_offset?: number;
  end_offset?: number;
  field?: string;
}

export interface SearchResult {
  matching_results: number;
  results: DiscoveryDocument[];
  passages?: SearchPassage[];
}

class IBMDiscoveryService {
  private discovery: DiscoveryV2;

  constructor() {
    this.discovery = new DiscoveryV2({
      version: '2020-08-30',
      authenticator: new IamAuthenticator({
        apikey: env.IBM_DISCOVERY_APIKEY,
      }),
      serviceUrl: env.IBM_DISCOVERY_URL,
    });
  }

  /**
   * Add a document to the Discovery collection
   */
  async addDocument(chunk: DocumentChunk): Promise<string> {
    try {
      const response = await this.discovery.addDocument({
        projectId: env.IBM_DISCOVERY_PROJECT_ID,
        collectionId: env.IBM_DISCOVERY_COLLECTION_ID,
        file: Buffer.from(chunk.content, 'utf-8'),
        filename: `${chunk.id}.txt`,
        fileContentType: 'text/plain',
        metadata: JSON.stringify({
          filename: chunk.metadata.filename,
          page: chunk.metadata.page,
          chunkIndex: chunk.metadata.chunkIndex,
          totalChunks: chunk.metadata.totalChunks,
          chunk_id: chunk.id,
        }),
      });

      return response.result.document_id || '';
    } catch (error) {
      console.error('Error adding document to Discovery:', error);
      throw new Error(`Failed to add document: ${error}`);
    }
  }

  /**
   * Add multiple document chunks to Discovery
   */
  async addDocuments(chunks: DocumentChunk[]): Promise<string[]> {
    const documentIds: string[] = [];
    
    for (const chunk of chunks) {
      try {
        const documentId = await this.addDocument(chunk);
        documentIds.push(documentId);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to add chunk ${chunk.id}:`, error);
        // Continue with other chunks even if one fails
      }
    }
    
    return documentIds;
  }

  /**
   * Search for documents in Discovery
   */
  async searchDocuments(
    query: string,
    count: number = 10,
    passages: boolean = true
  ): Promise<SearchResult> {
    try {
      const searchParams: any = {
        projectId: env.IBM_DISCOVERY_PROJECT_ID,
        collectionIds: [env.IBM_DISCOVERY_COLLECTION_ID],
        query: query,
        count: count,
        returnFields: ['document_id', 'filename', 'title', 'text', 'metadata'],
      };

      if (passages) {
        searchParams.passages = {
          enabled: true,
          count: 5,
          fields: ['text'],
          characters: 400,
          per_document: true,
        };
      }

      const response = await this.discovery.query(searchParams);
      
      return {
        matching_results: response.result.matching_results || 0,
        results: (response.result.results || []) as DiscoveryDocument[],
        passages: (response.result.passages || []) as SearchPassage[],
      };
    } catch (error) {
      console.error('Error searching Discovery:', error);
      throw new Error(`Search failed: ${error}`);
    }
  }

  /**
   * Delete a document from Discovery
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.discovery.deleteDocument({
        projectId: env.IBM_DISCOVERY_PROJECT_ID,
        collectionId: env.IBM_DISCOVERY_COLLECTION_ID,
        documentId: documentId,
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error}`);
    }
  }

  /**
   * Get collection details and status
   */
  async getCollectionStatus(): Promise<any> {
    try {
      const response = await this.discovery.getCollection({
        projectId: env.IBM_DISCOVERY_PROJECT_ID,
        collectionId: env.IBM_DISCOVERY_COLLECTION_ID,
      });

      return response.result;
    } catch (error) {
      console.error('Error getting collection status:', error);
      throw new Error(`Failed to get collection status: ${error}`);
    }
  }

  /**
   * List all documents in the collection
   */
  async listDocuments(): Promise<DiscoveryDocument[]> {
    try {
      const response = await this.discovery.listDocuments({
        projectId: env.IBM_DISCOVERY_PROJECT_ID,
        collectionId: env.IBM_DISCOVERY_COLLECTION_ID,
      });

      return (response.result.documents || []) as DiscoveryDocument[];
    } catch (error) {
      console.error('Error listing documents:', error);
      throw new Error(`Failed to list documents: ${error}`);
    }
  }

  /**
   * Clear all documents from the collection
   */
  async clearCollection(): Promise<void> {
    try {
      const documents = await this.listDocuments();
      
      for (const doc of documents) {
        if (doc.document_id) {
          await this.deleteDocument(doc.document_id);
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error clearing collection:', error);
      throw new Error(`Failed to clear collection: ${error}`);
    }
  }
}

// Export singleton instance
export const discoveryService = new IBMDiscoveryService();
