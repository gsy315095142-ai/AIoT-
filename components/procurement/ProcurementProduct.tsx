import React from 'react';
import { Package } from 'lucide-react';

export const ProcurementProduct: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <Package size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">货物建档功能模块</p>
        <p className="text-xs opacity-60 mt-2">管理采购物料库</p>
    </div>
  );
};