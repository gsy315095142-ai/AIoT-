import React, { useState } from 'react';
import { X, CheckCircle, Package, Truck, ClipboardList, User } from 'lucide-react';

interface OrderProcessGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

const STEPS = [
    {
        title: '选购下单',
        desc: '项目经理/业务经理浏览商品，选择租赁或购买模式，确认数量并提交订单。',
        roles: ['项目经理', '业务经理'],
        icon: ClipboardList,
        color: 'text-blue-600 bg-blue-50'
    },
    {
        title: '确认订单',
        desc: '系统自动生成订单，通知采购部门。采购人员确认需求详情。',
        roles: ['系统自动'],
        icon: CheckCircle,
        color: 'text-indigo-600 bg-indigo-50'
    },
    {
        title: '备货/打包',
        desc: '采购人员准备货物，上传备货清单照片及打包发货照片，确保货物无误。',
        roles: ['采购人员', '管理员'],
        icon: Package,
        color: 'text-orange-600 bg-orange-50'
    },
    {
        title: '出库审核',
        desc: '对于涉及外观效果的物料/设备，需美术人员或产品总监进行出库前的外观审核。',
        roles: ['美术人员', '产品总监'],
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
        roles: ['实施工程师', '项目经理', '业务经理'],
        icon: CheckCircle,
        color: 'text-green-600 bg-green-50'
    }
];

export const OrderProcessGuide: React.FC<OrderProcessGuideProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <ClipboardList size={20} className="text-blue-600" />
                        订单管理流程说明
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[38px] top-5 bottom-5 w-0.5 bg-slate-100 -z-0"></div>

                    <div className="space-y-6">
                        {STEPS.map((step, idx) => (
                            <div key={idx} className="flex gap-4 relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0 ${step.color}`}>
                                    <step.icon size={18} />
                                </div>
                                <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-800 text-sm">
                                            {idx + 1}. {step.title}
                                        </h4>
                                        <div className="flex gap-1 flex-wrap justify-end">
                                            {step.roles.map(role => (
                                                <span key={role} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        我已了解
                    </button>
                </div>
            </div>
        </div>
    );
};