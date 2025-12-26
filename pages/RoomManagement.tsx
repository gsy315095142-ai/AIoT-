import React, { useState, useEffect } from 'react';
import { FileText, Ruler, Hammer } from 'lucide-react';
import { RoomArchive } from '../components/room/RoomArchive';
import { RoomMeasure } from '../components/room/RoomMeasure';
import { RoomInstall } from '../components/room/RoomInstall';
import { useApp } from '../context/AppContext';

export const RoomManagement: React.FC = () => {
  const { userRole } = useApp();
  const [activeTab, setActiveTab] = useState<'archive' | 'measure' | 'install'>('archive');

  // Define available tabs based on role
  // Hardware: all
  // Local: measure, install
  // Admin: all
  const availableTabs = React.useMemo(() => {
      if (userRole === 'local') return ['measure', 'install'];
      return ['archive', 'measure', 'install'];
  }, [userRole]);

  // Ensure active tab is valid for role
  useEffect(() => {
      if (!availableTabs.includes(activeTab)) {
          setActiveTab(availableTabs[0] as any);
      }
  }, [userRole, availableTabs, activeTab]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab Navigation - Fixed/Non-scrolling part */}
      <div className="flex bg-white border-b border-slate-200 shrink-0 z-10 shadow-sm">
        {availableTabs.includes('archive') && (
            <button
            onClick={() => setActiveTab('archive')}
            className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'archive' ? 'text-blue-600' : 'text-slate-500'}`}
            >
                <FileText size={16} />
                客房建档
                {activeTab === 'archive' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
        )}
        {availableTabs.includes('measure') && (
            <button
            onClick={() => setActiveTab('measure')}
            className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'measure' ? 'text-blue-600' : 'text-slate-500'}`}
            >
                <Ruler size={16} />
                客房复尺
                {activeTab === 'measure' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
        )}
        {availableTabs.includes('install') && (
            <button
            onClick={() => setActiveTab('install')}
            className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'install' ? 'text-blue-600' : 'text-slate-500'}`}
            >
                <Hammer size={16} />
                客房安装
                {activeTab === 'install' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
        )}
      </div>

      {/* Content - No padding, no scroll here. Children handle it. */}
      <div className="flex-1 bg-slate-50 overflow-hidden relative">
         {activeTab === 'archive' && <RoomArchive />}
         {activeTab === 'measure' && <RoomMeasure />}
         {activeTab === 'install' && <RoomInstall />}
      </div>
    </div>
  );
};