import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MessageSquareWarning, ArrowLeft, CheckCircle, XCircle, History, ChevronRight, Send, User, ChevronDown } from 'lucide-react';
import { DeviceFeedback as DeviceFeedbackModel, FeedbackMethod, AssignableUser } from '../types';

// --- Helpers ---
const getStatusConfig = (status: string) => {
    switch(status) {
        case 'pending_receive': return { text: '待接收', color: 'bg-red-100 text-red-600' };
        case 'processing': return { text: '进行中', color: 'bg-blue-100 text-blue-600' };
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

// --- Components ---

interface FeedbackCardProps {
    feedback: DeviceFeedbackModel;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onOpenDetail: () => void;
    onDispatch: (id: string, method: FeedbackMethod, assignee: string) => void;
    onFalseAlarm: (id: string) => void;
    assignableUsers: AssignableUser[];
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ 
    feedback, isExpanded, onToggleExpand, onOpenDetail, onDispatch, onFalseAlarm, assignableUsers 
}) => {
    // Local state for the dispatch form to isolate inputs
    const [method, setMethod] = useState<FeedbackMethod>('remote');
    const [assignee, setAssignee] = useState('');

    const statusConfig = getStatusConfig(feedback.status);
    const isPendingReceive = feedback.status === 'pending_receive';
    
    // Logic from previous iteration: Processing, Audit, Completed are clickable for detail
    const canOpenDetail = ['processing', 'pending_audit', 'resolved', 'false_alarm'].includes(feedback.status);

    const handleClick = () => {
        if (canOpenDetail) {
            onOpenDetail();
        } else if (isPendingReceive) {
            onToggleExpand();
        }
    };

    const handleConfirmDispatch = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!assignee) {
            alert('请选择任务指派对象');
            return;
        }
        onDispatch(feedback.id, method, assignee);
    };

    const handleConfirmFalseAlarm = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFalseAlarm(feedback.id);
    };

    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm border relative overflow-hidden transition-all ${feedback.status === 'pending_audit' ? 'border-orange-200' : 'border-slate-100'}`}>
            <div className="flex justify-between items-start cursor-pointer" onClick={handleClick}>
                {/* Content Section */}
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

                    {feedback.images && feedback.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2">
                            {feedback.images.map((img, i) => (
                                <div key={i} className="w-10 h-10 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                                    <img src={img} className="w-full h-full object-cover" alt="feedback" />
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
                        {feedback.assignee && (
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-500">处理人员:</span>
                                <span className="text-slate-600 font-medium">{feedback.assignee}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Badge */}
                <div className="ml-3 flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${statusConfig.color} animate-pulse`}>
                        {statusConfig.text}
                    </span>
                    {canOpenDetail && (
                        <ChevronRight size={16} className="text-slate-300 mt-2" />
                    )}
                </div>
            </div>

            {/* Dispatch Form (Only for Pending Receive & Expanded) */}
            {isPendingReceive && isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeIn" onClick={e => e.stopPropagation()}>
                    <div className="mb-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                        <label className="text-xs font-bold text-slate-600 mb-2 block flex items-center gap-1">
                            <Send size={12} className="text-blue-500" /> 选择派单处理方式
                        </label>
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-[10px] text-slate-500 mb-1 block">处理方式</label>
                                <select 
                                    className="w-full text-xs border border-slate-300 rounded px-2 py-2 focus:outline-none focus:border-blue-500 bg-white"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value as FeedbackMethod)}
                                >
                                    <option value="remote">远程连线处理</option>
                                    <option value="onsite">上门处理</option>
                                    <option value="self">自助处理</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] text-slate-500 mb-1 block">任务指派对象</label>
                                <div className="relative">
                                    <select 
                                        className="w-full text-xs border border-slate-300 rounded px-2 py-2 focus:outline-none focus:border-blue-500 bg-white appearance-none"
                                        value={assignee}
                                        onChange={(e) => setAssignee(e.target.value)}
                                    >
                                        <option value="">请选择负责人...</option>
                                        {assignableUsers.map(user => (
                                            <option key={user.id} value={user.name}>{user.name} ({user.role})</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                </div>
                            </div>

                            <button 
                                onClick={handleConfirmDispatch}
                                className="w-full bg-blue-600 text-white text-xs px-3 py-2 rounded font-bold hover:bg-blue-700 shadow-sm transition-colors mt-1"
                            >
                                确定派单
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={handleConfirmFalseAlarm}
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

export const DeviceFeedback: React.FC = () => {
    const { feedbacks, resolveFeedback, dispatchFeedback, assignableUsers } = useApp();
    const navigate = useNavigate();
    
    // State
    const [activeTab, setActiveTab] = useState<'unassigned' | 'processing' | 'completed'>('unassigned');
    const [completedSubTab, setCompletedSubTab] = useState<'solved' | 'secondary' | 'unsolvable'>('solved');
    const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);

    // Handlers
    const handleDispatch = (id: string, method: FeedbackMethod, assignee: string) => {
        dispatchFeedback(id, method, assignee);
        setExpandedFeedbackId(null);
    };

    const handleFalseAlarm = (id: string) => {
        resolveFeedback(id, 'false_alarm', 'System');
        setExpandedFeedbackId(null);
    };

    const handleOpenProcess = (id: string) => {
        navigate(`/device-process/${id}`);
    };

    // Filter Logic using useMemo for better performance
    const { unassignedFeedbacks, processingFeedbacks, completedFeedbacks } = useMemo(() => {
        const unassigned = feedbacks.filter(f => f.status === 'pending_receive');
        const processing = feedbacks.filter(f => f.status === 'processing' || f.status === 'pending_audit');
        
        const rawCompleted = feedbacks.filter(f => f.status === 'resolved' || f.status === 'false_alarm');
        const completed = rawCompleted.filter(f => {
            if (completedSubTab === 'solved') {
                return (f.processData?.resolutionStatus === '已解决' || f.status === 'false_alarm');
            }
            if (completedSubTab === 'secondary') {
                return f.processData?.resolutionStatus === '需二次处理';
            }
            if (completedSubTab === 'unsolvable') {
                return f.processData?.resolutionStatus === '无法解决';
            }
            return false;
        });

        return { unassignedFeedbacks: unassigned, processingFeedbacks: processing, completedFeedbacks: completed };
    }, [feedbacks, completedSubTab]);

    return (
        <div className="h-full flex flex-col bg-slate-50 relative">
            <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button 
                    onClick={() => navigate('/devices')}
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

            <div className="p-4 pb-0">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex mb-4">
                    <button 
                        onClick={() => setActiveTab('unassigned')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'unassigned' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <span className="flex items-center gap-1">
                            待分配客诉
                            {unassignedFeedbacks.length > 0 && <span className="bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{unassignedFeedbacks.length}</span>}
                        </span>
                    </button>
                    <div className="w-px bg-slate-100 my-1 mx-1"></div>
                    <button 
                        onClick={() => setActiveTab('processing')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'processing' ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <span className="flex items-center gap-1">
                            待完成工单
                            {processingFeedbacks.length > 0 && <span className="bg-orange-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{processingFeedbacks.length}</span>}
                        </span>
                    </button>
                    <div className="w-px bg-slate-100 my-1 mx-1"></div>
                    <button 
                        onClick={() => setActiveTab('completed')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${activeTab === 'completed' ? 'bg-green-50 text-green-600 shadow-sm border border-green-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <span className="flex items-center gap-1">
                            已完成工单
                        </span>
                    </button>
                </div>

                {/* Sub-Tabs for Completed */}
                {activeTab === 'completed' && (
                    <div className="flex mb-4 bg-slate-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setCompletedSubTab('solved')}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${completedSubTab === 'solved' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            已解决
                        </button>
                        <button 
                            onClick={() => setCompletedSubTab('secondary')}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${completedSubTab === 'secondary' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            需二次处理
                        </button>
                        <button 
                            onClick={() => setCompletedSubTab('unsolvable')}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${completedSubTab === 'unsolvable' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            无法解决
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-3">
                {activeTab === 'unassigned' && (
                    unassignedFeedbacks.length > 0 ? (
                        unassignedFeedbacks.map(fb => (
                            <FeedbackCard 
                                key={fb.id} 
                                feedback={fb} 
                                isExpanded={expandedFeedbackId === fb.id}
                                onToggleExpand={() => setExpandedFeedbackId(expandedFeedbackId === fb.id ? null : fb.id)}
                                onOpenDetail={() => handleOpenProcess(fb.id)}
                                onDispatch={handleDispatch}
                                onFalseAlarm={handleFalseAlarm}
                                assignableUsers={assignableUsers}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <CheckCircle size={48} className="mb-2 opacity-20 text-green-500" />
                            <p className="text-xs">暂无待分配客诉</p>
                        </div>
                    )
                )}

                {activeTab === 'processing' && (
                    processingFeedbacks.length > 0 ? (
                        processingFeedbacks.map(fb => (
                            <FeedbackCard 
                                key={fb.id} 
                                feedback={fb} 
                                isExpanded={false}
                                onToggleExpand={() => {}}
                                onOpenDetail={() => handleOpenProcess(fb.id)}
                                onDispatch={handleDispatch}
                                onFalseAlarm={handleFalseAlarm}
                                assignableUsers={assignableUsers}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <CheckCircle size={48} className="mb-2 opacity-20 text-green-500" />
                            <p className="text-xs">暂无待完成工单</p>
                        </div>
                    )
                )}

                {activeTab === 'completed' && (
                    completedFeedbacks.length > 0 ? (
                        completedFeedbacks.map(fb => (
                            <FeedbackCard 
                                key={fb.id} 
                                feedback={fb} 
                                isExpanded={false}
                                onToggleExpand={() => {}}
                                onOpenDetail={() => handleOpenProcess(fb.id)}
                                onDispatch={handleDispatch}
                                onFalseAlarm={handleFalseAlarm}
                                assignableUsers={assignableUsers}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <History size={48} className="mb-2 opacity-20" />
                            <p className="text-xs">暂无{completedSubTab === 'solved' ? '已解决' : completedSubTab === 'secondary' ? '需二次处理' : '无法解决'}的工单记录</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};