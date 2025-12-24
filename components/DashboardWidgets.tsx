import React from 'react';
import { LucideIcon } from 'lucide-react';

// Custom Tick Component for X-Axis to handle multi-line labels (Week + Date Range)
export const CustomXAxisTick = ({ x, y, payload }: any) => {
    const val = payload.value;
    // Check if value contains a space (our delimiter for Week + Range)
    if (typeof val === 'string' && val.includes(' ')) {
        const [line1, line2] = val.split(' ');
        return (
            <g transform={`translate(${x},${y})`}>
                <text x={0} y={0} dy={10} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight="bold">{line1}</text>
                <text x={0} y={0} dy={22} textAnchor="middle" fill="#94a3b8" fontSize={8} transform="scale(0.9)">{line2}</text>
            </g>
        );
    }
    // For regular date labels, rotate them to avoid overlap
    return (
        <g transform={`translate(${x},${y})`}>
            <text 
                x={0} 
                y={0} 
                dy={16} 
                textAnchor="end" 
                fill="#64748b" 
                fontSize={10}
                transform="rotate(-45)"
            >
                {val}
            </text>
        </g>
    );
};

interface StatCardProps {
  label: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  colorClass: string;
  isRate?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, icon: Icon, colorClass, isRate = false }) => (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-24 relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-2 opacity-10 ${colorClass}`}>
            <Icon size={48} />
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase z-10">{label}</p>
        <div className="z-10">
            <span className={`text-2xl font-bold tracking-tight ${colorClass.replace('bg-', 'text-')}`}>
                {isRate ? value.toFixed(2) : value}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">{unit}</span>
        </div>
    </div>
);