import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AuditStatus, AuditType } from '../../types';
import { AuditGate } from '../DeviceComponents';
import { ClipboardCheck, History, ArrowLeft, ChevronRight } from 'lucide-react';

export const DeviceAudit: React.FC = () => {
    const { auditRecords, approveAudit, rejectAudit } = useApp();
    const navigate = useNavigate();
    const [mainTab, setMainTab] = useState<'status' | 'inspection'>('status');
    const [subTab, setSubTab] = useState<'pending' | 'history'>('pending');
    
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const getFilteredRecords = () => {
        const typeFiltered = auditRecords.filter(r => 
            mainTab === 'status' ? r.type === AuditType.OPS_STATUS : r.type === AuditType.INSPECTION
        );
        return typeFiltered.filter(r => 
            subTab === 'pending' ? r.auditStatus === AuditStatus.PENDING : r.auditStatus !== AuditStatus.PENDING
        );
    };

    const displayRecords = getFilteredRecords();
    const pendingCountStatus = auditRecords.filter(r => r.type === AuditType.OPS_STATUS && r.auditStatus === AuditStatus.PENDING).length;
    const pendingCountInspection = auditRecords.filter(r => r.type === AuditType.INSPECTION && r.auditStatus === AuditStatus.PENDING).length;

    const handleRejectClick = (id: string) => {
        setRejectingId(id);
        setRejectReason('');
    };

    const confirmReject = () => {
        if (rejectingId && rejectReason.trim()) {
            rejectAudit(rejectingId, rejectReason);
            setRejectingId(null);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header Actions */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <button 
                    onClick={() => navigate('/devices', { state: { activeTab: 'devices' } })} 
                    className="flex items-center text-slate-500 hover:text-slate-700 transition-colors bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold"
                >
                    <ArrowLeft size={16} className="mr-1" /> 返回
                </button>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <ClipboardCheck size={18} className="text-blue-600" />
                    <span>待审总数: {pendingCountStatus + pendingCountInspection}</span>
                </div>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-20">
                {/* Tabs */}
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex">
                    <button 
                        onClick={() => { setMainTab('status'); setSubTab('pending'); }}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${mainTab === 'status' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        状态审核 
                        {pendingCountStatus > 0 && <span className="bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] shadow-sm">{pendingCountStatus}</span>}
                    </button>
                    <div className="w-px bg-slate-100 my-1 mx-1"></div>
                    <button 
                        onClick={() => { setMainTab('inspection'); setSubTab('pending'); }}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${mainTab === 'inspection' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        巡检审核 
                        {pendingCountInspection > 0 && <span className="bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] shadow-sm">{pendingCountInspection}</span>}
                    </button>
                </div>

                <div className="flex border-b border-slate-200">
                    <button 
                        onClick={() => setSubTab('pending')}
                        className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${subTab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        待审核
                    </button>
                    <button 
                        onClick={() => setSubTab('history')}
                        className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${subTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        历史记录
                    </button>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {displayRecords.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <History size={32} className="mb-2 opacity-20" />
                            <p className="text-xs">暂无相关记录</p>
                        </div>
                    )}
                    {displayRecords.map(record => (
                        <div key={record.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">{record.deviceName}</span>
                                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono border border-slate-200">{record.deviceSn}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-2">
                                       <span className="font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{record.storeName || '未知门店'}</span>
                                       <ChevronRight size={10} className="text-slate-300" />
                                       <span>{record.roomNumber ? `${record.roomNumber}房` : '无房号'}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1">申请人: {record.requestUser} · {record.requestTime}</div>
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold 
                                    ${record.auditStatus === AuditStatus.APPROVED ? 'bg-green-100 text-green-600' : 
                                      record.auditStatus === AuditStatus.REJECTED ? 'bg-red-100 text-red-600' : 
                                      record.auditStatus === AuditStatus.INVALID ? 'bg-slate-100 text-slate-400' : 'bg-orange-100 text-orange-600 animate-pulse'}`}>
                                    {record.auditStatus}
                                </div>
                            </div>
                            
                            {record.type === AuditType.OPS_STATUS ? (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3 flex items-center justify-between text-xs">
                                    <div className="text-slate-500 font-medium">原状态: {record.prevOpsStatus}</div>
                                    <ArrowLeft size={12} className="text-slate-300 rotate-180" />
                                    <div className="text-blue-600 font-bold">新状态: {record.targetOpsStatus}</div>
                                </div>
                            ) : (
                                <div className={`p-3 rounded-lg border mb-3 flex items-center gap-2 text-xs ${record.testResult === 'Qualified' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                    <span className="font-bold">巡检结果:</span>
                                    <span>{record.testResult === 'Qualified' ? '合格' : '不合格'}</span>
                                </div>
                            )}

                            <div className="text-xs text-slate-600 bg-blue-50/50 p-3 rounded-lg border border-blue-50 mb-3">
                                <span className="font-bold text-slate-500 block mb-1">备注说明:</span> 
                                {record.changeReason}
                            </div>
                            
                            {record.images && record.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                                    {record.images.map((img, idx) => (
                                        <div key={idx} className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
                                            <img src={img} alt="evidence" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {record.auditStatus !== AuditStatus.PENDING && record.rejectReason && (
                                <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg mt-1 border border-red-100">
                                    <span className="font-bold">拒绝原因:</span> {record.rejectReason}
                                </div>
                            )}

                            {subTab === 'pending' && (
                                <div className="flex gap-3 mt-3 pt-3 border-t border-slate-50">
                                    {rejectingId === record.id ? (
                                        <div className="flex-1 flex gap-2 animate-fadeIn bg-red-50 p-2 rounded-lg border border-red-100">
                                            <input 
                                                autoFocus
                                                placeholder="输入拒绝原因..."
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                className="flex-1 text-xs border border-red-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-300 bg-white"
                                            />
                                            <button onClick={confirmReject} className="bg-red-500 text-white text-xs px-3 py-1 rounded font-bold hover:bg-red-600 shadow-sm">确认</button>
                                            <button onClick={() => setRejectingId(null)} className="bg-white text-slate-600 text-xs px-3 py-1 rounded font-bold hover:bg-slate-50 border border-slate-200">取消</button>
                                        </div>
                                    ) : (
                                        <>
                                            <AuditGate type="device" className="flex-1">
                                                <button 
                                                    onClick={() => handleRejectClick(record.id)}
                                                    className="w-full py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-xs font-bold transition-colors bg-white"
                                                >
                                                    拒绝
                                                </button>
                                            </AuditGate>
                                            <AuditGate type="device" className="flex-1">
                                                <button 
                                                    onClick={() => approveAudit(record.id)}
                                                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs font-bold transition-colors shadow-md active:scale-95"
                                                >
                                                    通过审核
                                                </button>
                                            </AuditGate>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};