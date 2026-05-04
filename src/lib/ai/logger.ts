// AI 请求日志记录器

export interface RequestLog {
  requestId: string;
  provider: string;
  startTime: number;
  endTime?: number;
  latency?: number;
  statusCode?: number;
  status: 'started' | 'completed' | 'error';
  errorMessage?: string;
  errorType?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

const logs: RequestLog[] = [];

export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function logRequestStart(provider: string, model?: string): string {
  const requestId = generateRequestId();
  const log: RequestLog = {
    requestId,
    provider,
    startTime: Date.now(),
    status: 'started',
    model,
  };
  logs.push(log);
  
  console.log(`[AI] [${requestId}] Request started - Provider: ${provider}, Model: ${model || 'unknown'}`);
  
  // 保留最近 100 条日志
  if (logs.length > 100) {
    logs.shift();
  }
  
  return requestId;
}

export function logRequestComplete(
  requestId: string,
  statusCode: number,
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }
): void {
  const log = logs.find(l => l.requestId === requestId);
  if (log) {
    log.endTime = Date.now();
    log.latency = log.endTime - log.startTime;
    log.statusCode = statusCode;
    log.status = 'completed';
    if (usage) {
      log.promptTokens = usage.promptTokens;
      log.completionTokens = usage.completionTokens;
      log.totalTokens = usage.totalTokens;
    }
    
    console.log(
      `[AI] [${requestId}] Request completed - Status: ${statusCode}, ` +
      `Latency: ${log.latency}ms, ` +
      `Tokens: ${log.totalTokens || 'N/A'}, ` +
      `Provider: ${log.provider}`
    );
  }
}

export function logRequestError(
  requestId: string,
  errorType: string,
  errorMessage: string
): void {
  const log = logs.find(l => l.requestId === requestId);
  if (log) {
    log.endTime = Date.now();
    log.latency = log.endTime - log.startTime;
    log.status = 'error';
    log.errorType = errorType;
    log.errorMessage = errorMessage;
    
    console.error(
      `[AI] [${requestId}] Request failed - Error: ${errorType}, ` +
      `Message: ${errorMessage}, ` +
      `Latency: ${log.latency}ms, ` +
      `Provider: ${log.provider}`
    );
  }
}

export function getRecentLogs(count: number = 10): RequestLog[] {
  return [...logs].reverse().slice(0, count);
}

export function getProviderStats(provider: string): {
  totalRequests: number;
  successRate: number;
  avgLatency: number;
} {
  const providerLogs = logs.filter(l => l.provider === provider);
  const completed = providerLogs.filter(l => l.status === 'completed');
  const total = providerLogs.length;
  const successRate = total > 0 ? (completed.length / total) * 100 : 0;
  const avgLatency = completed.length > 0
    ? completed.reduce((sum, l) => sum + (l.latency || 0), 0) / completed.length
    : 0;
  
  return {
    totalRequests: total,
    successRate: Math.round(successRate * 100) / 100,
    avgLatency: Math.round(avgLatency),
  };
}