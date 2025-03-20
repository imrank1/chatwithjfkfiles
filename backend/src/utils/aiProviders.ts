import OpenAI from 'openai';
import { Mistral } from '@mistralai/mistralai';

export interface AIProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateResponse(messages: Array<{ role: string; content: string }>): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    console.info("Initializing OpenAIProvider");
    this.client = new OpenAI({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    console.info("OpenAIProvider.generateEmbedding called");
    const response = await this.client.embeddings.create({
      input: text,
      model: "text-embedding-ada-002"
    });
    console.info("OpenAI embedding generated with dimension:", response.data[0].embedding.length);
    return response.data[0].embedding;
  }

  async generateResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    console.info("OpenAIProvider.generateResponse called");
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
    console.info("Initializing MistralProvider");
    this.client = new Mistral({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    console.info("MistralProvider.generateEmbedding called");
    const response = await this.client.embeddings.create({
      model: "mistral-embed",
      inputs: [text]
    });
    const embedding = response.data[0].embedding;
    if (!embedding) {
      throw new Error('No embedding in response');
    }
    console.info("Mistral embedding generated with dimension:", embedding.length);
    return embedding;
  }

  async generateResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    console.info("MistralProvider.generateResponse called");
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
  console.info(`Creating AI provider: ${provider}`);
  
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'mistral':
      return new MistralProvider(apiKey);
    default:
      console.error(`Unsupported AI provider: ${provider}. Falling back to Mistral.`);
      return new MistralProvider(apiKey);
  }
} 