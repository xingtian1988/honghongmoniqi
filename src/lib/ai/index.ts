// AI 模块统一导出

export * from './provider';
export * from './errors';
export * from './logger';
export * from './openrouter';
export * from './composite';

// 创建默认的组合 Provider（OpenRouter + 模拟数据回退）
import { OpenRouterProvider } from './openrouter';
import { CompositeProvider } from './composite';
import { AIProvider, ChatMessage, ChatOptions, ProviderResponse, StreamChunk } from './provider';

// 模拟数据 Provider（作为最后回退）
class MockProvider implements AIProvider {
  public readonly name = 'mock';
  
  private usedReplies: Set<string> = new Set();
  
  private replies = {
    start: [
      '哼，你还知道来哄我？',
      '算你还有点良心，知道来找我了',
      '你今天是不是忘了什么重要的事情？',
      '我等了你一天的消息，你现在才来？',
      '你知道我有多生气吗？',
      '又让我等这么久...',
      '你心里还有没有我？',
    ],
    chat: {
      positive: [
        '好吧...看你态度还不错',
        '哼，这次就勉强原谅你',
        '算你会说话',
        '好吧，我心情稍微好一点了',
        '嗯...那我就不跟你计较了',
        '好吧，看在你这么诚恳的份上',
        '算你识相~',
        '这还差不多',
      ],
      neutral: [
        '哦，是吗',
        '随便你怎么说',
        '我不想听这些',
        '你总是有理由',
        '好吧，我知道了',
        '真的吗？',
        '嗯...',
        '你觉得这样就够了吗？',
      ],
      negative: [
        '你就是在敷衍我！',
        '越说越生气！',
        '你根本就不在乎我！',
        '不想跟你说话了',
        '你太让我失望了',
        '我不想听你解释！',
        '又是这套说辞！',
        '你一点都不重视我！',
      ],
    },
  };

  private getRandomReply(list: string[]): string {
    // 过滤掉已经使用过的回复
    const available = list.filter(r => !this.usedReplies.has(r));
    
    // 如果所有回复都用过了，清空记录
    if (available.length === 0) {
      this.usedReplies.clear();
      return list[Math.floor(Math.random() * list.length)];
    }
    
    const reply = available[Math.floor(Math.random() * available.length)];
    this.usedReplies.add(reply);
    return reply;
  }

  private analyzeUserMessage(content: string): 'positive' | 'neutral' | 'negative' {
    const lowerContent = content.toLowerCase();
    
    // 积极关键词
    const positiveKeywords = [
      '对不起', '抱歉', '我错了', '是我的错', '真的知道错了',
      '我爱你', '爱你', '宝贝', '老婆', '亲爱的', '心肝',
      '我会改', '一定改', '发誓', '保证', '承诺',
      '弥补', '补偿', '带你去', '陪你', '给你买',
      '想你', '好想你', '好爱好爱', '最喜欢你', '理解', '明白',
    ];
    
    // 消极关键词
    const negativeKeywords = [
      '你想太多', '你想多了', '至于吗', '别生气了',
      '我没错', '不是我的错', '你怎么又', '你每次都',
      '讲道理', '说清楚', '道理', '逻辑',
      '随便', '无所谓', '都行', '你决定',
      '分手', '离婚', '不过了', '滚', '烦',
      '你有病', '神经病', '脑子', '智障', '敷衍',
    ];
    
    // 检查积极关键词
    for (const keyword of positiveKeywords) {
      if (lowerContent.includes(keyword)) {
        return 'positive';
      }
    }
    
    // 检查消极关键词
    for (const keyword of negativeKeywords) {
      if (lowerContent.includes(keyword)) {
        return 'negative';
      }
    }
    
    return 'neutral';
  }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ProviderResponse> {
    const startTime = Date.now();
    
    // 根据消息历史判断回复类型
    let replyList = this.replies.chat.neutral;
    
    // 检查最近的用户消息
    const lastUserMsg = messages.slice().reverse().find(m => m.role === 'user');
    
    if (lastUserMsg) {
      const content = lastUserMsg.content;
      
      // 检查是否是第一次对话（消息中包含"开始"或"先说一句话"）
      if (content.includes('开始') || content.includes('先说一句话')) {
        replyList = this.replies.start;
      } else {
        // 根据用户消息内容分析回复类型
        const sentiment = this.analyzeUserMessage(content);
        replyList = this.replies.chat[sentiment];
      }
    } else {
      replyList = this.replies.start;
    }

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    return {
      content: this.getRandomReply(replyList),
      provider: this.name,
      latency: Date.now() - startTime,
      status: 'success',
    };
  }

  async* chatStream(messages: ChatMessage[], options: ChatOptions = {}): AsyncGenerator<StreamChunk> {
    const result = await this.chat(messages, options);
    
    // 模拟流式输出
    for (let i = 0; i < result.content.length; i++) {
      yield { content: result.content[i], done: false };
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
    }
    
    yield { content: '', done: true };
  }
}

// 创建全局 Provider 实例
let defaultProvider: AIProvider | null = null;

export function getDefaultProvider(): AIProvider {
  if (!defaultProvider) {
    const providers: AIProvider[] = [];
    
    // 优先使用 OpenRouter
    try {
      providers.push(new OpenRouterProvider());
    } catch {
      console.warn('[AI] Failed to initialize OpenRouter provider');
    }
    
    // 添加模拟 Provider 作为回退
    providers.push(new MockProvider());
    
    // 如果只有模拟 Provider，直接返回它
    if (providers.length === 1) {
      defaultProvider = providers[0];
    } else {
      defaultProvider = new CompositeProvider(providers, ['error', 'timeout', 'rate_limit', 'server_error', 'unknown']);
    }
  }
  
  return defaultProvider;
}

export { OpenRouterProvider, CompositeProvider, MockProvider };