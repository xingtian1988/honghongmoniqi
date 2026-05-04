// AI 服务错误分类

export type AIErrorType = 
  | 'authentication'    // 401 - 认证失败
  | 'authorization'     // 403 - 权限不足
  | 'rate_limit'        // 429 - 限流
  | 'server_error'      // 5xx - 服务器错误
  | 'timeout'           // 超时
  | 'bad_request'       // 400 - 请求参数错误
  | 'model_not_found'   // 404 - 模型不存在
  | 'unknown';          // 未知错误

export interface AIErrorInfo {
  type: AIErrorType;
  message: string;
  statusCode?: number;
  retryable: boolean;
  provider: string;
}

export class AIError extends Error {
  public readonly type: AIErrorType;
  public readonly statusCode?: number;
  public readonly retryable: boolean;
  public readonly provider: string;

  constructor(info: AIErrorInfo) {
    super(info.message);
    this.name = 'AIError';
    this.type = info.type;
    this.statusCode = info.statusCode;
    this.retryable = info.retryable;
    this.provider = info.provider;
  }
}

export async function getResponseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data.error) {
      return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }
    return JSON.stringify(data);
  } catch {
    try {
      return await response.text();
    } catch {
      return `HTTP ${response.status}`;
    }
  }
}

export function classifyError(provider: string, error: unknown): AIError {
  const message = error instanceof Error ? error.message : String(error);
  
  // 检查 HTTP 状态码
  let statusCode: number | undefined;
  let responseError: string | undefined;
  
  if (error instanceof Response) {
    statusCode = error.status;
    // 异步获取错误信息，但在这里不能 await，所以我们先记录状态码
  } else if (typeof error === 'object' && error !== null && 'status' in error) {
    statusCode = Number((error as { status: unknown }).status);
  }

  // 根据状态码分类
  switch (statusCode) {
    case 401:
      return new AIError({
        type: 'authentication',
        message: 'API Key 无效或认证失败',
        statusCode: 401,
        retryable: false,
        provider,
      });
    case 403:
      return new AIError({
        type: 'authorization',
        message: '没有权限访问该资源',
        statusCode: 403,
        retryable: false,
        provider,
      });
    case 429:
      return new AIError({
        type: 'rate_limit',
        message: '请求过于频繁，请稍后重试',
        statusCode: 429,
        retryable: true,
        provider,
      });
    case 400:
      return new AIError({
        type: 'bad_request',
        message: '请求参数错误',
        statusCode: 400,
        retryable: false,
        provider,
      });
    case 404:
      return new AIError({
        type: 'model_not_found',
        message: '指定的模型不存在',
        statusCode: 404,
        retryable: false,
        provider,
      });
    case 500:
    case 502:
    case 503:
    case 504:
      return new AIError({
        type: 'server_error',
        message: '服务端错误，请稍后重试',
        statusCode,
        retryable: true,
        provider,
      });
    default:
      // 检查超时相关错误
      if (message.includes('timeout') || message.includes('Timeout')) {
        return new AIError({
          type: 'timeout',
          message: '请求超时，请稍后重试',
          retryable: true,
          provider,
        });
      }
      
      // 检查认证相关错误
      if (message.includes('Unauthorized') || message.includes('invalid key')) {
        return new AIError({
          type: 'authentication',
          message: 'API Key 无效',
          retryable: false,
          provider,
        });
      }

      return new AIError({
        type: 'unknown',
        message: `未知错误: ${message}`,
        retryable: false,
        provider,
      });
  }
}

export function getErrorMessage(type: AIErrorType): string {
  const messages: Record<AIErrorType, string> = {
    authentication: 'API 认证失败，请检查 API Key',
    authorization: '没有权限访问该资源',
    rate_limit: '请求过于频繁，请稍后重试',
    server_error: '服务端暂时不可用，请稍后重试',
    timeout: '请求超时，请检查网络连接',
    bad_request: '请求参数错误',
    model_not_found: '指定的模型不存在',
    unknown: '未知错误，请稍后重试',
  };
  return messages[type];
}