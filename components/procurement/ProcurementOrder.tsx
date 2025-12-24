import React from 'react';
import { ShoppingBag } from 'lucide-react';

export const ProcurementOrder: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <ShoppingBag size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">内部下单功能模块</p>
        <p className="text-xs opacity-60 mt-2">发起新的采购申请</p>
    </div>
  );
};