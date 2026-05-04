// 统一 AI Provider 接口定义

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  model?: string;
  stream?: boolean;
}

export interface ProviderResponse {
  content: string;
  provider: string;
  latency: number;
  status: 'success' | 'fallback' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface AIProvider {
  name: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ProviderResponse>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<StreamChunk>;
}

// 工厂函数类型
export type ProviderFactory = () => AIProvider;

// 全局注册的 providers
const providers: Record<string, ProviderFactory> = {};

export function registerProvider(name: string, factory: ProviderFactory) {
  providers[name] = factory;
}

export function getProvider(name: string): AIProvider | null {
  const factory = providers[name];
  if (!factory) return null;
  return factory();
}

export function getAllProviders(): string[] {
  return Object.keys(providers);
}