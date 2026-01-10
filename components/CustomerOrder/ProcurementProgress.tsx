import React, { useState } from 'react';
import { TrendingUp, Store, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Region } from '../../types';
import { InboundOrders } from './InboundOrders';
import { OutboundOrders } from './OutboundOrders';

export const ProcurementProgress: React.FC = () => {
  const { procurementOrders, regions, stores } = useApp();
  
  // State for Filters
  const [regionFilter, setRegionFilter] = useState('');
  
  // Tabs: Inbound vs Outbound
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');

  const getRegionLabel = (region: Region) => {
      // Basic count
      const count = procurementOrders.filter(o => {
          const store = stores.find(s => s.id === o.storeId);
          return store?.regionId === region.id;
      }).length;
      return `${region.name} (${count})`;
  };

  const getAllRegionsLabel = () => {
      const total = procurementOrders.length;
      return `全部大区 (总:${total})`;
  };

  return (
    <div className="h-full flex flex-col relative">
        {/* Header / Filter - Fixed at Top */}
        <div className="bg-white p-4 shrink-0 shadow-sm border-b border-slate-100 z-10">
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-3">
                <button 
                    onClick={() => setActiveTab('inbound')}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'inbound' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    入库订单
                </button>
                <button 
                    onClick={() => setActiveTab('outbound')}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'outbound' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    出库订单
                </button>
            </div>

            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Store size={12} /> 大区筛选
                </h3>
                <div className="relative w-32">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                    >
                        <option value="">{getAllRegionsLabel()}</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{getRegionLabel(r)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 relative">
            {activeTab === 'inbound' ? (
                <InboundOrders regionFilter={regionFilter} />
            ) : (
                <OutboundOrders regionFilter={regionFilter} />
            )}
        </div>
    </div>
  );
};