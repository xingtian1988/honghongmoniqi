"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface GameRecord {
  id: number;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === "object" && parsed.id && parsed.username) {
          setUser(parsed);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/game-records?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setRecords(data.records);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  // 计算统计数据
  const totalGames = records.length;
  const winGames = records.filter((r) => r.result === "win").length;
  const winRate = totalGames > 0 ? Math.round((winGames / totalGames) * 100) : 0;
  const avgScore = totalGames > 0
    ? Math.round(records.reduce((sum, r) => sum + r.final_score, 0) / totalGames)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 用户信息 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{user?.username}</h1>
                <p className="text-gray-500 text-sm">开始日期: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-pink-500">{totalGames}</div>
            <div className="text-sm text-gray-500">总场次</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{winRate}%</div>
            <div className="text-sm text-gray-500">胜率</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">{avgScore}</div>
            <div className="text-sm text-gray-500">平均好感度</div>
          </div>
        </div>

        {/* 游戏记录列表 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">游戏记录</h2>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎮</div>
              <p className="text-gray-500 mb-4">还没有游戏记录</p>
              <Link
                href="/"
                className="inline-block px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                开始游戏
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        record.result === "win"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {record.result === "win" ? "🎉" : "💔"}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{record.scenario}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(record.played_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold ${
                        record.result === "win" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {record.result === "win" ? "通关" : "失败"}
                    </div>
                    <div className="text-sm text-gray-500">
                      好感度: {record.final_score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
