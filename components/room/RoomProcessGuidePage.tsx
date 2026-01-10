import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Ruler, Hammer, ClipboardCheck, User, Users } from 'lucide-react';

const STEPS = [
    {
        title: '客房建档',
        desc: '创建门店信息，配置房型及对应测量/安装模块。',
        roles: ['总经理（管理员）', '项目经理'],
        icon: Store,
        color: 'text-blue-600 bg-blue-50'
    },
    {
        title: '发布复尺任务',
        desc: '发布针对特定门店的复尺任务，指定截止日期和负责人。',
        roles: ['项目经理'],
        icon: Ruler,
        color: 'text-cyan-600 bg-cyan-50'
    },
    {
        title: '复尺数据上传',
        desc: '现场人员根据要求拍摄并上传环境照片，填写尺寸数据。',
        roles: ['安装实施工程师', '安装运维经理'],
        icon: UploadIcon,
        color: 'text-purple-600 bg-purple-50'
    },
    {
        title: '复尺审核 (初审)',
        desc: '审核复尺数据完整性及准确性，确保无遗漏。',
        roles: ['安装运维经理'],
        icon: ClipboardCheck,
        color: 'text-orange-600 bg-orange-50'
    },
    {
        title: '复尺审核 (终审)',
        desc: '确认复尺方案可行性，通过后归档。',
        roles: ['驻地业务经理'],
        icon: ClipboardCheck,
        color: 'text-green-600 bg-green-50'
    },
    {
        title: '发布安装任务',
        desc: '货物到店后，发布安装任务，指定安装期限。',
        roles: ['项目经理'],
        icon: Hammer,
        color: 'text-indigo-600 bg-indigo-50'
    },
    {
        title: '安装实施/调试',
        desc: '执行安装步骤（预约、打卡、上传效果图、调试网络日志）。',
        roles: ['安装实施工程师'],
        icon: Hammer,
        color: 'text-pink-600 bg-pink-50'
    },
    {
        title: '安装审核 (多级)',
        desc: '依次进行初审(运维)、二审(美术)、三审(业务)、终审(区总)。',
        roles: ['安装运维经理', '美术人员', '驻地业务经理', '区大总'],
        icon: Users,
        color: 'text-red-600 bg-red-50'
    }
];

function UploadIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
    )
}

export const RoomProcessGuidePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
                <button 
                    onClick={() => navigate('/rooms')}
                    className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-slate-800">安装复尺流程说明</h1>
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