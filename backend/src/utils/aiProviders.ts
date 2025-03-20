import OpenAI from 'openai';
import { Mistral } from '@mistralai/mistralai';

export interface AIProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateResponse(messages: Array<{ role: string; content: string }>): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      input: text,
      model: "text-embedding-ada-002"
    });
    return response.data[0].embedding;
  }

  async generateResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: 0.3,
      max_tokens: 1000
    });
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }
    return content;
  }
}

export class MistralProvider implements AIProvider {
  private client: Mistral;

  constructor(apiKey: string) {
    this.client = new Mistral({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: "mistral-embed",
      inputs: [text]
    });
    const embedding = response.data[0].embedding;
    if (!embedding) {
      throw new Error('No embedding in response');
    }
    return embedding;
  }

  async generateResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    // Convert messages to the correct type
    const mistralMessages = messages.map(msg => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content
    }));

    const completion = await this.client.chat.complete({
      model: "mistral-small-latest",
      messages: mistralMessages,
      temperature: 0.3,
      maxTokens: 1000
    });

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No choices in response');
    }

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }

    // Handle both string and array content types
    if (Array.isArray(content)) {
      return content.map(chunk => chunk.type === 'text' ? chunk.text : '').join('');
    }
    return content;
  }
}

export function createAIProvider(provider: string, apiKey: string): AIProvider {
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'mistral':
      return new MistralProvider(apiKey);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
} 