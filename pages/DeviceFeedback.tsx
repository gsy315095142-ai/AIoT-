import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MessageSquareWarning, ArrowLeft, CheckCircle, XCircle, Wrench, AlertCircle, History, ChevronRight, Send, Headphones, MapPin, MonitorPlay, Calendar, Camera, FileText, X, Plus, Check, ChevronLeft } from 'lucide-react';
import { DeviceFeedback as DeviceFeedbackModel, FeedbackMethod, FeedbackProcessData } from '../types';
import { AuditGate } from '../components/DeviceComponents';

// --- Sub-Components ---

// Horizontal Stepper Component
const Stepper = ({ steps, currentStep, onStepClick, stepStatus }: { 
    steps: { id: number, label: string }[], 
    currentStep: number, 
    onStepClick: (idx: number) => void,
    stepStatus: (idx: number) => 'completed' | 'current' | 'locked'
}) => (
    <div className="bg-slate-50 px-4 py-4 border-b border-slate-100">
        <div className="relative flex items-center justify-between">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 z-0 rounded-full -translate-y-1/2" />
            
            {/* Active Progress Line */}
            <div 
                className="absolute top-1/2 left-0 h-1 bg-blue-500 z-0 rounded-full -translate-y-1/2 transition-all duration-300"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, idx) => {
                const status = stepStatus(idx);
                return (
                    <div 
                        key={step.id} 
                        className={`relative z-10 flex flex-col items-center cursor-pointer group`}
                        onClick={() => status !== 'locked' && onStepClick(idx)}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm
                            ${status === 'completed' ? 'bg-green-500 border-green-500' : 
                              status === 'current' ? 'bg-white border-blue-600 scale-125' : 
                              'bg-white border-slate-300'}`}
                        >
                            {status === 'completed' ? <Check size={14} className="text-white" strokeWidth={3} /> : 
                             status === 'current' ? <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" /> :
                             <span className="text-[10px] text-slate-400 font-bold">{idx + 1}</span>}
                        </div>
                        <span className={`absolute top-8 text-[10px] whitespace-nowrap font-bold transition-colors
                            ${status === 'completed' ? 'text-green-600' : 
                              status === 'current' ? 'text-blue-600' : 
                              'text-slate-400'}`}
                        >
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
        <div className="h-4"></div>
    </div>
);

const ProcessFlowModal: React.FC<{ feedback: DeviceFeedbackModel, onClose: () => void }> = ({ feedback, onClose }) => {
    const { updateFeedbackProcess, submitFeedbackAudit, approveFeedback, rejectFeedback } = useApp();
    
    // Step State
    const [currentStep, setCurrentStep] = useState(0);

    // Local state for rejection in modal
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const method = feedback.processMethod || 'remote';
    const data = feedback.processData || {};
    const isEditable = feedback.status === 'processing';
    const isAudit = feedback.status === 'pending_audit';
    
    // Define steps based on method
    const steps = React.useMemo(() => {
        switch (method) {
            case 'remote': return [
                { id: 0, label: '客户连线', field: 'connectionTime' },
                { id: 1, label: '处理结果', field: 'result' }
            ];
            case 'onsite': return [
                { id: 0, label: '预约上门', field: 'appointmentTime' },
                { id: 1, label: '到店打卡', field: 'checkInTime' },
                { id: 2, label: '现场拍照', field: 'siteImages' },
                { id: 3, label: '处理结果', field: 'result' }
            ];
            case 'self': return [
                { id: 0, label: '处理结果', field: 'result' }
            ];
            default: return [];
        }
    }, [method]);

    // Validation Logic
    const isStepValid = (stepIdx: number): boolean => {
        if (stepIdx < 0 || stepIdx >= steps.length) return false;
        const field = steps[stepIdx].field;
        const val = data[field as keyof FeedbackProcessData];
        if (field === 'siteImages') return Array.isArray(val) && val.length > 0;
        return !!val;
    };

    const isPreviousStepsValid = (targetIdx: number): boolean => {
        for (let i = 0; i < targetIdx; i++) {
            if (!isStepValid(i)) return false;
        }
        return true;
    };

    const getStepStatus = (idx: number) => {
        if (idx < currentStep) return 'completed';
        if (idx === currentStep) return 'current';
        // Allow free navigation in audit mode or if previous steps are done
        if (!isEditable || isPreviousStepsValid(idx)) return 'current'; // Using 'current' style for accessible future steps in audit
        return 'locked';
    };

    // Initialize step to first incomplete
    useEffect(() => {
        if (isEditable) {
            let firstIncomplete = 0;
            for (let i = 0; i < steps.length; i++) {
                if (!isStepValid(i)) {
                    firstIncomplete = i;
                    break;
                }
                // If all valid, stay on last
                if (i === steps.length - 1) firstIncomplete = i;
            }
            setCurrentStep(firstIncomplete);
        } else {
            // View mode defaults to start
            setCurrentStep(0);
        }
    }, []); // Run once on mount

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

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Submit if last step
            submitFeedbackAudit(feedback.id);
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
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

    const getMethodLabel = (m: FeedbackMethod) => {
        switch(m) {
            case 'remote': return '远程连线处理';
            case 'onsite': return '上门处理';
            case 'self': return '自助处理';
            default: return '未派单';
        }
    };

    // Current Step Field Name
    const currentField = steps[currentStep]?.field;

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

            {/* Stepper */}
            <Stepper 
                steps={steps} 
                currentStep={currentStep} 
                onStepClick={setCurrentStep}
                stepStatus={getStepStatus}
            />

            <div className="flex-1 overflow-y-auto p-5 bg-white relative">
                {/* Step Content */}
                <div className="animate-fadeIn space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">{steps[currentStep].label}</h2>
                        <p className="text-xs text-slate-400 mt-1">
                            {isEditable ? '请完善该环节信息' : '该环节信息详情'}
                        </p>
                    </div>

                    {/* Step Specific Inputs based on currentField */}
                    
                    {currentField === 'connectionTime' && (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <Headphones size={14} /> 连线时间
                                </label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={data.connectionTime || ''}
                                    onChange={(e) => updateData('connectionTime', e.target.value)}
                                    disabled={!isEditable}
                                />
                            </div>
                        </div>
                    )}

                    {currentField === 'appointmentTime' && (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <Calendar size={14} /> 预约上门时间
                                </label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    value={data.appointmentTime || ''}
                                    onChange={(e) => updateData('appointmentTime', e.target.value)}
                                    disabled={!isEditable}
                                />
                            </div>
                        </div>
                    )}

                    {currentField === 'checkInTime' && (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-3">
                                <MapPin size={14} /> 到店打卡
                            </label>
                            {data.checkInTime ? (
                                <div className="text-sm bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 flex items-start gap-3">
                                    <CheckCircle size={20} className="shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold">已完成打卡</div>
                                        <div className="text-xs mt-1 opacity-80">{data.checkInTime}</div>
                                        <div className="text-xs mt-1 opacity-80">{data.checkInLocation}</div>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => {
                                        if(!isEditable) return;
                                        updateData('checkInTime', new Date().toLocaleString());
                                        updateData('checkInLocation', '已定位: 上海市南京东路888号 (31.2304° N, 121.4737° E)');
                                    }}
                                    disabled={!isEditable}
                                    className="w-full py-4 bg-white text-blue-600 text-sm font-bold rounded-xl border-2 border-blue-100 hover:bg-blue-50 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                                >
                                    <MapPin size={18} /> 点击模拟打卡
                                </button>
                            )}
                        </div>
                    )}

                    {currentField === 'siteImages' && (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-3">
                                <Camera size={14} /> 现场拍照
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {isEditable && (
                                    <div className="aspect-square border-2 border-dashed border-blue-200 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white relative hover:border-blue-400 transition-colors bg-white group">
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                                        <div className="flex flex-col items-center">
                                            <Plus size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] text-blue-500 font-bold mt-1">上传照片</span>
                                        </div>
                                    </div>
                                )}
                                {data.siteImages?.map((url: string, i: number) => (
                                    <div key={i} className="aspect-square rounded-xl border border-slate-200 overflow-hidden relative group shadow-sm">
                                        <img src={url} className="w-full h-full object-cover" />
                                        {isEditable && (
                                            <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-80 hover:opacity-100"><X size={14} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {(!data.siteImages || data.siteImages.length === 0) && !isEditable && (
                                <div className="text-center py-4 text-slate-400 text-xs">暂无照片</div>
                            )}
                        </div>
                    )}

                    {currentField === 'result' && (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <label className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-2">
                                <FileText size={14} /> 处理结果/方案
                            </label>
                            <textarea 
                                className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white h-40 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                                placeholder={method === 'self' ? "请记录自助处理的情况..." : "描述处理过程及结果..."}
                                value={data.result || ''}
                                onChange={(e) => updateData('result', e.target.value)}
                                disabled={!isEditable}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                {/* Standard Edit/Processing Mode */}
                {isEditable && (
                    <div className="flex gap-3">
                        <button 
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className={`flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-1 transition-colors
                                ${currentStep === 0 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <ChevronLeft size={16} /> 上一步
                        </button>
                        
                        <button 
                            onClick={handleNext}
                            disabled={!isStepValid(currentStep)}
                            className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1
                                ${!isStepValid(currentStep) ? 'bg-blue-300 cursor-not-allowed' : 
                                  currentStep === steps.length - 1 ? 'bg-green-600 hover:bg-green-700 active:scale-95' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
                        >
                            {currentStep === steps.length - 1 ? '提交审核' : '下一步'}
                            {currentStep !== steps.length - 1 && <ChevronRight size={16} />}
                        </button>
                    </div>
                )}

                {/* Audit Mode */}
                {isAudit && (
                    rejectMode ? (
                        <div className="space-y-3">
                            <textarea 
                                autoFocus
                                className="w-full border border-red-200 rounded-xl p-3 text-sm bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-500"
                                placeholder="请输入驳回原因..."
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setRejectMode(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">取消</button>
                                <button onClick={() => handleAuditAction('reject')} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm shadow-md">确认驳回</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3 justify-between items-center mb-1">
                                <button 
                                    onClick={handlePrev}
                                    disabled={currentStep === 0}
                                    className={`p-3 rounded-full transition-colors ${currentStep === 0 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-xs text-slate-400 font-bold">
                                    {currentStep + 1} / {steps.length}
                                </span>
                                <button 
                                    onClick={() => currentStep < steps.length - 1 && setCurrentStep(prev => prev + 1)}
                                    disabled={currentStep === steps.length - 1}
                                    className={`p-3 rounded-full transition-colors ${currentStep === steps.length - 1 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                            
                            <div className="flex gap-3">
                                <AuditGate type="device" className="flex-1">
                                    <button onClick={() => setRejectMode(true)} className="w-full py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">驳回</button>
                                </AuditGate>
                                <AuditGate type="device" className="flex-1">
                                    <button onClick={() => handleAuditAction('approve')} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-all">通过审核</button>
                                </AuditGate>
                            </div>
                        </div>
                    )
                )}

                {/* View Only / Finished Mode */}
                {!isEditable && !isAudit && (
                    <div className="flex justify-between items-center px-4">
                         <button 
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className={`p-2 rounded-full transition-colors ${currentStep === 0 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <span className="text-xs text-slate-400">流程已归档</span>
                        <button 
                            onClick={() => currentStep < steps.length - 1 && setCurrentStep(prev => prev + 1)}
                            disabled={currentStep === steps.length - 1}
                            className={`p-2 rounded-full transition-colors ${currentStep === steps.length - 1 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const DeviceFeedback: React.FC = () => {
    const { feedbacks, resolveFeedback, dispatchFeedback } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'pending' | 'resolved'>('pending');
    
    // UI state for expanding a feedback item 
    const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<FeedbackMethod>('remote');

    // Process Flow Modal State: Using ID to ensure reactivity
    const [activeProcessingFeedbackId, setActiveProcessingFeedbackId] = useState<string | null>(null);
    
    const pendingFeedbacks = feedbacks.filter(f => f.status !== 'resolved' && f.status !== 'false_alarm');
    const resolvedFeedbacks = feedbacks.filter(f => f.status === 'resolved' || f.status === 'false_alarm');

    // Derive the active feedback object from the fresh context list
    const activeProcessingFeedback = feedbacks.find(f => f.id === activeProcessingFeedbackId) || null;

    const handleFalseAlarm = (feedback: DeviceFeedbackModel) => {
        resolveFeedback(feedback.id, 'false_alarm', 'System');
        setExpandedFeedbackId(null);
    };

    const handleDispatch = (feedbackId: string) => {
        dispatchFeedback(feedbackId, selectedMethod);
        setExpandedFeedbackId(null);
    };

    const handleOpenProcess = (feedbackId: string) => {
        setActiveProcessingFeedbackId(feedbackId);
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
                        if (isProcessing || isPendingAudit) {
                            handleOpenProcess(feedback.id);
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

            {activeProcessingFeedback && (
                <ProcessFlowModal 
                    feedback={activeProcessingFeedback} 
                    onClose={() => setActiveProcessingFeedbackId(null)} 
                />
            )}
        </div>
    );
};