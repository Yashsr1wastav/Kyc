// AWS Bedrock Titan integration
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { env } from './env';

export interface TitanRequest {
  prompt: string;
  temperature?: number;
  topP?: number;
  maxTokenCount?: number;
  stopSequences?: string[];
}

export interface TitanResponse {
  inputTextTokenCount: number;
  results: Array<{
    tokenCount: number;
    outputText: string;
    completionReason: string;
  }>;
}

class AWSTitanService {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.modelId = env.AWS_BEDROCK_TITAN_MODEL_ID;
  }

  /**
   * Generate text using Titan model
   */
  async generateText(request: TitanRequest): Promise<string> {
    try {
      const body = JSON.stringify({
        inputText: request.prompt,
        textGenerationConfig: {
          temperature: request.temperature || 0.3,
          topP: request.topP || 0.9,
          maxTokenCount: request.maxTokenCount || 1000,
          stopSequences: request.stopSequences || [],
        },
      });

      const command = new InvokeModelCommand({
        modelId: this.modelId,
        body: body,
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return responseBody.results?.[0]?.outputText || '';
    } catch (error) {
      console.error('Error generating text with Titan:', error);
      throw new Error(`Titan generation failed: ${error}`);
    }
  }

  /**
   * Generate streaming text using Titan model
   */
  async* generateTextStream(request: TitanRequest): AsyncGenerator<string, void, unknown> {
    try {
      const body = JSON.stringify({
        inputText: request.prompt,
        textGenerationConfig: {
          temperature: request.temperature || 0.3,
          topP: request.topP || 0.9,
          maxTokenCount: request.maxTokenCount || 1000,
          stopSequences: request.stopSequences || [],
        },
      });

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: this.modelId,
        body: body,
        contentType: 'application/json',
        accept: 'application/json',
      });

      const response = await this.client.send(command);
      
      if (response.body) {
        for await (const chunk of response.body) {
          if (chunk.chunk?.bytes) {
            const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
            try {
              const parsedChunk = JSON.parse(chunkText);
              if (parsedChunk.outputText) {
                yield parsedChunk.outputText;
              }
            } catch (parseError) {
              // Skip invalid JSON chunks
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming text with Titan:', error);
      throw new Error(`Titan streaming failed: ${error}`);
    }
  }

  /**
   * Generate a grounded answer using retrieved context and query
   */
  async generateGroundedAnswer(
    query: string,
    context: string,
    summary: string,
    strictMode: boolean = false
  ): Promise<string> {
    const strictInstruction = strictMode 
      ? "You must only use information from the provided context. If the answer cannot be found in the context, respond with 'I cannot answer this question based on the provided documents.'"
      : "Use the provided context as your primary source, but you may draw on general knowledge if needed to provide a complete answer.";

    const prompt = `You are an AI assistant helping users find information from uploaded documents. ${strictInstruction}

Context Summary:
${summary}

Detailed Context:
${context}

Question: ${query}

Please provide a comprehensive, well-structured answer based on the context above. Include specific references to the source documents when possible.

Answer:`;

    return await this.generateText({
      prompt,
      temperature: 0.3,
      maxTokenCount: 1500,
      stopSequences: ['\n\nQuestion:', '\n\nContext:'],
    });
  }

  /**
   * Synthesize information from multiple sources
   */
  async synthesizeInformation(
    query: string,
    sources: Array<{ content: string; filename: string; page?: number }>
  ): Promise<string> {
    const formattedSources = sources
      .map((source, index) => {
        const pageInfo = source.page ? ` (Page ${source.page})` : '';
        return `Source ${index + 1} - ${source.filename}${pageInfo}:\n${source.content}`;
      })
      .join('\n\n---\n\n');

    const prompt = `Based on the following sources, provide a comprehensive answer to the user's question. Combine insights from all relevant sources and indicate which sources support each point.

Question: ${query}

Sources:
${formattedSources}

Please provide a well-structured answer that:
1. Directly addresses the question
2. Synthesizes information from multiple sources when applicable
3. Indicates which sources support specific claims (e.g., "According to Source 1...")
4. Maintains accuracy and avoids contradictions

Answer:`;

    return await this.generateText({
      prompt,
      temperature: 0.3,
      maxTokenCount: 2000,
      stopSequences: ['\n\nQuestion:', '\n\nSources:'],
    });
  }

  /**
   * Generate follow-up questions based on the context
   */
  async generateFollowUpQuestions(query: string, answer: string): Promise<string[]> {
    const prompt = `Based on the following question and answer, generate 3 relevant follow-up questions that a user might want to ask:

Original Question: ${query}

Answer: ${answer}

Generate 3 follow-up questions (one per line, starting with "Q:"):`;

    try {
      const response = await this.generateText({
        prompt,
        temperature: 0.5,
        maxTokenCount: 300,
      });

      const questions = response
        .split('\n')
        .filter(line => line.trim().startsWith('Q:'))
        .map(line => line.trim().substring(2).trim())
        .filter(q => q.length > 0)
        .slice(0, 3);

      return questions;
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const titanService = new AWSTitanService();
