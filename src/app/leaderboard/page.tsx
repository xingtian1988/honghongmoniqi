"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface LeaderboardItem {
  rank: number;
  id: number;
  userId: number;
  username: string;
  finalScore: number;
  scenario: string;
  playedAt: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 获取当前登录用户ID
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.id) {
          setCurrentUserId(parsed.id);
        }
      } catch {
        // ignore
      }
    }

    // 获取排行榜数据
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: "🥇", color: "text-yellow-500" };
      case 2:
        return { icon: "🥈", color: "text-gray-400" };
      case 3:
        return { icon: "🥉", color: "text-amber-600" };
      default:
        return { icon: `#${rank}`, color: "text-gray-500" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 排行榜</h1>
          <p className="text-gray-500">看看谁是最会哄人的情场高手</p>
        </div>

        {/* 排行榜内容 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎮</div>
              <p className="text-gray-500 mb-4">还没有玩家上榜</p>
              <p className="text-gray-400 text-sm mb-6">完成一局游戏就能上榜啦！</p>
              <Link
                href="/"
                className="inline-block px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                立即游戏
              </Link>
            </div>
          ) : (
            <>
              {/* 表头 */}
              <div className="bg-pink-50 px-4 py-3 grid grid-cols-12 gap-2 text-sm font-medium text-gray-600">
                <div className="col-span-2 text-center">排名</div>
                <div className="col-span-4">玩家</div>
                <div className="col-span-3 text-center">最高分</div>
                <div className="col-span-3 text-center">达成时间</div>
              </div>

              {/* 排行榜列表 */}
              <div className="divide-y">
                {leaderboard.map((item) => {
                  const { icon, color } = getRankIcon(item.rank);
                  const isCurrentUser = item.userId === currentUserId;

                  return (
                    <div
                      key={item.id}
                      className={`px-4 py-4 grid grid-cols-12 gap-2 items-center ${
                        isCurrentUser
                          ? "bg-pink-50 border-l-4 border-pink-500"
                          : ""
                      }`}
                    >
                      {/* 排名 */}
                      <div className={`col-span-2 text-center font-bold ${color}`}>
                        <span className="text-xl">{icon}</span>
                      </div>

                      {/* 用户名 */}
                      <div className="col-span-4">
                        <div className="font-medium text-gray-800">
                          {item.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-pink-500">(我)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{item.scenario}</div>
                      </div>

                      {/* 最高分 */}
                      <div className="col-span-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 to-red-500 text-white px-3 py-1 rounded-full font-bold">
                          {item.finalScore}
                        </div>
                      </div>

                      {/* 达成时间 */}
                      <div className="col-span-3 text-center text-sm text-gray-500">
                        {new Date(item.playedAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 说明 */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>排行榜显示每位玩家的最高通关分数</p>
          <p className="mt-1">只有成功通关的记录才会被计入</p>
        </div>

        {/* 返回按钮 */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-2 text-pink-500 hover:text-pink-600 transition-colors"
          >
            ← 返回游戏
          </Link>
        </div>
      </div>
    </div>
  );
}
