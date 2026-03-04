'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // 导航链接配置
  const navLinks = [
    { href: '/', label: '📸 故事卡片', active: pathname === '/' },
    { href: '/video-prompt', label: '🎬 视频提示词', active: pathname === '/video-prompt' },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            AI 创作工坊
          </span>
        </Link>

        {/* 导航标签 */}
        <nav className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                link.active
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 用户区域 */}
        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </header>
  );
}
