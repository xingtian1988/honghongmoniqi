import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export const runtime = "nodejs";

// 保存游戏记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, scenario, finalScore, result } = body;

    if (!userId || !scenario || finalScore === undefined || !result) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("game_records")
      .insert({
        user_id: userId,
        scenario,
        final_score: finalScore,
        result,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`保存失败: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      record: data,
    });
  } catch (error) {
    console.error("保存游戏记录失败:", error);
    return NextResponse.json(
      { error: "保存游戏记录失败" },
      { status: 500 }
    );
  }
}

// 获取游戏记录列表
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "缺少用户ID" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("game_records")
      .select(`
        id,
        scenario,
        final_score,
        result,
        played_at,
        users:user_id (username)
      `)
      .eq("user_id", parseInt(userId))
      .order("played_at", { ascending: false });

    if (error) {
      throw new Error(`查询失败: ${error.message}`);
    }

    // 格式化数据
    const records = (data || []).map((record: { id: number; scenario: string; final_score: number; result: string; played_at: string; users: { username: string } | null }) => ({
      id: record.id,
      scenario: record.scenario,
      finalScore: record.final_score,
      result: record.result,
      playedAt: record.played_at,
      username: record.users?.username,
    }));

    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error("获取游戏记录失败:", error);
    return NextResponse.json(
      { error: "获取游戏记录失败" },
      { status: 500 }
    );
  }
}
