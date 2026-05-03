"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";

interface BlogPost {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/blog/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPost(data.post);
    } catch (err) {
      setError("加载文章失败，请稍后重试");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 将 markdown 风格的文本转换为简单的 HTML
  const renderContent = (content: string) => {
    return content
      .split("\n")
      .map((line, index) => {
        // 标题
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <h3 key={index} className="text-lg font-semibold text-gray-800 mt-4 mb-2">
              {line.replace(/\*\*/g, "")}
            </h3>
          );
        }
        // 加粗文本
        if (line.includes("**")) {
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={index} className="text-gray-600 leading-relaxed mb-3">
              {parts.map((part, i) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={i} className="text-gray-800">
                    {part.replace(/\*\*/g, "")}
                  </strong>
                ) : (
                  part
                )
              )}
            </p>
          );
        }
        // 空行
        if (!line.trim()) {
          return <div key={index} className="h-2" />;
        }
        // 普通文本
        return (
          <p key={index} className="text-gray-600 leading-relaxed mb-3">
            {line}
          </p>
        );
      });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-pink-500 hover:text-pink-600 mb-4 transition-colors"
          >
            <span>←</span>
            <span>返回攻略列表</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : post ? (
          <article className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 pb-6 border-b border-gray-100">
              <span>{formatDate(post.created_at)}</span>
              <span>阅读时长 2 分钟</span>
            </div>

            {/* Content */}
            <div className="prose prose-pink max-w-none">
              {renderContent(post.content)}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                🎮 去游戏中练习
              </Link>
            </div>
          </article>
        ) : (
          <div className="text-center py-12 text-gray-500">文章不存在</div>
        )}
      </div>
    </div>
  );
}
