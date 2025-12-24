import React, { useState } from 'react';
import { Package, ShoppingBag, TrendingUp } from 'lucide-react';
import { ProcurementProduct } from '../components/procurement/ProcurementProduct';
import { ProcurementOrder } from '../components/procurement/ProcurementOrder';
import { ProcurementProgress } from '../components/procurement/ProcurementProgress';

export const ProcurementManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'product' | 'order' | 'progress'>('product');

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex bg-white border-b border-slate-200 sticky top-0 z-10">
        <button
          onClick={() => setActiveTab('product')}
          className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'product' ? 'text-blue-600' : 'text-slate-500'}`}
        >
            <Package size={16} />
            货物建档
            {activeTab === 'product' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
        </button>
        <button
          onClick={() => setActiveTab('order')}
          className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'order' ? 'text-blue-600' : 'text-slate-500'}`}
        >
            <ShoppingBag size={16} />
            内部下单
            {activeTab === 'order' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'progress' ? 'text-blue-600' : 'text-slate-500'}`}
        >
            <TrendingUp size={16} />
            采购进度
            {activeTab === 'progress' && <div className="absolute bottom-0 w-full h-0.5 bg-blue-600"></div>}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 bg-slate-50 pb-20">
         {activeTab === 'product' && <ProcurementProduct />}
         {activeTab === 'order' && <ProcurementOrder />}
         {activeTab === 'progress' && <ProcurementProgress />}
      </div>
    </div>
  );
};