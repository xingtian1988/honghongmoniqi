import { AIProvider, ChatMessage, ChatOptions, ProviderResponse, StreamChunk } from './provider';
import { classifyError, getResponseError } from './errors';
import { logRequestStart, logRequestComplete, logRequestError } from './logger';

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

export class OpenRouterProvider implements AIProvider {
  public readonly name = 'openrouter';
  
  private apiKey: string;
  private apiUrl: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    this.defaultModel = process.env.OPENROUTER_MODEL || 'google/gemini-3-flash-preview';

    if (!this.apiKey) {
      console.warn('[OpenRouter] API Key not configured');
    }
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ProviderResponse> {
    const requestId = logRequestStart(this.name, options.model || this.defaultModel);
    
    try {
      const startTime = Date.now();
      
      const body: OpenRouterRequest = {
        model: options.model || this.defaultModel,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature ?? 0.8,
        stream: false,
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorMessage = await getResponseError(response);
        const error = new Error(`HTTP ${response.status}: ${errorMessage}`);
        (error as any).status = response.status;
        throw error;
      }

      const data: OpenRouterResponse = await response.json();
      const latency = Date.now() - startTime;

      logRequestComplete(requestId, response.status, {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      });

      return {
        content: data.choices[0]?.message?.content || '',
        provider: this.name,
        latency,
        status: 'success',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      const aiError = classifyError(this.name, error);
      logRequestError(requestId, aiError.type, aiError.message);
      throw aiError;
    }
  }

  async* chatStream(messages: ChatMessage[], options: ChatOptions = {}): AsyncGenerator<StreamChunk> {
    const requestId = logRequestStart(this.name, options.model || this.defaultModel);
    
    try {
      const body: OpenRouterRequest = {
        model: options.model || this.defaultModel,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature ?? 0.8,
        stream: true,
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorMessage = await getResponseError(response);
        const error = new Error(`HTTP ${response.status}: ${errorMessage}`);
        (error as any).status = response.status;
        throw error;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (value) {
          buffer += decoder.decode(value, { stream: true });
        }

        // 解析 SSE 格式
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              // 结束信号
              yield { content: '', done: true };
              logRequestComplete(requestId, response.status);
              return;
            }
            
            try {
              const chunk: OpenRouterStreamChunk = JSON.parse(dataStr);
              const delta = chunk.choices[0]?.delta?.content || '';
              content += delta;
              
              if (delta) {
                yield { content: delta, done: false };
              }
            } catch {
              // 忽略解析错误
            }
          }
        }

        if (done) {
          break;
        }
      }
    } catch (error) {
      const aiError = classifyError(this.name, error);
      logRequestError(requestId, aiError.type, aiError.message);
      throw aiError;
    }
  }
}