'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === "object" && parsed.username) {
          setUsername(parsed.username);
        } else {
          // 如果是旧版本的普通字符串格式
          setUsername(storedUser);
        }
      } catch {
        // 如果不是有效的 JSON，假设它是旧版本的字符串格式
        setUsername(storedUser);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUsername(null);
    router.push('/');
  };

  if (!isMounted) {
    return null;
  }

  return (
    <nav className="bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold hover:opacity-90">
          💕 哄哄模拟器
        </Link>
        
        <div className="flex items-center gap-4">
          {username ? (
            <>
              <Link
                href="/profile"
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-all"
              >
                个人中心
              </Link>
              <span className="text-sm opacity-90">
                欢迎，{username}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-all"
              >
                退出登录
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-all"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 bg-white text-pink-600 hover:bg-white/90 rounded-full text-sm font-medium transition-all"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
