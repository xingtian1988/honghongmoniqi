import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils, Message } from "coze-coding-dev-sdk";

// 预设场景数据
const SCENARIOS = {
  easy: [
    { id: "forgot-date", title: "忘记约会日期", description: "今天是一个特别的日子，但你完全忘了", initialAnger: 40 },
    { id: "late-reply", title: "回复消息太慢", description: "你忙了一整天，期间她发了好几条消息", initialAnger: 30 },
    { id: "work-busy", title: "加班忽略了她", description: "连续加班一周，周末也没能陪她", initialAnger: 35 },
    { id: "forgot-buy", title: "忘记买答应的东西", description: "答应下班给她带奶茶，结果忙忘了", initialAnger: 25 },
    { id: "game-too-late", title: "打游戏太晚", description: "昨晚和朋友开黑到凌晨2点", initialAnger: 35 },
    { id: "wrong-size", title: "买错尺码", description: "她让你帮忙买衣服，你买错了", initialAnger: 20 },
    { id: "wrong-food", title: "买错食物", description: "她说了不要香菜，你买的小吃里有香菜", initialAnger: 20 },
    { id: "forgot-call", title: "忘记打电话", description: "她说早点打电话，但你忙忘了", initialAnger: 30 },
    { id: "movie-forgot", title: "忘记一起看电影", description: "约好晚上一起看剧，你看到一半睡着了", initialAnger: 40 },
    { id: "wrong-name", title: "叫错名字", description: "一不小心叫成了前任的名字", initialAnger: 50 },
  ],
  medium: [
    { id: "forgot-birthday", title: "忘记生日", description: "她生日当天你完全忘了，连祝福都是第二天才想起", initialAnger: 60 },
    { id: "late-pickup", title: "约会迟到", description: "让她在餐厅等了一个小时", initialAnger: 55 },
    { id: "bad-joke", title: "说错话惹她生气", description: "你说了一句她很在意的话，她生气了", initialAnger: 50 },
    { id: "broken-promise", title: "食言", description: "答应陪她逛街，你临时说有事", initialAnger: 50 },
    { id: "forgot-anniversary", title: "忘记纪念日", description: "你们在一起一周年，你完全忘了", initialAnger: 65 },
    { id: "compare-ex", title: "和前任比较", description: "你不小心说了'前任不会这样'", initialAnger: 70 },
    { id: "bad-friends", title: "她不喜欢你的朋友", description: "你和朋友出去，没带她，她说很介意", initialAnger: 55 },
    { id: "phone-hidden", title: "手机藏起来", description: "她想看你手机，你条件反射藏起来了", initialAnger: 60 },
    { id: "work-travel", title: "经常出差", description: "这几个月经常出差，陪伴她的时间很少", initialAnger: 50 },
    { id: "bad-habit", title: "坏习惯不改", description: "她说过很多次让你改的坏习惯，你一直没改", initialAnger: 55 },
  ],
  hard: [
    { id: "missed-call-important", title: "错过重要电话", description: "她有急事找你，你电话静音没接到", initialAnger: 70 },
    { id: "female-friend", title: "和异性朋友聊天", description: "她发现你和一位女同事聊天很频繁", initialAnger: 75 },
    { id: "forgot-meet-parents", title: "忘记见家长", description: "约好周末见父母，你临时忘了", initialAnger: 80 },
    { id: "money-issue", title: "金钱纠纷", description: "她借给你一大笔钱，你一直没提", initialAnger: 70 },
    { id: "bad-manners", title: "当众让她难堪", description: "在朋友面前开了个过分的玩笑", initialAnger: 75 },
    { id: "broken-item", title: "弄坏她的东西", description: "不小心弄坏了她很珍惜的东西", initialAnger: 70 },
    { id: "wrong-word", title: "说了很伤人的话", description: "吵架时你说了很伤人的话", initialAnger: 85 },
    { id: "meet-ex", title: "和前任见面", description: "你瞒着她和前任见面被她发现了", initialAnger: 90 },
    { id: "bad-attitude", title: "态度很差", description: "她觉得你这段时间对她态度很冷淡", initialAnger: 75 },
    { id: "trust-broken", title: "信任危机", description: "她发现你隐瞒了一件重要的事", initialAnger: 85 },
  ],
};

