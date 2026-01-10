import React, { useState, ChangeEvent, useMemo } from 'react';
import { TrendingUp, Package, ChevronRight, CheckCircle, ClipboardList, Box, X, ChevronLeft, Check, Upload, Image as ImageIcon, AlertCircle, Camera, ClipboardCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProcurementOrder } from '../../types';
import { AuditGate } from '../DeviceComponents';

const MOCK_ASSETS = [
    'https://images.unsplash.com/photo-1599690925058-90e1a0b368a4?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550920760-72cb7c2fb74e?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop'
];

interface InboundOrdersProps {
    regionFilter: string;
}

export const InboundOrders: React.FC<InboundOrdersProps> = ({ regionFilter }) => {
  const { procurementOrders, updateProcurementOrder, approveProcurementOrder, stores } = useApp();
  
  // State for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<ProcurementOrder | null>(null);
  const [viewingStep, setViewingStep] = useState<number>(1);
  const [exampleImage, setExampleImage] = useState<{ title: string; url: string } | null>(null);
  
  // Audit State
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Constants
  const STEPS = [
      { id: 1, label: '确认订单', icon: ClipboardList },
      { id: 2, label: '备货', icon: Box },
      { id: 3, label: '出库', icon: Package },
  ];

  const EXAMPLE_IMAGES: Record<number, string> = {
      2: 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=600&auto=format&fit=crop', // Stocking
      3: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?q=80&w=600&auto=format&fit=crop', // Packing
  };

  const filteredOrders = useMemo(() => {
      return procurementOrders.filter(order => {
          if (regionFilter) {
              const store = stores.find(s => s.id === order.storeId);
              if (store?.regionId !== regionFilter) return false;
          }
          // Show ALL orders including archived (outbound/completed) to keep records
          return true;
      });
  }, [procurementOrders, regionFilter, stores]);

  const openDetail = (order: ProcurementOrder) => {
      setSelectedOrder(order);
      // Determine initial viewing step
      let initialStep = order.status === 'pending_receive' ? 1 : Math.max(1, order.currentStep);
      
      // If progressed beyond inbound, limit to Step 3 (Inbound Completion)
      if (order.currentStep > 3) {
          initialStep = 3;
      }

      setViewingStep(initialStep);
      setRejectMode(false);
      setRejectReason('');
  };

  const handleConfirmReceive = (e: React.MouseEvent, orderId: string) => {
      e.stopPropagation();
      const order = procurementOrders.find(o => o.id === orderId);
      if (order) openDetail(order);
  };

  const openExample = (stepId: number) => {
      const url = EXAMPLE_IMAGES[stepId];
      if (url) {
          const stepName = STEPS.find(s => s.id === stepId)?.label || '';
          setExampleImage({ title: `${stepName} - 示例图`, url });
      }
  };

  // --- Step Data Handlers ---
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, stepId: number) => {
      if (!selectedOrder) return;
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const currentStepData = selectedOrder.stepData?.[stepId] || {};
          const currentImages = currentStepData.images || [];
          
          const newStepData = {
              ...selectedOrder.stepData,
              [stepId]: {
                  ...currentStepData,
                  images: [...currentImages, url]
              }
          };

          updateProcurementOrder(selectedOrder.id, { stepData: newStepData });
          setSelectedOrder({ ...selectedOrder, stepData: newStepData });
          e.target.value = '';
      }
  };

  const handleSimulateImage = (stepId: number) => {
      if (!selectedOrder) return;
      const url = MOCK_ASSETS[Math.floor(Math.random() * MOCK_ASSETS.length)];
      const currentStepData = selectedOrder.stepData?.[stepId] || {};
      const currentImages = currentStepData.images || [];

      const newStepData = {
          ...selectedOrder.stepData,
          [stepId]: {
              ...currentStepData,
              images: [...currentImages, url]
          }
      };

      updateProcurementOrder(selectedOrder.id, { stepData: newStepData });
      setSelectedOrder({ ...selectedOrder, stepData: newStepData });
  };

  const handleRemoveImage = (stepId: number, imageIndex: number) => {
      if (!selectedOrder) return;
      const currentStepData = selectedOrder.stepData?.[stepId] || {};
      const currentImages = currentStepData.images || [];
      
      const newStepData = {
          ...selectedOrder.stepData,
          [stepId]: {
              ...currentStepData,
              images: currentImages.filter((_, i) => i !== imageIndex)
          }
      };

      updateProcurementOrder(selectedOrder.id, { stepData: newStepData });
      setSelectedOrder({ ...selectedOrder, stepData: newStepData });
  };

  // --- Actions ---
  const handleConfirmOrderStart = () => {
      if (!selectedOrder) return;
      
      const completionTime = new Date().toLocaleString();
      const currentStepData = selectedOrder.stepData?.[1] || {};
      const newStepData = {
          ...selectedOrder.stepData,
          [1]: {
              ...currentStepData,
              completionTime: completionTime
          }
      };

      const nextStep = 2;
      updateProcurementOrder(selectedOrder.id, { status: 'inbound_processing', currentStep: nextStep, stepData: newStepData });
      setSelectedOrder(prev => prev ? ({ ...prev, status: 'inbound_processing', currentStep: nextStep, stepData: newStepData }) : null);
      setViewingStep(nextStep);
  };

  const handleUpdateStep = () => {
      if (!selectedOrder) return;

      const completionTime = new Date().toLocaleString();
      const currentStepData = selectedOrder.stepData?.[viewingStep] || {};
      const newStepData = {
          ...selectedOrder.stepData,
          [viewingStep]: {
              ...currentStepData,
              completionTime: completionTime
          }
      };

      let nextState: Partial<ProcurementOrder> = { stepData: newStepData };

      if (viewingStep === 2) {
          nextState.currentStep = 3;
      }

      updateProcurementOrder(selectedOrder.id, nextState);
      setSelectedOrder(prev => prev ? ({ ...prev, ...nextState }) : null);
      
      if (nextState.currentStep) {
          setViewingStep(nextState.currentStep);
      }
  };

  const handleSubmitInboundAudit = () => {
      if (!selectedOrder) return;
      const completionTime = new Date().toLocaleString();
      const currentStepData = selectedOrder.stepData?.[3] || {};
      const newStepData = {
          ...selectedOrder.stepData,
          [3]: {
              ...currentStepData,
              completionTime: completionTime
          }
      };

      updateProcurementOrder(selectedOrder.id, { status: 'pending_inbound_audit', auditStatus: 'pending', stepData: newStepData });
      setSelectedOrder(prev => prev ? ({ ...prev, status: 'pending_inbound_audit', auditStatus: 'pending', stepData: newStepData }) : null);
  };

  const handleAuditApprove = () => {
      if (!selectedOrder) return;
      approveProcurementOrder(selectedOrder.id);
      setSelectedOrder(prev => prev ? ({ ...prev, status: 'outbound_processing', currentStep: 4, auditStatus: 'approved' }) : null);
      // Close modal as it moves out of inbound view scope technically, but we might want to stay
      // Actually, if it moves to outbound, in 'inbound' view it becomes archived.
      // So staying on modal is fine, it will switch to read-only.
  };

  const handleAuditReject = () => {
      if (!selectedOrder) return;
      if (!rejectReason.trim()) { alert('请输入驳回原因'); return; }
      
      updateProcurementOrder(selectedOrder.id, { status: 'inbound_processing', auditStatus: 'rejected', rejectReason });
      setSelectedOrder(prev => prev ? ({ ...prev, status: 'inbound_processing', auditStatus: 'rejected', rejectReason }) : null);
      setRejectMode(false);
  };

  const canCompleteViewingStep = useMemo(() => {
        if (!selectedOrder) return false;
        const stepData = selectedOrder.stepData?.[viewingStep] || {};
        if (viewingStep === 2 || viewingStep === 3) {
            return stepData.images && stepData.images.length > 0;
        }
        return true;
  }, [selectedOrder, viewingStep]);

  const navigateStep = (direction: 'prev' | 'next') => {
      if (direction === 'prev' && viewingStep > 1) setViewingStep(viewingStep - 1);
      const orderLimit = selectedOrder?.status === 'completed' ? 5 : selectedOrder?.currentStep || 1;
      const effectiveLimit = Math.min(3, orderLimit);
      if (direction === 'next' && viewingStep < effectiveLimit) setViewingStep(viewingStep + 1);
  };

  const getStepLabel = (stepId: number) => STEPS.find(s => s.id === stepId)?.label || '';
  const isViewingStepCompleted = !!selectedOrder?.stepData?.[viewingStep]?.completionTime;
  const isArchivedInbound = selectedOrder && ['outbound_processing', 'pending_outbound_audit', 'completed'].includes(selectedOrder.status);

  return (
    <div className="p-4 space-y-3">
        {filteredOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <TrendingUp size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">暂无入库订单</p>
            </div>
        )}

        {filteredOrders.map(order => {
            const isPending = order.status === 'pending_receive';
            const isAuditPending = order.status === 'pending_inbound_audit';
            const isAuditRejected = order.auditStatus === 'rejected' && ['pending_receive', 'inbound_processing'].includes(order.status);
            const isInboundComplete = ['outbound_processing', 'pending_outbound_audit', 'completed'].includes(order.status);

            let statusLabel = '进行中';
            if (isInboundComplete) statusLabel = '入库完成';
            else if (isPending) statusLabel = '待接收';
            else if (isAuditPending) statusLabel = '待审核';
            else if (isAuditRejected) statusLabel = '已驳回';
            else statusLabel = getStepLabel(order.currentStep);

            let progress = 0;
            if (isInboundComplete) {
                progress = 100;
            } else if (order.status === 'pending_receive') {
                progress = 0;
            } else {
                progress = ((Math.min(order.currentStep, 3) - 1) / 3) * 100;
                if (order.status === 'pending_inbound_audit') progress = 90; 
            }

            return (
                <div 
                    key={order.id} 
                    onClick={() => openDetail(order)}
                    className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer hover:shadow-md transition-all relative overflow-hidden group 
                        ${isInboundComplete ? 'border-blue-200' : isAuditRejected ? 'border-red-200' : 'border-slate-100'}
                    `}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-800 text-sm">{order.storeName}</h4>
                                <span className="text-[10px] text-slate-400">{order.createTime.split(' ')[0]}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 bg-slate-50 inline-block px-1 rounded border border-slate-100">
                                ID: {order.id}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                共 {order.items.reduce((sum, item) => sum + item.quantity, 0)} 件商品
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                                <div className="font-bold text-orange-600 text-sm">¥ {order.totalPrice.toLocaleString()}</div>
                                <div className="mt-1 text-right">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                        isInboundComplete ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        isPending ? 'bg-slate-50 text-slate-500 border-slate-200' :
                                        isAuditPending ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                        isAuditRejected ? 'bg-red-50 text-red-600 border-red-200' :
                                        'bg-blue-50 text-blue-600 border-blue-200'
                                    }`}>
                                        {statusLabel}
                                    </span>
                                </div>
                        </div>
                    </div>

                    {isPending && !isInboundComplete ? (
                        <div className="mt-3 pt-3 border-t border-slate-50 flex justify-end">
                                <button 
                                onClick={(e) => handleConfirmReceive(e, order.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 animate-pulse"
                                >
                                <CheckCircle size={14} /> 确认接收
                                </button>
                        </div>
                    ) : (
                        <div className="mt-3 pt-3 border-t border-slate-50">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                                <span>入库进度</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isAuditRejected ? 'bg-red-500' : 
                                        isAuditPending ? 'bg-orange-500' : 
                                        isInboundComplete ? 'bg-green-500' : 'bg-blue-500'
                                    }`} 
                                    style={{ width: `${Math.max(5, progress)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}

        {/* Modal */}
        {selectedOrder && (
             <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slideInRight">
                 <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp size={20} className="text-blue-600" />
                            入库流程详情
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">订单号: {selectedOrder.id}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20} className="text-slate-500" /></button>
                 </div>
                 
                 <div className="bg-slate-50 px-4 py-6 pb-10 flex-shrink-0">
                     <div className="relative flex items-center justify-between mb-2 px-8">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 z-0 rounded-full -translate-y-1/2" />
                        
                        {STEPS.map((step, idx) => {
                            const isCompleted = 
                                isArchivedInbound || 
                                selectedOrder.currentStep > step.id || 
                                (selectedOrder.currentStep === step.id && !!selectedOrder.stepData?.[step.id]?.completionTime);

                            const isCurrent = !isArchivedInbound && selectedOrder.currentStep === step.id;
                            const isViewing = viewingStep === step.id;

                            return (
                                <div key={step.id} className="z-10 flex flex-col items-center relative cursor-pointer group" onClick={() => setViewingStep(step.id)}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border-2 ${
                                        isCompleted ? 'bg-green-500 border-green-500 scale-110' : 
                                        isCurrent ? 'bg-white border-blue-600 scale-125 shadow-blue-200' :
                                        'bg-white border-slate-300'
                                    } ${isViewing && !isCurrent ? 'ring-2 ring-blue-200 ring-offset-2' : ''}`}>
                                        {isCompleted && <Check size={14} className="text-white" strokeWidth={3} />}
                                        {isCurrent && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />}
                                    </div>
                                    <span className={`absolute top-8 text-[10px] font-bold whitespace-nowrap transition-colors duration-300 ${
                                        isCurrent ? 'text-blue-600 scale-110' : 
                                        isCompleted ? 'text-green-600' : 
                                        'text-slate-400'
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                     </div>
                 </div>

                 <div className="flex-1 overflow-y-auto p-4 bg-white relative">
                     <div className="max-w-md mx-auto h-full flex flex-col">
                         
                         <div className="mb-6 text-center">
                             <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                                 {React.createElement(STEPS.find(s => s.id === viewingStep)?.icon || ClipboardList, { size: 24, className: 'text-blue-500' })}
                                 {STEPS.find(s => s.id === viewingStep)?.label}
                             </h2>
                             <div className="flex flex-col items-center gap-1 mt-1">
                                 {selectedOrder.stepData?.[viewingStep]?.completionTime ? (
                                     <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                         完成时间: {selectedOrder.stepData[viewingStep].completionTime}
                                     </span>
                                 ) : (
                                     <span className="text-xs text-slate-400">请完善此环节信息</span>
                                 )}
                             </div>
                         </div>

                         {selectedOrder.auditStatus === 'rejected' && selectedOrder.rejectReason && selectedOrder.status === 'inbound_processing' && (
                             <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3 text-red-800 text-xs flex items-start gap-2">
                                 <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                 <div>
                                     <span className="font-bold">审核驳回:</span> {selectedOrder.rejectReason}
                                     <div className="mt-1 opacity-70">请修改信息后重新提交审核</div>
                                 </div>
                             </div>
                         )}

                         <div className="flex-1 space-y-4">
                             {viewingStep === 1 && (
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">归属门店</span>
                                        <span className="font-bold text-slate-700">{selectedOrder.storeName}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">下单时间</span>
                                        <span className="font-bold text-slate-700">{selectedOrder.createTime}</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2">
                                        <p className="text-xs font-bold text-slate-500 mb-2">商品清单</p>
                                        <div className="space-y-2">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-100">
                                                    <div className="w-8 h-8 bg-slate-100 rounded flex-shrink-0 overflow-hidden">
                                                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Package size={16} className="m-auto mt-2 text-slate-300" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold truncate">{item.productName}</p>
                                                        <p className="text-[10px] text-slate-500">x {item.quantity}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             )}

                             {(viewingStep === 2 || viewingStep === 3) && (
                                 <div className="space-y-4">
                                     <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                                         <div className="flex justify-center items-center gap-2 mb-1">
                                             <p className="text-sm font-bold text-blue-800">
                                                 {viewingStep === 2 ? '备货清单拍照' : '出库打包拍照'}
                                             </p>
                                             <button 
                                                onClick={() => openExample(viewingStep)}
                                                className="text-[10px] text-blue-500 bg-white border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-50 flex items-center gap-0.5 transition-colors"
                                             >
                                                 <ImageIcon size={10} /> 示例
                                             </button>
                                         </div>
                                         <div className="grid grid-cols-3 gap-3 mt-3">
                                             {!isArchivedInbound && (
                                             <div className="aspect-square border-2 border-dashed border-blue-300 rounded-lg bg-white flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group">
                                                 <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, viewingStep)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                 <Upload size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                 <span className="text-[9px] text-blue-500 font-bold mt-1">上传</span>
                                             </div>
                                             )}
                                             
                                             {!isArchivedInbound && (
                                             <div onClick={() => handleSimulateImage(viewingStep)} className="aspect-square border-2 border-dashed border-blue-300 rounded-lg bg-white flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group">
                                                 <Camera size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                 <span className="text-[9px] text-blue-500 font-bold mt-1">拍照</span>
                                             </div>
                                             )}

                                             {selectedOrder.stepData?.[viewingStep]?.images?.map((url, idx) => (
                                                 <div key={idx} className="aspect-square rounded-lg border border-slate-200 overflow-hidden relative group bg-white">
                                                     <img src={url} className="w-full h-full object-cover" />
                                                     {!isArchivedInbound && (
                                                     <button 
                                                         onClick={() => handleRemoveImage(viewingStep, idx)} 
                                                         className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                     >
                                                         <X size={12} />
                                                     </button>
                                                     )}
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>

                 <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                     {selectedOrder.status === 'pending_inbound_audit' ? (
                         <div className="max-w-md mx-auto">
                             {rejectMode ? (
                                 <div className="animate-fadeIn space-y-3">
                                     <textarea 
                                        autoFocus
                                        placeholder="请输入驳回原因..."
                                        className="w-full p-2 text-xs border border-red-200 rounded bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-300 min-h-[60px]"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                     />
                                     <div className="flex gap-2">
                                         <button onClick={() => setRejectMode(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm">取消</button>
                                         <button onClick={handleAuditReject} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm shadow-md">确认驳回</button>
                                     </div>
                                 </div>
                             ) : (
                                 <div className="flex gap-3 mb-4">
                                     <AuditGate type="procurement" className="flex-1">
                                        <button onClick={() => setRejectMode(true)} className="w-full py-3 border border-red-200 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors text-sm">驳回</button>
                                     </AuditGate>
                                     <AuditGate type="procurement" className="flex-1">
                                        <button onClick={handleAuditApprove} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-sm transition-colors text-sm">
                                            入库审核通过
                                        </button>
                                     </AuditGate>
                                 </div>
                             )}
                         </div>
                     ) : (
                         <div className="max-w-md mx-auto flex flex-col gap-3">
                             {selectedOrder.status === 'pending_receive' ? (
                                 <button 
                                    onClick={handleConfirmOrderStart}
                                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                 >
                                    <CheckCircle size={18} /> 确认接收订单
                                 </button>
                             ) : isArchivedInbound ? (
                                 <div className="w-full py-3 bg-green-50 border border-green-200 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2">
                                     <CheckCircle size={18} /> 入库流程已归档
                                 </div>
                             ) : (
                                 (viewingStep === 3 && isViewingStepCompleted && selectedOrder.status === 'inbound_processing') ? (
                                     <div className="flex gap-2">
                                         <button 
                                            onClick={handleUpdateStep}
                                            className="flex-1 py-3 bg-slate-100 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all border border-blue-200"
                                         >
                                            更新信息
                                         </button>
                                         <button 
                                            onClick={handleSubmitInboundAudit}
                                            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                         >
                                            <ClipboardCheck size={18} /> 提交入库审核
                                         </button>
                                     </div>
                                 ) : (
                                     (viewingStep > selectedOrder.currentStep && selectedOrder.status !== 'pending_inbound_audit') ? (
                                         <button disabled className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-default">
                                             等待进行
                                         </button>
                                     ) : (
                                         <button 
                                            onClick={handleUpdateStep}
                                            disabled={!canCompleteViewingStep}
                                            className={`w-full py-3 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                                                canCompleteViewingStep 
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' 
                                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            }`}
                                         >
                                            <CheckCircle size={18} /> {isViewingStepCompleted ? '更新此环节信息' : '确认完成此环节'}
                                         </button>
                                     )
                                 )
                             )}

                             {selectedOrder.status !== 'pending_receive' && (
                                 <div className="flex gap-3">
                                     <button 
                                        onClick={() => navigateStep('prev')}
                                        disabled={viewingStep <= 1}
                                        className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                                     >
                                         <ChevronLeft size={16} /> 上一环节
                                     </button>
                                     
                                     {!(isArchivedInbound && viewingStep === 3) && (
                                     <button 
                                        onClick={() => navigateStep('next')}
                                        disabled={
                                            viewingStep >= 3 || 
                                            (viewingStep >= 3 && selectedOrder.status === 'inbound_processing')
                                        } 
                                        className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                                     >
                                         下一环节 <ChevronRight size={16} />
                                     </button>
                                     )}
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
             </div>
        )}
    </div>
  );
};