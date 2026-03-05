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
    { href: '/', label: '故事卡片', emoji: '📸' },
    { href: '/video-prompt', label: '视频提示词', emoji: '🎬' },
    { href: '/video-generator', label: '视频生成', emoji: '🎥' },
  ];

  return (
    <header className="glass border-b border-purple-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-3xl group-hover:animate-bounce-gentle">✨</span>
            <div>
              <span className="text-xl font-bold text-gradient">AI 创作工坊</span>
              <p className="text-xs text-gray-500 hidden sm:block">让创意无限流动</p>
            </div>
          </Link>

          {/* 导航标签 */}
          <nav className="flex items-center">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    relative px-4 py-2 text-sm font-medium transition-all duration-300
                    ${isActive 
                      ? 'text-purple-600' 
                      : 'text-gray-600 hover:text-purple-500'
                    }
                    ${index === 0 ? 'pr-2' : ''}
                    ${index === navLinks.length - 1 ? 'pl-2' : ''}
                  `}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`text-lg ${isActive ? 'animate-bounce-gentle' : ''}`}>
                      {link.emoji}
                    </span>
                    <span className="hidden sm:inline">{link.label}</span>
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 用户区域 */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm hidden sm:inline">加载中...</span>
              </div>
            ) : user ? (
              <>
                {/* 历史记录 */}
                <Link
                  href="/history"
                  className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all"
                  title="历史记录"
                >
                  📜
                </Link>

                {/* 用户信息 */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-1.5 rounded-full border border-purple-100">
                  <span className="text-purple-600 font-medium text-sm hidden sm:inline">
                    {user.username}
                  </span>
                  <span className="text-gray-200 hidden sm:inline">|</span>
                  <span className="flex items-center gap-1 text-sm">
                    <span className="animate-pulse">🪙</span>
                    <span className="font-bold text-gradient">{user.points}</span>
                  </span>
                </div>

                {/* 登出 */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="登出"
                >
                  🚪
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="btn-gradient px-5 py-2 text-white font-medium rounded-full text-sm"
              >
                ✨ 开始创作
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
