import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { getLLMClient } from "@/storage/database/llm";

export const runtime = "nodejs";

// 自动生成文章并保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const customTopic = body.topic;

    const supabase = getSupabaseClient();
    const client = getLLMClient();

    // 生成文章主题
    const topics = [
      "如何用一句话化解冷战",
      "异地恋保持甜蜜的秘诀",
      "另一半生气时的正确应对方式",
      "让感情升温的日常小动作",
      "恋爱中的沟通技巧",
      "如何给伴侣安全感",
      "处理吵架的正确姿势",
      "让对方心动的瞬间",
    ];

    const topic = customTopic || topics[Math.floor(Math.random() * topics.length)];

    // 调用 LLM 生成文章
    const prompt = `你是一位情感专栏作家，请为"哄哄模拟器"写一篇恋爱沟通技巧文章。

要求：
1. 主题：${topic}
2. 风格轻松幽默，像朋友聊天
3. 字数：300-500字
4. 包含具体可操作的建议
5. 用一些emoji增加趣味性
6. 结构：开头引人入胜 → 中间干货分享 → 结尾金句总结

请直接输出文章内容，不要加标题（标题用"标题："前缀，摘要用"摘要："前缀，正文用"正文："前缀）`;

    const messages = [{ role: "user" as const, content: prompt }];
    
    let fullContent = "";
    for await (const chunk of client.stream(messages, { temperature: 0.8 })) {
      if (chunk.content) {
        fullContent += chunk.content.toString();
      }
    }

    // 解析文章内容
    let title = "";
    let summary = "";
    let content = "";

    const titleMatch = fullContent.match(/标题[：:]\s*(.+)/);
    const summaryMatch = fullContent.match(/摘要[：:]\s*(.+)/);
    const contentMatch = fullContent.match(/正文[：:]\s*([\s\S]+)/);

    if (titleMatch) title = titleMatch[1].trim();
    if (summaryMatch) summary = summaryMatch[1].trim();
    if (contentMatch) content = contentMatch[1].trim();

    // 如果解析失败，使用默认格式
    if (!title || !content) {
      title = topic;
      summary = `本文探讨了${topic}的实用技巧，帮助你更好地处理恋爱关系中的各种问题。`;
      content = fullContent;
    }

    // 保存到数据库
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title,
        summary,
        content,
      })
      .select("id, title, summary, created_at")
      .single();

    if (error) {
      throw new Error(`保存失败: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      post: data,
    });
  } catch (err) {
    console.error("生成文章失败:", err);
    return NextResponse.json(
      { error: "生成文章失败" },
      { status: 500 }
    );
  }
}
