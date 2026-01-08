import React, { useState, useEffect } from 'react';
import { FileText, Ruler, Hammer, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoomArchive } from './RoomArchive';
import { RoomMeasure } from './RoomMeasure';
import { RoomInstall } from './RoomInstall';
import { useApp } from '../../context/AppContext';

export const RoomManagement: React.FC = () => {
  const { userRole, setHeaderRightAction } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'archive' | 'measure' | 'install'>('archive');

  // Define available tabs based on role
  // Hardware (Project Manager): all
  // Local (Install Engineer): measure, install
  // Ops Manager: measure, install
  // Business Manager: measure, install
  // Artist: install
  // Area Manager / Assistant: archive, install
  // Admin / Product Director: all
  const availableTabs = React.useMemo(() => {
      switch (userRole) {
          case 'local': // Install Engineer
          case 'ops_manager':
          case 'business_manager':
              return ['measure', 'install'];
          case 'artist':
              return ['install'];
          case 'area_manager':
          case 'area_assistant':
              return ['archive', 'install'];
          case 'admin':
          case 'product_director':
          case 'hardware': // Project Manager
              return ['archive', 'measure', 'install'];
          default:
              return ['archive', 'measure', 'install'];
      }
  }, [userRole]);

  // Ensure active tab is valid for role
  useEffect(() => {
      if (!availableTabs.includes(activeTab)) {
          setActiveTab(availableTabs[0] as any);
      }
  }, [userRole, availableTabs, activeTab]);

  // Set Header Right Action (Info Icon)
  useEffect(() => {
      setHeaderRightAction(
          <button 
            onClick={() => navigate('/room-guide')}
            className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-100"
            title="查看安装复尺流程说明"
          >
              <Info size={20} />
          </button>
      );
      // Cleanup on unmount
      return () => setHeaderRightAction(null);
  }, [setHeaderRightAction, navigate]);

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