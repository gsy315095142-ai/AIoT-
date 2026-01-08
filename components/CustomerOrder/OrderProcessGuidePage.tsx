import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package, Truck, ClipboardList, User, ShieldCheck } from 'lucide-react';

const STEPS = [
    {
        title: '选购下单',
        desc: '项目经理/驻地业务经理浏览商品，选择租赁或购买模式，确认数量并提交订单。',
        roles: ['项目经理', '驻地业务经理'],
        icon: ClipboardList,
        color: 'text-blue-600 bg-blue-50'
    },
    {
        title: '确认订单',
        desc: '系统自动生成订单，通知采购部门。采购人员确认需求详情。',
        roles: ['采购人员'],
        icon: CheckCircle,
        color: 'text-indigo-600 bg-indigo-50'
    },
    {
        title: '备货/打包',
        desc: '采购人员准备货物，上传备货清单照片及打包发货照片，确保货物无误。',
        roles: ['采购人员', '总经理（管理员）'],
        icon: Package,
        color: 'text-orange-600 bg-orange-50'
    },
    {
        title: '出库审核',
        desc: '对于涉及外观效果的物料/设备，需美术人员或硬件产品总监进行出库前的外观审核。',
        roles: ['美术人员', '硬件产品总监'],
        icon: User,
        color: 'text-purple-600 bg-purple-50'
    },
    {
        title: '物流运输',
        desc: '采购人员填写物流单号，上传物流凭证（快递单照片）。',
        roles: ['采购人员'],
        icon: Truck,
        color: 'text-cyan-600 bg-cyan-50'
    },
    {
        title: '收货验货',
        desc: '现场实施人员或项目经理确认收到货物，验收无误后系统自动生成设备档案。如有破损可驳回。',
        roles: ['安装实施工程师', '项目经理', '驻地业务经理'],
        icon: ShieldCheck,
        color: 'text-green-600 bg-green-50'
    }
];

export const OrderProcessGuidePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-slate-800">订单管理流程说明</h1>
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