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
                        onClick={() => onStepClick(idx)}
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
    const isStepDataValid = (stepIdx: number): boolean => {
        if (stepIdx < 0 || stepIdx >= steps.length) return false;
        const field = steps[stepIdx].field;
        const val = data[field as keyof FeedbackProcessData];
        if (field === 'siteImages') return Array.isArray(val) && val.length > 0;
        return !!val;
    };

    const isStepExplicitlyCompleted = (stepIdx: number) => {
        return (data.completedSteps || []).includes(stepIdx);
    };

    const isAllStepsCompleted = () => {
        return steps.every((_, idx) => isStepExplicitlyCompleted(idx));
    };

    const getStepStatus = (idx: number) => {
        // Visual status only
        if (isStepExplicitlyCompleted(idx)) return 'completed';
        if (idx === currentStep) return 'current';
        return 'locked'; // Visual style for incomplete/future
    };

    // Initialize step
    useEffect(() => {
        if (isEditable) {
            // Find first incomplete step, considering explicit completion status
            let firstIncomplete = 0;
            const completed = data.completedSteps || [];
            for (let i = 0; i < steps.length; i++) {
                if (!completed.includes(i)) {
                    firstIncomplete = i;
                    break;
                }
                // If all done, stay on last
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

    // Explicit Confirm Logic
    const handleConfirmStep = () => {
        if (!isStepDataValid(currentStep)) return;
        
        const currentCompleted = data.completedSteps || [];
        if (!currentCompleted.includes(currentStep)) {
            const newCompleted = [...currentCompleted, currentStep];
            updateFeedbackProcess(feedback.id, { completedSteps: newCompleted });
        }
    };

    const handleSubmit = () => {
        if (!isAllStepsCompleted()) return;
        submitFeedbackAudit(feedback.id);
        onClose();
    };

    // Navigation Only
    const handleNavNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
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

    // Current Step Logic
    const currentField = steps[currentStep]?.field;
    const isLastStep = currentStep === steps.length - 1;
    const isCurrentStepValid = isStepDataValid(currentStep);
    const isCurrentStepCompleted = isStepExplicitlyCompleted(currentStep);
    const canSubmit = isAllStepsCompleted();

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
                        <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                            {steps[currentStep].label}
                            {isCurrentStepCompleted && <CheckCircle size={20} className="text-green-500" />}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            {isEditable 
                                ? (isCurrentStepCompleted ? '该环节已完成，可点击下一步' : '请完善信息并确认完成') 
                                : '该环节信息详情'}
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
            <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0 flex flex-col gap-3">
                {/* Standard Edit/Processing Mode */}
                {isEditable && (
                    <>
                        {/* Action Button: Either Confirm Step OR Submit Audit */}
                        {(!isLastStep || !canSubmit) && (
                            <button 
                                onClick={handleConfirmStep}
                                disabled={!isCurrentStepValid}
                                className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1
                                    ${!isCurrentStepValid 
                                        ? 'bg-slate-300 cursor-not-allowed' 
                                        : isCurrentStepCompleted ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
                            >
                                {isCurrentStepCompleted ? '已完成此环节 (点击更新)' : '确认完成该环节'}
                                <CheckCircle size={16} />
                            </button>
                        )}

                        {isLastStep && canSubmit && (
                            <button 
                                onClick={handleSubmit}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1 active:scale-95 animate-pulse"
                            >
                                提交审核 <Check size={16} />
                            </button>
                        )}

                        {/* Navigation Row */}
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
                                onClick={handleNavNext}
                                disabled={currentStep === steps.length - 1}
                                className={`flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-1 transition-colors
                                    ${currentStep === steps.length - 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                            >
                                下一步 <ChevronRight size={16} />
                            </button>
                        </div>
                    </>
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
    const { feedbacks, dispatchFeedback, resolveFeedback } = useApp();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'history'>('pending');
    const [selectedFeedback, setSelectedFeedback] = useState<DeviceFeedbackModel | null>(null);

    // Filter Logic
    const filteredFeedbacks = feedbacks.filter(f => {
        if (activeTab === 'pending') return f.status === 'pending_receive';
        if (activeTab === 'processing') return f.status === 'processing' || f.status === 'pending_audit';
        if (activeTab === 'history') return f.status === 'resolved' || f.status === 'false_alarm';
        return true;
    });

    const handleDispatch = (e: React.MouseEvent, id: string, method: FeedbackMethod) => {
        e.stopPropagation();
        dispatchFeedback(id, method);
    };

    const handleQuickResolve = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('确认为误报/无需处理？')) {
            resolveFeedback(id, 'false_alarm', 'System');
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3 shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-lg font-bold text-slate-800">设备反馈管理</h1>
            </div>

            {/* Tabs */}
            <div className="p-4 pb-0">
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'pending' ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        待接收 <span className="bg-red-100 text-red-600 px-1.5 rounded-full text-[10px]">{feedbacks.filter(f => f.status === 'pending_receive').length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('processing')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'processing' ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        处理中 <span className="bg-blue-100 text-blue-600 px-1.5 rounded-full text-[10px]">{feedbacks.filter(f => f.status === 'processing' || f.status === 'pending_audit').length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'history' ? 'bg-slate-100 text-slate-600 shadow-inner' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        历史记录
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredFeedbacks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-60 text-slate-400">
                        <MessageSquareWarning size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">暂无相关反馈</p>
                    </div>
                )}
                {filteredFeedbacks.map(f => (
                    <div 
                        key={f.id}
                        onClick={() => f.status !== 'pending_receive' && setSelectedFeedback(f)}
                        className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group transition-all ${f.status !== 'pending_receive' ? 'cursor-pointer hover:shadow-md' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800 text-sm">{f.deviceName}</span>
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{f.roomNumber}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1">{f.storeName} · {f.createTime}</div>
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-bold ${
                                f.status === 'pending_receive' ? 'bg-red-100 text-red-600 animate-pulse' :
                                f.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                                f.status === 'pending_audit' ? 'bg-orange-100 text-orange-600' :
                                'bg-green-100 text-green-600'
                            }`}>
                                {f.status === 'pending_receive' ? '待接收' :
                                 f.status === 'processing' ? '处理中' :
                                 f.status === 'pending_audit' ? '待审核' :
                                 f.status === 'resolved' ? '已解决' : '误报'}
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-700 border border-slate-100 mb-2 line-clamp-2">
                            {f.content}
                        </div>

                        {f.status === 'pending_receive' ? (
                            <div className="mt-3 pt-3 border-t border-slate-50">
                                <div className="flex gap-2 justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-500">选择处理方式:</span>
                                    <button 
                                        onClick={(e) => handleQuickResolve(e, f.id)}
                                        className="text-[10px] text-slate-400 underline decoration-dashed hover:text-slate-600"
                                    >
                                        标记误报
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={(e) => handleDispatch(e, f.id, 'remote')} className="py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded hover:bg-blue-100 border border-blue-100">远程连线</button>
                                    <button onClick={(e) => handleDispatch(e, f.id, 'onsite')} className="py-2 bg-purple-50 text-purple-600 text-xs font-bold rounded hover:bg-purple-100 border border-purple-100">上门处理</button>
                                    <button onClick={(e) => handleDispatch(e, f.id, 'self')} className="py-2 bg-green-50 text-green-600 text-xs font-bold rounded hover:bg-green-100 border border-green-100">自助处理</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    {f.processMethod === 'remote' ? <Headphones size={12} /> : f.processMethod === 'onsite' ? <MapPin size={12} /> : <MonitorPlay size={12} />}
                                    {f.processMethod === 'remote' ? '远程处理' : f.processMethod === 'onsite' ? '上门处理' : '自助处理'}
                                </div>
                                <span className="text-[10px] text-blue-500 flex items-center gap-1 font-bold group-hover:underline">
                                    查看详情 <ChevronRight size={12} />
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedFeedback && (
                <ProcessFlowModal 
                    feedback={selectedFeedback} 
                    onClose={() => setSelectedFeedback(null)} 
                />
            )}
        </div>
    );
};