import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export const runtime = "nodejs";

// 获取排行榜
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // 按用户最高分数排名，每个用户只显示最高分那一条记录
    const { data, error } = await supabase
      .from("game_records")
      .select(`
        id,
        final_score,
        scenario,
        played_at,
        users:user_id (id, username)
      `)
      .eq("result", "win")  // 只显示通关记录
      .order("final_score", { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`查询失败: ${error.message}`);
    }

    // 按用户分组，每用户只取最高分记录
    const userBestScores: Record<number, {
      id: number;
      userId: number;
      username: string;
      finalScore: number;
      scenario: string;
      playedAt: string;
    }> = {};

    (data || []).forEach((record: { id: number; final_score: number; scenario: string; played_at: string; users: { id: number; username: string } | null }) => {
      if (record.users) {
        const userId = record.users.id;
        if (!userBestScores[userId] || record.final_score > userBestScores[userId].finalScore) {
          userBestScores[userId] = {
            id: record.id,
            userId,
            username: record.users.username,
            finalScore: record.final_score,
            scenario: record.scenario,
            playedAt: record.played_at,
          };
        }
      }
    });

    // 转为数组并按分数排序
    const leaderboard = Object.values(userBestScores)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 20)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    return NextResponse.json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error("获取排行榜失败:", error);
    return NextResponse.json(
      { error: "获取排行榜失败" },
      { status: 500 }
    );
  }
}
