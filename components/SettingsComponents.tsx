import React from 'react';
import { LucideIcon, Trash2, LogOut, User } from 'lucide-react';

interface UserProfileCardProps {
    currentUser: string | null;
    onLogout: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ currentUser, onLogout }) => (
    <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-xl shadow-md border border-slate-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/50">
                <User size={20} />
            </div>
            <div>
                <p className="text-xs text-slate-300">当前用户</p>
                <p className="font-bold text-sm">{currentUser || 'Guest'}</p>
            </div>
        </div>
        <button 
            onClick={onLogout}
            className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs"
        >
            <LogOut size={14} />
            <span>退出</span>
        </button>
    </div>
);

interface ManagementSectionProps {
    title: string;
    icon: LucideIcon;
    iconColorClass: string; // e.g. "bg-blue-100 text-blue-600"
    children: React.ReactNode;
}

export const ManagementSection: React.FC<ManagementSectionProps> = ({ title, icon: Icon, iconColorClass, children }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
            <div className={`p-1.5 rounded-lg ${iconColorClass}`}>
                <Icon size={18} />
            </div>
            <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        </div>
        {children}
    </div>
);

interface ListItemProps {
    label: string;
    subLabel?: string;
    onDelete: () => void;
}

export const ListItem: React.FC<ListItemProps> = ({ label, subLabel, onDelete }) => (
    <li className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            {subLabel && <span className="text-[10px] text-slate-400">{subLabel}</span>}
        </div>
        <button 
            onClick={onDelete}
            className="text-slate-300 hover:text-red-500 transition-colors"
        >
            <Trash2 size={16} />
        </button>
    </li>
);