const ROUND_LIMITS = { easy: 8, medium: 10, hard: 12 };

// 模拟 AI 回复（当外部 API 不可用时使用）
const SIMULATED_REPLIES = {
  start: [
    "哼，你还知道来哄我？",
    "算你还有点良心，知道来找我了",
    "你今天是不是忘了什么重要的事情？",
    "我等了你一天的消息，你现在才来？",
    "你知道我有多生气吗？",
  ],
  chat: {
    positive: [
      "好吧...看你态度还不错",
      "哼，这次就勉强原谅你",
      "算你会说话",
      "好吧，我心情稍微好一点了",
      "嗯...那我就不跟你计较了",
    ],
    neutral: [
      "哦，是吗",
      "随便你怎么说",
      "我不想听这些",
      "你总是有理由",
      "好吧，我知道了",
    ],
    negative: [
      "你就是在敷衍我！",
      "越说越生气！",
      "你根本就不在乎我！",
      "不想跟你说话了",
      "你太让我失望了",
    ],
  },
};

function getRandomReply(replies: string[]): string {
  return replies[Math.floor(Math.random() * replies.length)];
}

// 分析用户输入，计算好感度变化
function analyzeUserMessage(userMessage: string): number {
  const lowerMessage = userMessage.toLowerCase();
  
  // 非常有效的正向关键词
  const veryEffective = [
    "对不起", "抱歉", "我错了", "是我的错", "真的知道错了",
    "我爱你", "爱你", "宝贝", "老婆", "亲爱的", "心肝",
    "我会改", "一定改", "发誓", "保证", "承诺",
    "弥补", "补偿", "带你去", "陪你", "给你买",
    "想你", "好想你", "好爱好爱", "最喜欢你",
  ];
  
  // 有效的中性/部分正向关键词
  const somewhatEffective = [
    "理解", "明白", "我知道", "我懂", "你说得对",
    "心疼", "难受", "内疚", "自责", "难过",
    "以后", "以后会", "下次", "下次一定",
    "解释一下", "听我解释", "其实", "但是",
  ];
  
  // 无效/负向关键词
  const ineffective = [
    "你想太多", "你想多了", "至于吗", "别生气了",
    "我没错", "不是我的错", "你怎么又", "你每次都",
    "讲道理", "说清楚", "道理", "逻辑",
    "随便", "无所谓", "都行", "你决定",
  ];
  
  // 非常无效的关键词（会让情况更糟）
  const veryIneffective = [
    "分手", "离婚", "不过了", "滚", "烦",
    "你有病", "神经病", "脑子", "智障",
  ];
  
  let change = 0;
  
  // 检查是否有非常无效的关键词
  for (const keyword of veryIneffective) {
    if (lowerMessage.includes(keyword)) {
      return 25; // 大幅增加愤怒
    }
  }
  
  // 检查是否有非常有效的关键词
  for (const keyword of veryEffective) {
    if (lowerMessage.includes(keyword)) {
      change -= 15;
    }
  }
  
  // 检查是否有部分有效的关键词
  for (const keyword of somewhatEffective) {
    if (lowerMessage.includes(keyword)) {
      change -= 8;
    }
  }
  
  // 检查是否有无效关键词
  for (const keyword of ineffective) {
    if (lowerMessage.includes(keyword)) {
      change += 10;
    }
  }
  
  // 如果没有任何有效/无效关键词，根据消息长度微调
  if (change === 0) {
    if (userMessage.length > 20) {
      change = -3; // 较长的认真回复，稍微减少愤怒
    } else if (userMessage.length < 5) {
      change = 5; // 敷衍的短回复，稍微增加愤怒
    }
  }
  
  // 限制变化范围在 -20 到 +20 之间
  return Math.max(-20, Math.min(20, change));
}

