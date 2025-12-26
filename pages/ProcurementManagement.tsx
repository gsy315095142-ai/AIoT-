import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, TrendingUp } from 'lucide-react';
import { ProcurementProduct } from '../components/procurement/ProcurementProduct';
import { ProcurementOrder } from '../components/procurement/ProcurementOrder';
import { ProcurementProgress } from '../components/procurement/ProcurementProgress';
import { useApp } from '../context/AppContext';

export const ProcurementManagement: React.FC = () => {
  const { userRole } = useApp();
  const [activeTab, setActiveTab] = useState<'product' | 'order' | 'progress'>('product');

  // Define available tabs based on role
  // Hardware (Project Manager): order, progress
  // Procurement: product, progress
  // Business Manager: order, progress
  // Ops Manager / Artist / Area Manager / Assistant / Local (Install Engineer): progress
  // Admin / Product Director: all
  const availableTabs = React.useMemo(() => {
      switch (userRole) {
          case 'hardware': // Project Manager
              return ['order', 'progress'];
          case 'procurement':
              return ['product', 'progress'];
          case 'business_manager':
              return ['order', 'progress'];
          case 'ops_manager':
          case 'artist':
          case 'area_manager':
          case 'area_assistant':
          case 'local':
              return ['progress'];
          case 'admin':
          case 'product_director':
              return ['product', 'order', 'progress'];
          default:
              return ['product', 'order', 'progress'];
      }
  }, [userRole]);

  // Ensure active tab is valid for role
  useEffect(() => {
      if (!availableTabs.includes(activeTab)) {
          setActiveTab(availableTabs[0] as any);
      }
  }, [userRole, availableTabs, activeTab]);

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex bg-white border-b border-slate-200 sticky top-0 z-10">
        {availableTabs.includes('product') && (
            <button
            onClick={() => setActiveTab('product')}
            className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'product' ? 'text-blue-600' : 'text-slate-500'}`}
            >
                <Package size={16} />
                货物建档
                {activeTab === 'product' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
        )}
        {availableTabs.includes('order') && (
            <button
            onClick={() => setActiveTab('order')}
            className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'order' ? 'text-blue-600' : 'text-slate-500'}`}
            >
                <ShoppingBag size={16} />
                内部下单
                {activeTab === 'order' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
        )}
        {availableTabs.includes('progress') && (
            <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'progress' ? 'text-blue-600' : 'text-slate-500'}`}
            >
                <TrendingUp size={16} />
                采购进度
                {activeTab === 'progress' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 bg-slate-50 pb-20 overflow-hidden flex flex-col">
         {activeTab === 'product' && <div className="p-4 h-full overflow-hidden flex flex-col"><ProcurementProduct /></div>}
         {activeTab === 'order' && <div className="h-full overflow-hidden flex flex-col"><ProcurementOrder /></div>}
         {activeTab === 'progress' && <div className="p-4 h-full overflow-hidden flex flex-col"><ProcurementProgress /></div>}
      </div>
    </div>
  );
};