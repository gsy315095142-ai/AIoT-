import React, { useState } from 'react';
import { FileText, Ruler, Hammer } from 'lucide-react';

export const RoomManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'archive' | 'measure' | 'install'>('archive');

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex bg-white border-b border-slate-200 sticky top-0 z-10">
        <button
          onClick={() => setActiveTab('archive')}
          className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'archive' ? 'text-blue-600' : 'text-slate-500'}`}
        >
            <FileText size={16} />
            客房建档
            {activeTab === 'archive' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
        </button>
        <button
          onClick={() => setActiveTab('measure')}
          className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'measure' ? 'text-blue-600' : 'text-slate-500'}`}
        >
            <Ruler size={16} />
            客房复尺
            {activeTab === 'measure' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
        </button>
        <button
          onClick={() => setActiveTab('install')}
          className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'install' ? 'text-blue-600' : 'text-slate-500'}`}
        >
            <Hammer size={16} />
            客房安装
            {activeTab === 'install' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 bg-slate-50 pb-20">
         {activeTab === 'archive' && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px] text-slate-400">
                 <FileText size={48} className="mb-4 opacity-20" />
                 <p className="text-sm font-medium">客房建档功能模块</p>
                 <p className="text-xs opacity-60 mt-2">在此处管理房间基础信息</p>
             </div>
         )}
         {activeTab === 'measure' && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px] text-slate-400">
                 <Ruler size={48} className="mb-4 opacity-20" />
                 <p className="text-sm font-medium">客房复尺功能模块</p>
                 <p className="text-xs opacity-60 mt-2">在此处记录现场测量数据</p>
             </div>
         )}
         {activeTab === 'install' && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px] text-slate-400">
                 <Hammer size={48} className="mb-4 opacity-20" />
                 <p className="text-sm font-medium">客房安装功能模块</p>
                 <p className="text-xs opacity-60 mt-2">在此处跟进安装施工进度</p>
             </div>
         )}
      </div>
    </div>
  );
};