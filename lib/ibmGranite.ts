// IBM Watsonx.ai Granite model integration
import { env } from './env';

export interface GraniteResponse {
  generated_text: string;
  token_count: number;
  finish_reason: string;
}

export interface SummarizeRequest {
  chunks: string[];
  query?: string;
  maxTokens?: number;
}

class IBMGraniteService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = env.WATSONX_URL;
    this.apiKey = env.WATSONX_APIKEY;
  }

  /**
   * Get access token for Watsonx.ai
   */
  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'urn:iam:params:oauth:grant-type:apikey',
          apikey: this.apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error(`Authentication failed: ${error}`);
    }
  }

  /**
   * Generate text using Granite model
   */
  private async generateText(
    prompt: string,
    maxTokens: number = 1000,
    temperature: number = 0.3
  ): Promise<GraniteResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/ml/v1/text/generation?version=2023-05-29`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          input: prompt,
          parameters: {
            decoding_method: 'greedy',
            max_new_tokens: maxTokens,
            temperature: temperature,
            stop_sequences: ['\n\n'],
          },
          model_id: 'ibm/granite-13b-chat-v2',
          project_id: env.IBM_DISCOVERY_PROJECT_ID, // Reusing project ID
        }),
      });

      if (!response.ok) {
        throw new Error(`Granite API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        generated_text: data.results?.[0]?.generated_text || '',
        token_count: data.results?.[0]?.generated_token_count || 0,
        finish_reason: data.results?.[0]?.stop_reason || 'unknown',
      };
    } catch (error) {
      console.error('Error generating text with Granite:', error);
      throw new Error(`Text generation failed: ${error}`);
    }
  }

  /**
   * Summarize document chunks
   */
  async summarizeChunks(request: SummarizeRequest): Promise<string> {
    const { chunks, query, maxTokens = 800 } = request;
    
    if (chunks.length === 0) {
      return 'No content provided for summarization.';
    }

    // Combine chunks with context
    const combinedText = chunks.join('\n\n---\n\n');
    
    // Create summarization prompt
    const prompt = query 
      ? `Based on the following document excerpts, provide a comprehensive summary that addresses this question: "${query}"

Document excerpts:
${combinedText}

Summary:`
      : `Please provide a comprehensive summary of the following document excerpts:

${combinedText}

Summary:`;

    try {
      const response = await this.generateText(prompt, maxTokens, 0.3);
      return response.generated_text.trim();
    } catch (error) {
      console.error('Error summarizing chunks:', error);
      return 'Failed to generate summary. Please try again.';
    }
  }

  /**
   * Extract key points from text
   */
  async extractKeyPoints(text: string, maxPoints: number = 5): Promise<string[]> {
    const prompt = `Extract the ${maxPoints} most important key points from the following text. Return each point as a separate line starting with a dash (-):

${text}

Key points:`;

    try {
      const response = await this.generateText(prompt, 400, 0.2);
      const points = response.generated_text
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().substring(1).trim())
        .filter(point => point.length > 0)
        .slice(0, maxPoints);

      return points;
    } catch (error) {
      console.error('Error extracting key points:', error);
      return ['Failed to extract key points.'];
    }
  }

  /**
   * Answer question based on context
   */
  async answerQuestion(question: string, context: string): Promise<string> {
    const prompt = `Based on the following context, please answer the question. If the answer cannot be found in the context, say "I cannot answer this question based on the provided information."

Context:
${context}

Question: ${question}

Answer:`;

    try {
      const response = await this.generateText(prompt, 600, 0.3);
      return response.generated_text.trim();
    } catch (error) {
      console.error('Error answering question:', error);
      return 'Failed to generate answer. Please try again.';
    }
  }

  /**
   * Check if text is relevant to query
   */
  async checkRelevance(text: string, query: string): Promise<boolean> {
    const prompt = `Is the following text relevant to this query: "${query}"?

Text:
${text}

Answer with only "YES" or "NO":`;

    try {
      const response = await this.generateText(prompt, 10, 0.1);
      const answer = response.generated_text.trim().toUpperCase();
      return answer.includes('YES');
    } catch (error) {
      console.error('Error checking relevance:', error);
      return true; // Default to relevant if check fails
    }
  }
}

// Export singleton instance
export const graniteService = new IBMGraniteService();
