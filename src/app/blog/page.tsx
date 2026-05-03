"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface BlogPost {
  id: number;
  title: string;
  summary: string;
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/blog");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPosts(data.posts || []);
    } catch (err) {
      setError("加载文章失败，请稍后重试");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // 刷新列表
      await fetchPosts();
    } catch (err) {
      alert("生成文章失败，请稍后重试");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <span>←</span>
            <span>返回首页</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">💕 恋爱攻略</h1>
          <p className="text-white/80">
            教你谈恋爱的干货技巧，让感情甜蜜升温
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Generate Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                AI 创作中...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                ✨ 让 AI 写一篇
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无文章，点击上方按钮让 AI 创作一篇
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-500 text-sm mb-3">{post.summary}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{formatDate(post.created_at)}</span>
                  <span>阅读时长 2 分钟</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
