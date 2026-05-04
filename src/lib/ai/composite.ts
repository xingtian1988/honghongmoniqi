import { AIProvider, ChatMessage, ChatOptions, ProviderResponse, StreamChunk } from './provider';
import { AIError } from './errors';

export interface FallbackConfig {
  providers: string[];
  maxRetries?: number;
  fallbackOn?: ('error' | 'timeout' | 'rate_limit' | 'server_error')[];
}

export class CompositeProvider implements AIProvider {
  public readonly name = 'composite';
  
  private providers: AIProvider[];
  private fallbackOn: Set<string>;

  constructor(providers: AIProvider[], fallbackOn: string[] = ['error', 'timeout', 'rate_limit', 'server_error']) {
    this.providers = providers;
    this.fallbackOn = new Set(fallbackOn);
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ProviderResponse> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      
      try {
        const result = await provider.chat(messages, options);
        
        // 如果不是第一个 provider，标记为 fallback
        if (i > 0) {
          return {
            ...result,
            status: 'fallback' as const,
          };
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // 检查是否应该降级
        if (!(error instanceof AIError) || !this.fallbackOn.has(error.type)) {
          throw error;
        }
        
        // 如果是最后一个 provider，抛出错误
        if (i === this.providers.length - 1) {
          throw error;
        }
        
        console.log(`[Composite] Falling back from ${provider.name} to ${this.providers[i + 1].name}`);
      }
    }
    
    throw lastError || new Error('No providers available');
  }

  async* chatStream(messages: ChatMessage[], options: ChatOptions = {}): AsyncGenerator<StreamChunk> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      
      try {
        const stream = provider.chatStream(messages, options);
        
        for await (const chunk of stream) {
          yield chunk;
        }
        
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (!(error instanceof AIError) || !this.fallbackOn.has(error.type)) {
          throw error;
        }
        
        if (i === this.providers.length - 1) {
          throw error;
        }
        
        console.log(`[Composite] Falling back from ${provider.name} to ${this.providers[i + 1].name}`);
      }
    }
    
    throw lastError || new Error('No providers available');
  }
}