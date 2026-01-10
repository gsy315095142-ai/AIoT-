import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Wrench, ClipboardCheck, MessageSquareWarning, UserCheck, ShieldCheck, Database } from 'lucide-react';

const STEPS = [
    {
        title: '设备入库',
        desc: '通过采购订单自动入库，或管理员手动录入设备信息（SN/MAC）。',
        roles: ['采购人员', '总经理（管理员）'],
        icon: Database,
        color: 'text-blue-600 bg-blue-50'
    },
    {
        title: '状态变更申请',
        desc: '申请变更设备运维状态（如：转维修、转客诉、报废等）。',
        roles: ['安装运维经理', '项目经理'],
        icon: Wrench,
        color: 'text-orange-600 bg-orange-50'
    },
    {
        title: '状态变更审核',
        desc: '审核运维状态变更申请，确认后生效。',
        roles: ['总经理（管理员）', '硬件产品总监'],
        icon: ShieldCheck,
        color: 'text-red-600 bg-red-50'
    },
    {
        title: '巡检报告提交',
        desc: '现场对设备进行巡检，提交合格/不合格报告及凭证。',
        roles: ['安装运维经理', '安装实施工程师'],
        icon: ClipboardCheck,
        color: 'text-cyan-600 bg-cyan-50'
    },
    {
        title: '巡检报告审核',
        desc: '审核巡检结果，确认设备健康状况。',
        roles: ['总经理（管理员）', '硬件产品总监'],
        icon: UserCheck,
        color: 'text-indigo-600 bg-indigo-50'
    },
    {
        title: '设备反馈/报修',
        desc: '提交设备故障或使用问题反馈。',
        roles: ['所有角色'],
        icon: MessageSquareWarning,
        color: 'text-purple-600 bg-purple-50'
    },
    {
        title: '反馈处理',
        desc: '指派人员进行远程或上门处理，记录处理过程。',
        roles: ['安装实施工程师', '硬件产品总监', '指定负责人'],
        icon: Wrench,
        color: 'text-green-600 bg-green-50'
    }
];

export const DeviceProcessGuidePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
                <button 
                    onClick={() => navigate('/devices', { state: { activeTab: 'overview' } })}
                    className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-slate-800">资产管理流程说明</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-6 relative pb-10">
                    {/* Vertical Line */}
                    <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-slate-200 -z-0"></div>

                    {STEPS.map((step, idx) => (
                        <div key={idx} className="flex gap-4 relative z-10 animate-fadeIn" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-50 shadow-sm shrink-0 ${step.color}`}>
                                <step.icon size={18} />
                            </div>
                            <div className="flex-1 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-800 text-sm">
                                        {idx + 1}. {step.title}
                                    </h4>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                                    {step.desc}
                                </p>
                                <div className="flex gap-1 flex-wrap">
                                    {step.roles.map(role => (
                                        <span key={role} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 font-medium">
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};