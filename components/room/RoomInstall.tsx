import React from 'react';
import { Hammer } from 'lucide-react';

export const RoomInstall: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <Hammer size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">客房安装功能模块</p>
        <p className="text-xs opacity-60 mt-2">在此处跟进安装施工进度</p>
    </div>
  );
};