// 获取情绪反应
function getEmotionReaction(angerChange: number, currentAnger: number): string {
  if (angerChange <= -10) {
    // 好感增加很多
    if (currentAnger <= 30) return "语气软了下来";
    if (currentAnger <= 60) return "稍微哼了一声，但没那么凶了";
    return "稍微安静了一会儿...";
  } else if (angerChange <= -3) {
    // 好感增加
    if (currentAnger <= 30) return "偷偷笑了一下";
    if (currentAnger <= 60) return "哼了一声，但愿意听了";
    return "没有说话，沉默了几秒";
  } else if (angerChange <= 3) {
    // 变化不大
    if (currentAnger <= 30) return "有点无奈地叹了口气";
    if (currentAnger <= 60) return "翻了个白眼";
    return "冷笑了一声";
  } else if (angerChange <= 10) {
    // 好感减少
    if (currentAnger <= 60) return "更生气了...";
    return "更冷淡了";
  } else {
    // 好感大幅减少
    if (currentAnger >= 80) return "准备拉黑你...";
    return "突然不说话了";
  }
}

// 生成复盘分析
function generateReview(userMessages: string[], angerChanges: number[]): {
  mistakes: string[];
  correctActions: string[];
  summary: string;
} {
  const mistakes: string[] = [];
  const correctActions: string[] = [];
  
  // 分析每条用户消息
  userMessages.forEach((msg, index) => {
    const lowerMsg = msg.toLowerCase();
    const change = angerChanges[index];
    
    if (change > 10) {
      // 踩雷了
      if (lowerMsg.includes("你想太多") || lowerMsg.includes("你想多了")) {
        mistakes.push(`第${index + 1}句："否定她的感受" - 说"你想太多"会让她觉得不被理解`);
      }
      if (lowerMsg.includes("我没错") || lowerMsg.includes("不是我的错")) {
        mistakes.push(`第${index + 1}句："拒绝承认错误" - 坚持自己没错会让矛盾升级`);
      }
      if (lowerMsg.includes("讲道理") || lowerMsg.includes("道理")) {
        mistakes.push(`第${index + 1}句："试图讲道理" - 生气时不需要道理，需要情感支持`);
      }
      if (lowerMsg.includes("你怎么又") || lowerMsg.includes("你每次都")) {
        mistakes.push(`第${index + 1}句："指责式沟通" - "你怎么又..."会让她更委屈`);
      }
      if (lowerMsg.includes("随便") || lowerMsg.includes("无所谓")) {
        mistakes.push(`第${index + 1}句："敷衍态度" - 敷衍会让对方觉得不被重视`);
      }
      if (lowerMsg.includes("前任")) {
        mistakes.push(`第${index + 1}句："提到前任" - 任何时候提到前任都是大忌`);
      }
      if (msg.length < 5) {
        mistakes.push(`第${index + 1}句："回复太短" - 敷衍的短回复不如认真回复一条`);
      }
    }
    
    if (change < -5) {
      // 做对了
      if (lowerMsg.includes("对不起") || lowerMsg.includes("抱歉") || lowerMsg.includes("我错了")) {
        correctActions.push(`第${index + 1}句："真诚道歉" - 直接承认错误是最有效的`);
      }
      if (lowerMsg.includes("宝贝") || lowerMsg.includes("老婆") || lowerMsg.includes("亲爱的")) {
        correctActions.push(`第${index + 1}句："称呼昵称" - 亲昵的称呼能拉近距离`);
      }
      if (lowerMsg.includes("我爱你") || lowerMsg.includes("想你") || lowerMsg.includes("最喜欢你")) {
        correctActions.push(`第${index + 1}句："表达爱意" - 直接表达爱意能让她感到被在乎`);
      }
      if (lowerMsg.includes("理解") || lowerMsg.includes("明白") || lowerMsg.includes("我懂")) {
        correctActions.push(`第${index + 1}句："表达理解" - 让她知道你理解她的感受`);
      }
      if (lowerMsg.includes("补偿") || lowerMsg.includes("弥补") || lowerMsg.includes("带你去")) {
        correctActions.push(`第${index + 1}句："提出弥补方案" - 具体的行动承诺比空话更有用`);
      }
      if (lowerMsg.includes("下次一定") || lowerMsg.includes("以后会")) {
        correctActions.push(`第${index + 1}句："承诺改变" - 表示以后会注意让她更安心`);
      }
    }
  });
  
  // 去重
  const uniqueMistakes = [...new Set(mistakes)];
  const uniqueCorrect = [...new Set(correctActions)];
  
  // 生成总结
  let summary = "";
  if (uniqueMistakes.length === 0 && uniqueCorrect.length === 0) {
    summary = "这轮回复比较中性，没有明显的加分或减分";
  } else if (uniqueMistakes.length > uniqueCorrect.length) {
    summary = "这次对话中踩了不少雷区，建议多练习表达共情和真诚道歉";
  } else if (uniqueCorrect.length > uniqueMistakes.length) {
    summary = "这次对话做得不错！继续保持真诚和耐心";
  } else {
    summary = "有做得好的地方，也有需要改进的地方，继续加油";
  }
  
  return {
    mistakes: uniqueMistakes,
    correctActions: uniqueCorrect,
    summary,
  };
}

