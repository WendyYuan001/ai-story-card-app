'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  // 装饰动画
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; left: number; delay: number }[]>([]);
  
  useEffect(() => {
    const emojis = ['✨', '🎨', '📸', '🎬', '💡', '🚀', '💫', '🌟'];
    const items = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setFloatingEmojis(items);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isLogin 
        ? await login(username, password)
        : await register(username, password);

      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || '操作失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-fun min-h-screen relative overflow-hidden">
      {/* 装饰性背景 */}
      <div className="bg-decoration">
        <div className="bg-blob bg-blob-1" />
        <div className="bg-blob bg-blob-2" />
        <div className="bg-blob bg-blob-3" />
      </div>

      {/* 浮动表情 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute text-4xl animate-float opacity-20"
            style={{
              left: `${item.left}%`,
              top: '-50px',
              animationDelay: `${item.delay}s`,
              animationDuration: '10s',
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <span className="text-6xl animate-bounce-gentle inline-block">✨</span>
            </Link>
            <h1 className="text-3xl font-bold text-gradient mt-4">
              AI 创作工坊
            </h1>
            <p className="text-gray-600 mt-2">
              {isLogin ? '欢迎回来！继续你的创作之旅 🎨' : '加入我们，开启创意之旅 🚀'}
            </p>
          </div>

          {/* 表单卡片 */}
          <div className="bg-white rounded-3xl shadow-xl p-8 card-hover">
            {/* 标签切换 */}
            <div className="flex mb-6 bg-gray-100 rounded-full p-1">
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2 rounded-full font-medium transition-all ${
                  isLogin 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow' 
                    : 'text-gray-600'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2 rounded-full font-medium transition-all ${
                  !isLogin 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow' 
                    : 'text-gray-600'
                }`}
              >
                注册
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 用户名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👤 用户名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-0 transition-all text-gray-800"
                  placeholder="请输入用户名"
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>

              {/* 密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔐 密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-0 transition-all text-gray-800"
                  placeholder="请输入密码"
                  required
                  minLength={6}
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <span>😅</span>
                  <span>{error}</span>
                </div>
              )}

              {/* 注册提示 */}
              {!isLogin && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <span className="text-lg">🎉</span>
                  <span>注册成功赠送 <strong>1000 积分</strong>！</span>
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 btn-gradient text-white font-bold rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>处理中...</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? '🚀' : '✨'}</span>
                    <span>{isLogin ? '立即登录' : '立即注册'}</span>
                  </>
                )}
              </button>
            </form>

            {/* 返回首页 */}
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-gray-500 hover:text-purple-500 text-sm inline-flex items-center gap-1 transition-colors"
              >
                <span>←</span>
                <span>返回首页</span>
              </Link>
            </div>
          </div>

          {/* 底部提示 */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>💡 提示：用户名 3-20 字符，密码至少 6 位</p>
          </div>
        </div>
      </div>
    </div>
  );
}
