import React from 'react';
import { BookOpen } from 'lucide-react';

export const ContentManagement: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
        <BookOpen size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">内容管理</p>
        <p className="text-xs opacity-60 mt-1">暂未开放敬请期待</p>
    </div>
);