function getAngerDescription(anger: number): string {
  if (anger >= 90) return "极度愤怒，考虑分手";
  if (anger >= 70) return "非常生气";
  if (anger >= 50) return "还在生气";
  if (anger >= 30) return "开始软化";
  if (anger >= 10) return "快被哄好了";
  return "完全被哄好了";
}

// 构建系统提示词（不包含内部评估要求）
function buildSystemPrompt(scenario: typeof SCENARIOS.easy[0], difficulty: string, currentAnger: number, round: number) {
  return `你是"哄哄模拟器"中的AI角色，正在扮演一个正在生气的女朋友。

## 场景背景
${scenario.description}

## 游戏规则
1. 这是一个模拟哄女友的对话练习游戏
2. 玩家（用户）需要通过对话将你的好感度从100降到0来"哄好"你
3. 游戏轮次限制：${ROUND_LIMITS[difficulty as keyof typeof ROUND_LIMITS]}轮
4. 胜利条件：在限制轮数内将好感度降到0

## 当前状态
- 好感度：${currentAnger}/100
- 轮次：第${round}轮
- 你的状态：${getAngerDescription(currentAnger)}

## 对话要求
1. 你说的每一句话都要符合当前好感度对应的情绪状态
2. 保持对话连贯，模拟真实情侣对话
3. 可以适当俏皮可爱，但情绪要真实
4. 不要重复之前说过的话
5. 只输出你说的话，不要输出其他内容（如括号、动作描述等）
6. 每句话控制在30字以内
7. 用口语化、俏皮的方式表达
8. 可以适当加语气词如"哼"、"哦"、"啊"、"嘛"等`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      difficulty,
      scenarioId,
      conversationHistory,
      userMessage,
      currentAnger,
      currentRound,
      userMessages,
      angerChanges,
    } = body;

    // 获取场景
    if (action === "start") {
      const scenarios = SCENARIOS[difficulty as keyof typeof SCENARIOS];
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) {
        return NextResponse.json({ error: "场景不存在" }, { status: 404 });
      }

      const systemPrompt = buildSystemPrompt(scenario, difficulty, scenario.initialAnger, 1);
      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: "开始吧，请先说一句话表达你的生气" },
      ];

      let aiResponse = "";
      try {
        const config = new Config();
        const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
        const client = new LLMClient(config, customHeaders);

        for await (const chunk of client.stream(messages, { temperature: 0.8 })) {
          if (chunk.content) {
            aiResponse += chunk.content.toString();
          }
        }
        // 清理回复，移除任何括号内容
        aiResponse = aiResponse.replace(/[（(][^）)]*[）)]/g, "").trim();
      } catch (error) {
        console.error("LLM API Error:", error);
        // 使用模拟回复
        aiResponse = getRandomReply(SIMULATED_REPLIES.start);
      }

      return NextResponse.json({
        scenario,
        difficulty,
        maxRounds: ROUND_LIMITS[difficulty as keyof typeof ROUND_LIMITS],
        aiMessage: aiResponse,
        currentAnger: scenario.initialAnger,
        currentRound: 1,
        emotionReaction: "她生气地开口了...",
      });
    }

    // 继续对话
    if (action === "chat") {
      const scenarios = SCENARIOS[difficulty as keyof typeof SCENARIOS];
      const scenario = scenarios.find((s) => s.id === scenarioId);
      if (!scenario) {
        return NextResponse.json({ error: "场景不存在" }, { status: 404 });
      }

      // 分析用户输入，计算好感度变化
      const angerChange = analyzeUserMessage(userMessage);
      
      // 获取情绪反应
      const emotionReaction = getEmotionReaction(angerChange, currentAnger);
      
      // 构建对话历史
      const dialogueHistory = conversationHistory
        .filter((msg: { role: string }) => msg.role !== "system")
        .map((msg: { content: string }) => msg.content)
        .join("\n");

      const systemPrompt = buildSystemPrompt(scenario, difficulty, currentAnger + angerChange, currentRound + 1);
      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `之前的对话：\n${dialogueHistory}\n\n她说："${userMessage}"\n\n现在轮到你回复了` },
      ];

      let aiResponse = "";
      try {
        const config = new Config();
        const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
        const client = new LLMClient(config, customHeaders);

        for await (const chunk of client.stream(messages, { temperature: 0.8 })) {
          if (chunk.content) {
            aiResponse += chunk.content.toString();
          }
        }
        // 清理回复
        aiResponse = aiResponse.replace(/[（(][^）)]*[）)]/g, "").trim();
      } catch (error) {
        console.error("LLM API Error:", error);
        // 根据好感度变化选择模拟回复
        if (angerChange < -5) {
          aiResponse = getRandomReply(SIMULATED_REPLIES.chat.positive);
        } else if (angerChange > 5) {
          aiResponse = getRandomReply(SIMULATED_REPLIES.chat.negative);
        } else {
          aiResponse = getRandomReply(SIMULATED_REPLIES.chat.neutral);
        }
      }
      
      const newAnger = Math.max(0, Math.min(100, currentAnger + angerChange));
      const nextRound = currentRound + 1;
      const maxRounds = ROUND_LIMITS[difficulty as keyof typeof ROUND_LIMITS];

      // 判断游戏是否结束
      let gameOver = false;
      let result: "success" | "fail" | null = null;
      let review: ReturnType<typeof generateReview> | null = null;

      if (newAnger <= 0) {
        gameOver = true;
        result = "success";
      } else if (nextRound > maxRounds) {
        gameOver = true;
        result = "fail";
      }

      // 生成复盘
      if (gameOver && userMessages && angerChanges) {
        review = generateReview(userMessages, angerChanges);
      }

      return NextResponse.json({
        aiMessage: aiResponse,
        currentAnger: newAnger,
        currentRound: nextRound,
        angerChange,
        emotionReaction,
        gameOver,
        result,
        maxRounds,
        review,
      });
    }

    // 获取场景列表
    if (action === "list") {
      return NextResponse.json({
        scenarios: SCENARIOS,
        roundLimits: ROUND_LIMITS,
      });
    }

    return NextResponse.json({ error: "无效的操作" }, { status: 400 });
  } catch (error) {
    console.error("LLM API Error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
