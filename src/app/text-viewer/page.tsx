'use client';

import { Suspense } from 'react';
import TextViewerContent from './TextViewerContent';

function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse text-4xl mb-4">📄</div>
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  );
}

export default function TextViewerPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TextViewerContent />
    </Suspense>
  );
}
