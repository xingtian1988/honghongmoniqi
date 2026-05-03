import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

export const runtime = "nodejs";

// 获取博客列表
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, summary, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`查询失败: ${error.message}`);
    }

    return NextResponse.json({ posts: data || [] });
  } catch (err) {
    console.error("获取博客列表失败:", err);
    return NextResponse.json(
      { error: "获取博客列表失败" },
      { status: 500 }
    );
  }
}
