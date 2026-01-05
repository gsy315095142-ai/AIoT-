import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MessageSquareWarning, ArrowLeft, CheckCircle, XCircle, Wrench, AlertCircle, History, ChevronRight } from 'lucide-react';
import { OpsStatus, DeviceFeedback as DeviceFeedbackModel } from '../types';

export const DeviceFeedback: React.FC = () => {
    const { feedbacks, resolveFeedback, submitOpsStatusChange, currentUser } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
    
    // UI state for expanding a feedback item to modify status
    const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
    const [selectedOpsStatus, setSelectedOpsStatus] = useState<OpsStatus>(OpsStatus.REPAIRING);
    const [complaintType, setComplaintType] = useState<string>('');

    const pendingFeedbacks = feedbacks.filter(f => f.status === 'pending');
    const resolvedFeedbacks = feedbacks.filter(f => f.status !== 'pending');

    const handleResolve = (feedback: DeviceFeedbackModel, type: 'resolved' | 'false_alarm') => {
        resolveFeedback(feedback.id, type, currentUser || 'System');
        setExpandedFeedbackId(null);
        setComplaintType('');
    };

    const handleUpdateStatus = (feedback: DeviceFeedbackModel) => {
        let reason = `反馈处理`;
        if (selectedOpsStatus === OpsStatus.HOTEL_COMPLAINT) {
            if (!complaintType) {
                alert('请选择客诉类型');
                return;
            }
            reason = `[${complaintType}] ` + reason;
        }

        // Trigger audit workflow instead of direct update
        submitOpsStatusChange(feedback.deviceId, selectedOpsStatus, reason);
        alert('设备运维状态修改进入审核');
    };

    const FeedbackItem = ({ feedback, isPending }: { feedback: DeviceFeedbackModel; isPending: boolean }) => {
        const isExpanded = expandedFeedbackId === feedback.id;

        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden transition-all">
                <div 
                    className="flex justify-between items-start cursor-pointer"
                    onClick={() => isPending && setExpandedFeedbackId(isExpanded ? null : feedback.id)}
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

                        <div className="flex flex-col gap-1 text-[10px] text-slate-400 mt-2">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-500">反馈时间:</span>
                                <span>{feedback.createTime}</span>
                            </div>
                            {!isPending && (
                                <>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-slate-500">解决时间:</span>
                                        <span>{feedback.resolveTime}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-slate-500">处理人员:</span>
                                        <span>{feedback.resolver}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="ml-3 flex flex-col items-end gap-1">
                        {isPending ? (
                            <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-[10px] font-bold animate-pulse whitespace-nowrap">待解决</span>
                        ) : (
                            <span className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${
                                feedback.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                                {feedback.status === 'resolved' ? '已处理' : '误报'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Expanded Action Area for Pending Items */}
                {isPending && isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeIn">
                        <div className="mb-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                            <label className="text-xs font-bold text-slate-600 mb-2 block flex items-center gap-1">
                                <Wrench size={12} className="text-blue-500" /> 修改设备运维状态
                            </label>
                            <div className="flex flex-col gap-2">
                                <select 
                                    className="w-full text-xs border border-slate-300 rounded px-2 py-2 focus:outline-none focus:border-blue-500 bg-white"
                                    value={selectedOpsStatus}
                                    onChange={(e) => {
                                        setSelectedOpsStatus(e.target.value as OpsStatus);
                                        if (e.target.value !== OpsStatus.HOTEL_COMPLAINT) setComplaintType('');
                                    }}
                                >
                                    <option value={OpsStatus.INSPECTED}>正常</option>
                                    <option value={OpsStatus.REPAIRING}>维修</option>
                                    <option value={OpsStatus.HOTEL_COMPLAINT}>客诉</option>
                                </select>

                                {selectedOpsStatus === OpsStatus.HOTEL_COMPLAINT && (
                                    <select 
                                        className="w-full text-xs border border-pink-300 rounded px-2 py-2 focus:outline-none focus:border-pink-500 bg-pink-50 text-pink-700 animate-fadeIn"
                                        value={complaintType}
                                        onChange={(e) => setComplaintType(e.target.value)}
                                    >
                                        <option value="">请选择客诉类型</option>
                                        <option value="设备质量故障">设备质量故障</option>
                                        <option value="其他客诉情况">其他客诉情况</option>
                                    </select>
                                )}

                                <button 
                                    onClick={() => handleUpdateStatus(feedback)}
                                    className="w-full bg-blue-600 text-white text-xs px-3 py-2 rounded font-bold hover:bg-blue-700 shadow-sm transition-colors mt-1"
                                >
                                    提交审核
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleResolve(feedback, 'false_alarm')}
                                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 flex items-center justify-center gap-1"
                            >
                                <XCircle size={14} /> 误报
                            </button>
                            <button 
                                onClick={() => handleResolve(feedback, 'resolved')}
                                className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl text-xs hover:bg-green-700 flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
                            >
                                <CheckCircle size={14} /> 已处理
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
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
                <div className="w-16"></div> {/* Spacer for centering */}
            </div>

            {/* Tabs */}
            <div className="p-4 pb-0">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex mb-4">
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'pending' ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-slate-500 hover:bg-slate-50'}`}
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
                        pendingFeedbacks.map(fb => <FeedbackItem key={fb.id} feedback={fb} isPending={true} />)
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <CheckCircle size={48} className="mb-2 opacity-20 text-green-500" />
                            <p className="text-xs">暂无待解决反馈</p>
                        </div>
                    )
                ) : (
                    resolvedFeedbacks.length > 0 ? (
                        resolvedFeedbacks.map(fb => <FeedbackItem key={fb.id} feedback={fb} isPending={false} />)
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <History size={48} className="mb-2 opacity-20" />
                            <p className="text-xs">暂无历史记录</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};