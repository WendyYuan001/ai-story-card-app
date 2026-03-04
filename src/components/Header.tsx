'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              📸 AI 故事卡片
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              让每张照片都有一个精彩的故事
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/video-prompt"
            className="px-3 py-1.5 text-gray-600 hover:text-indigo-600 text-sm transition-colors"
          >
            🎬 视频提示词
          </Link>
          {loading ? (
            <span className="text-gray-400 text-sm">加载中...</span>
          ) : user ? (
            <>
              <Link
                href="/history"
                className="px-3 py-1.5 text-gray-600 hover:text-indigo-600 text-sm transition-colors"
              >
                📜 历史
              </Link>
              <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
                <span className="text-indigo-600 font-medium">{user.username}</span>
                <span className="text-gray-300">|</span>
                <span className="text-purple-600 font-bold">🪙 {user.points}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
              >
                登出
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
