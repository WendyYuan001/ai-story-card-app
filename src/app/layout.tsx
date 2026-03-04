import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: "AI 故事卡片 - 让每张照片都有故事",
  description: "上传照片，AI 自动识别并生成精彩故事，制作精美的分享卡片",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#667eea",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AI 故事卡片",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
