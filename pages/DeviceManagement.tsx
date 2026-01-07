import React, { useState } from 'react';
import { LayoutDashboard, Monitor, BookOpen } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { ContentManagement } from './ContentManagement';
import { DeviceControl } from './DeviceControl';

// Main Export with Tabs
export const DeviceManagement: React.FC = () => {
    // Change default activeTab to 'overview'
    const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'content'>('overview');

    return (
        <div className="flex flex-col h-full">
            <div className="flex bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500'}`}
                >
                    <LayoutDashboard size={16} />
                    数据总览
                    {activeTab === 'overview' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('devices')}
                    className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'devices' ? 'text-blue-600' : 'text-slate-500'}`}
                >
                    <Monitor size={16} />
                    设备管控
                    {activeTab === 'devices' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'content' ? 'text-blue-600' : 'text-slate-500'}`}
                >
                    <BookOpen size={16} />
                    内容管理
                    {activeTab === 'content' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
                </button>
            </div>
            
            <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
                {activeTab === 'overview' && <div className="h-full overflow-y-auto no-scrollbar"><Dashboard /></div>}
                {activeTab === 'devices' && <DeviceControl />}
                {activeTab === 'content' && <ContentManagement />}
            </div>
        </div>
    );
};