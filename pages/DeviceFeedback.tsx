import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MessageSquareWarning, ArrowLeft, CheckCircle, XCircle, Wrench, AlertCircle, History, ChevronRight, Send, Headphones, MapPin, MonitorPlay, Clock, Camera, FileText, X, Calendar, Plus } from 'lucide-react';
import { DeviceFeedback as DeviceFeedbackModel, FeedbackMethod } from '../types';
import { AuditGate } from '../components/DeviceComponents';

export const DeviceFeedback: React.FC = () => {
    const { feedbacks, resolveFeedback, dispatchFeedback, updateFeedbackProcess, submitFeedbackAudit, approveFeedback, rejectFeedback } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
    
    // UI state for expanding a feedback item 
    const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
    
    // Dispatch State
    const [selectedMethod, setSelectedMethod] = useState<FeedbackMethod>('remote');

    // Process Flow Modal State
    const [activeProcessingFeedback, setActiveProcessingFeedback] = useState<DeviceFeedbackModel | null>(null);
    
    // Rejection State
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const pendingFeedbacks = feedbacks.filter(f => f.status !== 'resolved' && f.status !== 'false_alarm');
    const resolvedFeedbacks = feedbacks.filter(f => f.status === 'resolved' || f.status === 'false_alarm');

    const handleFalseAlarm = (feedback: DeviceFeedbackModel) => {
        resolveFeedback(feedback.id, 'false_alarm', 'System');
        setExpandedFeedbackId(null);
    };

    const handleDispatch = (feedbackId: string) => {
        dispatchFeedback(feedbackId, selectedMethod);
        setExpandedFeedbackId(null);
    };

    const handleOpenProcess = (feedback: DeviceFeedbackModel) => {
        setActiveProcessingFeedback(feedback);
        setRejectMode(false);
        setRejectReason('');
    };

    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'pending_receive': return { text: '待接收', color: 'bg-red-100 text-red-600' };
            case 'processing': return { text: '待处理', color: 'bg-blue-100 text-blue-600' };
            case 'pending_audit': return { text: '待审核', color: 'bg-orange-100 text-orange-600' };
            case 'resolved': return { text: '已解决', color: 'bg-green-100 text-green-600' };
            case 'false_alarm': return { text: '误报', color: 'bg-slate-100 text-slate-500' };
            default: return { text: status, color: 'bg-slate-100 text-slate-500' };
        }
    };

    const getMethodLabel = (method?: FeedbackMethod) => {
        switch(method) {
            case 'remote': return '远程连线处理';
            case 'onsite': return '上门处理';
            case 'self': return '自助处理';
            default: return '未派单';
        }
    };

    // --- Sub-Component: Process Flow Modal (Full Screen) ---
    const ProcessFlowModal: React.FC<{ feedback: DeviceFeedbackModel, onClose: () => void }> = ({ feedback, onClose }) => {
        const method = feedback.processMethod || 'remote'; // Default to remote if missing
        const data = feedback.processData || {};
        const isEditable = feedback.status === 'processing';
        const isAudit = feedback.status === 'pending_audit';
        
        // Update helper
        const updateData = (key: string, value: any) => {
            if (!isEditable) return;
            updateFeedbackProcess(feedback.id, { [key]: value });
        };

        const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                const url = URL.createObjectURL(e.target.files[0]);
                const currentImages = data.siteImages || [];
                updateData('siteImages', [...currentImages, url]);
            }
        };

        const removeImage = (index: number) => {
            if (!isEditable) return;
            const currentImages = data.siteImages || [];
            updateData('siteImages', currentImages.filter((_, i) => i !== index));
        };

        const handleSubmit = () => {
            // Validation
            if (method === 'remote' && (!data.connectionTime || !data.result)) { alert('请完善远程处理信息'); return; }
            if (method === 'onsite' && (!data.appointmentTime || !data.checkInTime || !data.result || (data.siteImages?.length === 0))) { alert('请完善上门处理信息（含照片）'); return; }
            if (method === 'self' && !data.result) { alert('请填写处理结果'); return; }
            
            submitFeedbackAudit(feedback.id);
            onClose();
        };

        const handleAuditAction = (action: 'approve' | 'reject') => {
            if (action === 'approve') {
                approveFeedback(feedback.id);
                onClose();
            } else {
                if (!rejectReason.trim()) { alert('请输入驳回原因'); return; }
                rejectFeedback(feedback.id, rejectReason);
                onClose();
            }
        };

        return (
            <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slideInRight">
                {/* Header */}
                <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Wrench size={18} className="text-blue-600" />
                            设备处理流程
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">{feedback.deviceName} - {getMethodLabel(method)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-4">
                    {/* Context Info */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">反馈内容</span>
                            <span className="text-slate-700 font-bold">{feedback.content}</span>
                        </div>
                        {feedback.auditStatus === 'rejected' && (
                            <div className="bg-red-50 text-red-700 p-2 rounded text-xs border border-red-100 flex items-start gap-2">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <div><span className="font-bold">审核驳回:</span> {feedback.rejectReason}</div>
                            </div>
                        )}
                    </div>

                    {/* Method Specific Steps */}
                    
                    {/* REMOTE FLOW */}
                    {method === 'remote' && (
                        <>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700">
                                    <Headphones size={16} className="text-blue-500" /> 客户连线时间
                                </div>
                                <input 
                                    type="datetime-local" 
                                    className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50"
                                    value={data.connectionTime || ''}
                                    onChange={(e) => updateData('connectionTime', e.target.value)}
                                    disabled={!isEditable}
                                />
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700">
                                    <FileText size={16} className="text-green-500" /> 处理结果
                                </div>
                                <textarea 
                                    className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50 h-24 resize-none"
                                    placeholder="描述远程处理过程及结果..."
                                    value={data.result || ''}
                                    onChange={(e) => updateData('result', e.target.value)}
                                    disabled={!isEditable}
                                />
                            </div>
                        </>
                    )}

                    {/* ONSITE FLOW */}
                    {method === 'onsite' && (
                        <>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700">
                                    <Calendar size={16} className="text-blue-500" /> 预约上门时间
                                </div>
                                <input 
                                    type="datetime-local" 
                                    className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50"
                                    value={data.appointmentTime || ''}
                                    onChange={(e) => updateData('appointmentTime', e.target.value)}
                                    disabled={!isEditable}
                                />
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700">
                                    <MapPin size={16} className="text-orange-500" /> 到店打卡
                                </div>
                                {data.checkInTime ? (
                                    <div className="text-xs bg-green-50 text-green-700 p-2 rounded border border-green-100">
                                        已打卡: {data.checkInTime}
                                        {data.checkInLocation && <div className="mt-1 opacity-80">{data.checkInLocation}</div>}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            if(!isEditable) return;
                                            updateData('checkInTime', new Date().toLocaleString());
                                            updateData('checkInLocation', '已定位: 当前门店位置');
                                        }}
                                        disabled={!isEditable}
                                        className="w-full py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded hover:bg-blue-100"
                                    >
                                        点击打卡
                                    </button>
                                )}
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700">
                                    <Camera size={16} className="text-purple-500" /> 现场拍照
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {isEditable && (
                                        <div className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 relative">
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0" onChange={handleImageUpload} />
                                            <Plus size={20} className="text-slate-400" />
                                        </div>
                                    )}
                                    {data.siteImages?.map((url: string, i: number) => (
                                        <div key={i} className="aspect-square rounded-lg border border-slate-200 overflow-hidden relative group">
                                            <img src={url} className="w-full h-full object-cover" />
                                            {isEditable && (
                                                <button onClick={() => removeImage(i)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X size={12} /></button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700">
                                    <FileText size={16} className="text-green-500" /> 处理结果
                                </div>
                                <textarea 
                                    className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50 h-24 resize-none"
                                    placeholder="描述处理过程及结果..."
                                    value={data.result || ''}
                                    onChange={(e) => updateData('result', e.target.value)}
                                    disabled={!isEditable}
                                />
                            </div>
                        </>
                    )}

                    {/* SELF SERVICE FLOW */}
                    {method === 'self' && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700">
                                <MonitorPlay size={16} className="text-blue-500" /> 处理结果
                            </div>
                            <textarea 
                                className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50 h-32 resize-none"
                                placeholder="请记录自助处理的情况..."
                                value={data.result || ''}
                                onChange={(e) => updateData('result', e.target.value)}
                                disabled={!isEditable}
                            />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                    {isEditable && (
                        <button 
                            onClick={handleSubmit}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                        >
                            提交审核
                        </button>
                    )}
                    {isAudit && (
                        rejectMode ? (
                            <div className="space-y-3">
                                <textarea 
                                    className="w-full border border-red-200 rounded p-2 text-sm bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    placeholder="请输入驳回原因..."
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setRejectMode(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg text-xs">取消</button>
                                    <button onClick={() => handleAuditAction('reject')} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg text-xs shadow-md">确认驳回</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <AuditGate type="device" className="flex-1">
                                    <button onClick={() => setRejectMode(true)} className="w-full py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">驳回</button>
                                </AuditGate>
                                <AuditGate type="device" className="flex-1">
                                    <button onClick={() => handleAuditAction('approve')} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-all">通过审核</button>
                                </AuditGate>
                            </div>
                        )
                    )}
                    {!isEditable && !isAudit && (
                        <div className="text-center text-xs text-slate-400">流程已结束或正在审核中</div>
                    )}
                </div>
            </div>
        );
    };

    const FeedbackItem: React.FC<{ feedback: DeviceFeedbackModel; isPendingTab: boolean }> = ({ feedback, isPendingTab }) => {
        const isExpanded = expandedFeedbackId === feedback.id;
        const statusConfig = getStatusLabel(feedback.status);
        const isPendingReceive = feedback.status === 'pending_receive';
        const isProcessing = feedback.status === 'processing';
        const isPendingAudit = feedback.status === 'pending_audit';

        return (
            <div className={`bg-white p-4 rounded-xl shadow-sm border relative overflow-hidden transition-all ${isPendingAudit ? 'border-orange-200' : 'border-slate-100'}`}>
                <div 
                    className="flex justify-between items-start cursor-pointer"
                    onClick={() => {
                        // For 'processing' and 'audit' states, click opens detail directly
                        if (isProcessing || isPendingAudit) {
                            handleOpenProcess(feedback);
                        } else if (isPendingReceive) {
                            setExpandedFeedbackId(isExpanded ? null : feedback.id);
                        }
                    }}
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800 text-sm">{feedback.deviceName}</span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono border border-slate-200">{feedback.deviceSn}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mb-2 flex items-center gap-2">
                            <span className="font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{feedback.storeName}</span>
                            <ChevronRight size={10} className="text-slate-300" />
                            <span>{feedback.roomNumber}</span>
                        </div>
                        
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed mb-2">
                            <span className="font-bold text-slate-500 mr-1">反馈内容:</span>
                            {feedback.content}
                        </div>

                        {/* Images Preview in List */}
                        {feedback.images && feedback.images.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
                                {feedback.images.map((img, i) => (
                                    <div key={i} className="w-10 h-10 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                                        <img src={img} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-1 text-[10px] text-slate-400 mt-2">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-500">反馈时间:</span>
                                <span>{feedback.createTime}</span>
                            </div>
                            {feedback.processMethod && (
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-slate-500">处理方式:</span>
                                    <span className="text-blue-600 font-medium">{getMethodLabel(feedback.processMethod)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="ml-3 flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${statusConfig.color} animate-pulse`}>
                            {statusConfig.text}
                        </span>
                        {(isProcessing || isPendingAudit) && (
                            <ChevronRight size={16} className="text-slate-300 mt-2" />
                        )}
                    </div>
                </div>

                {/* Dispatch Action Area (For Pending Receive) */}
                {isPendingReceive && isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeIn">
                        <div className="mb-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                            <label className="text-xs font-bold text-slate-600 mb-2 block flex items-center gap-1">
                                <Send size={12} className="text-blue-500" /> 选择派单处理方式
                            </label>
                            <div className="flex flex-col gap-2">
                                <select 
                                    className="w-full text-xs border border-slate-300 rounded px-2 py-2 focus:outline-none focus:border-blue-500 bg-white"
                                    value={selectedMethod}
                                    onChange={(e) => setSelectedMethod(e.target.value as FeedbackMethod)}
                                >
                                    <option value="remote">远程连线处理</option>
                                    <option value="onsite">上门处理</option>
                                    <option value="self">自助处理</option>
                                </select>

                                <button 
                                    onClick={() => handleDispatch(feedback.id)}
                                    className="w-full bg-blue-600 text-white text-xs px-3 py-2 rounded font-bold hover:bg-blue-700 shadow-sm transition-colors mt-1"
                                >
                                    确定派单
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={() => handleFalseAlarm(feedback)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-500 font-bold rounded-lg text-xs hover:bg-slate-50 flex items-center justify-center gap-1"
                            >
                                <XCircle size={14} /> 误报
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 relative">
            {/* Header */}
            <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 text-xs font-bold px-3"
                >
                    <ArrowLeft size={14} /> 返回
                </button>
                <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquareWarning size={18} className="text-blue-600" />
                    设备反馈管理
                </h1>
                <div className="w-16"></div>
            </div>

            {/* Tabs */}
            <div className="p-4 pb-0">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex mb-4">
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'pending' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        待解决反馈
                        {pendingFeedbacks.length > 0 && <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm">{pendingFeedbacks.length}</span>}
                    </button>
                    <div className="w-px bg-slate-100 my-1 mx-1"></div>
                    <button 
                        onClick={() => setActiveTab('resolved')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'resolved' ? 'bg-green-50 text-green-600 shadow-sm border border-green-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        已解决反馈
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-3">
                {activeTab === 'pending' ? (
                    pendingFeedbacks.length > 0 ? (
                        pendingFeedbacks.map(fb => <FeedbackItem key={fb.id} feedback={fb} isPendingTab={true} />)
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <CheckCircle size={48} className="mb-2 opacity-20 text-green-500" />
                            <p className="text-xs">暂无待解决反馈</p>
                        </div>
                    )
                ) : (
                    resolvedFeedbacks.length > 0 ? (
                        resolvedFeedbacks.map(fb => <FeedbackItem key={fb.id} feedback={fb} isPendingTab={false} />)
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <History size={48} className="mb-2 opacity-20" />
                            <p className="text-xs">暂无历史记录</p>
                        </div>
                    )
                )}
            </div>

            {/* Process Flow Modal */}
            {activeProcessingFeedback && (
                <ProcessFlowModal 
                    feedback={activeProcessingFeedback} 
                    onClose={() => setActiveProcessingFeedback(null)} 
                />
            )}
        </div>
    );
};