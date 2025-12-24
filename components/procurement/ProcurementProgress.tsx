import React from 'react';
import { TrendingUp } from 'lucide-react';

export const ProcurementProgress: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <TrendingUp size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">采购进度功能模块</p>
        <p className="text-xs opacity-60 mt-2">查看物流与审批状态</p>
    </div>
  );
};