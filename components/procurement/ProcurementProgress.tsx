import React, { useState } from 'react';
import { TrendingUp, Package, ChevronRight, CheckCircle, Truck, ClipboardList, Box, MapPin, X, ChevronLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProcurementOrder } from '../../types';

export const ProcurementProgress: React.FC = () => {
  const { procurementOrders, updateProcurementOrder } = useApp();
  
  // State for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<ProcurementOrder | null>(null);
  
  // Internal step view for detail page navigation (to review previous steps)
  const [viewingStep, setViewingStep] = useState<number>(1);

  // Constants
  const STEPS = [
      { id: 1, label: '确认订单', icon: ClipboardList },
      { id: 2, label: '备货', icon: Box },
      { id: 3, label: '出库打包', icon: Package },
      { id: 4, label: '物流', icon: Truck },
      { id: 5, label: '签收', icon: CheckCircle },
  ];

  // Helpers
  const openDetail = (order: ProcurementOrder) => {
      setSelectedOrder(order);
      // If pending, default to step 1 (Confirm Receive view). If active, go to current step.
      setViewingStep(order.status === 'pending_receive' ? 1 : Math.max(1, order.currentStep));
  };

  const handleConfirmReceive = (e: React.MouseEvent, orderId: string) => {
      e.stopPropagation();
      // Logic for list item button: Open modal and initiate receive flow
      const order = procurementOrders.find(o => o.id === orderId);
      if (order) openDetail(order);
  };

  // Detail Page Actions
  const handleConfirmOrderStart = () => {
      if (!selectedOrder) return;
      // Change status to purchasing, set step to 1 (Confirmed)
      updateProcurementOrder(selectedOrder.id, { status: 'purchasing', currentStep: 1 });
      setSelectedOrder(prev => prev ? ({ ...prev, status: 'purchasing', currentStep: 1 }) : null);
      setViewingStep(1);
  };

  const handleCompleteCurrentStep = () => {
      if (!selectedOrder) return;
      if (selectedOrder.currentStep < 5) {
          const nextStep = selectedOrder.currentStep + 1;
          const status = nextStep === 5 ? 'completed' : 'purchasing';
          
          updateProcurementOrder(selectedOrder.id, { currentStep: nextStep, status });
          setSelectedOrder(prev => prev ? ({ ...prev, currentStep: nextStep, status }) : null);
          setViewingStep(nextStep);
      }
  };

  const navigateStep = (direction: 'prev' | 'next') => {
      if (direction === 'prev' && viewingStep > 1) setViewingStep(viewingStep - 1);
      if (direction === 'next' && viewingStep < STEPS.length) setViewingStep(viewingStep + 1);
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-3">
        {procurementOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <TrendingUp size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">暂无采购订单</p>
                <p className="text-xs opacity-60 mt-1">请先在「内部下单」模块提交订单</p>
            </div>
        )}

        {procurementOrders.map(order => {
            const isPending = order.status === 'pending_receive';
            const isCompleted = order.status === 'completed';
            
            return (
                <div 
                    key={order.id} 
                    onClick={() => openDetail(order)}
                    className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-all relative overflow-hidden group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-800 text-sm">{order.storeName}</h4>
                                <span className="text-[10px] text-slate-400">{order.createTime.split(' ')[0]}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                                共 {order.items.reduce((sum, item) => sum + item.quantity, 0)} 件商品
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="font-bold text-orange-600 text-sm">¥ {order.totalPrice.toLocaleString()}</div>
                             <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mt-1 ${
                                 isPending ? 'bg-slate-100 text-slate-500' :
                                 isCompleted ? 'bg-green-100 text-green-700' :
                                 'bg-blue-100 text-blue-700'
                             }`}>
                                 {isPending ? '待接收' : isCompleted ? '已完成' : '采购中'}
                             </div>
                        </div>
                    </div>

                    {/* Pending Action */}
                    {isPending ? (
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
                            {/* Simple Progress Bar for List View */}
                            <div className="flex items-center gap-1">
                                {STEPS.map((step) => (
                                    <div key={step.id} className={`h-1.5 flex-1 rounded-full ${
                                        order.currentStep >= step.id ? 'bg-blue-500' : 'bg-slate-100'
                                    }`}></div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
                                <span>确认订单</span>
                                <span>签收</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}

        {/* Full Page Detail Modal */}
        {selectedOrder && (
             <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slideInRight">
                 {/* Header */}
                 <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp size={20} className="text-blue-600" />
                            采购进度详情
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">订单号: {selectedOrder.id}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20} className="text-slate-500" /></button>
                 </div>
                 
                 {/* Progress Bar Area */}
                 <div className="bg-slate-50 px-6 py-6 pb-12 flex-shrink-0">
                     <div className="relative flex items-center justify-between mb-2 px-1">
                        {/* Background Track */}
                        <div className="absolute top-1/2 left-0 right-0 h-3 bg-slate-200 -z-10 rounded-full" />
                        
                        {/* Active Progress */}
                        {(() => {
                            const total = STEPS.length;
                            const currentIdx = Math.min(Math.max(selectedOrder.currentStep - 1, 0), total - 1);
                            const viewingIdx = viewingStep - 1;
                            // Progress bar reflects actual completion, not just viewing
                            const progressWidth = Math.min(100, (currentIdx / (total - 1)) * 100);
                            
                            return (
                                <div 
                                    className="absolute top-1/2 left-0 h-3 bg-blue-500 -z-10 transition-all duration-500 rounded-full shadow-sm" 
                                    style={{ width: `${selectedOrder.status === 'pending_receive' ? 0 : progressWidth}%` }} 
                                />
                            );
                        })()}

                        {STEPS.map((step) => {
                            const isCompleted = selectedOrder.status !== 'pending_receive' && selectedOrder.currentStep >= step.id;
                            const isViewing = viewingStep === step.id;
                            
                            return (
                                <div key={step.id} className="z-10 flex flex-col items-center relative cursor-pointer" onClick={() => setViewingStep(step.id)}>
                                    <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all shadow-sm ${
                                        isViewing ? 'bg-white border-2 border-blue-600 scale-150' :
                                        isCompleted ? 'bg-blue-500 scale-110' : 
                                        'bg-slate-300'
                                    }`}>
                                    </div>
                                    <span className={`absolute top-6 text-[9px] font-bold whitespace-nowrap transition-colors ${
                                        isViewing ? 'text-blue-600 scale-110' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                     </div>
                 </div>

                 {/* Content Area */}
                 <div className="flex-1 overflow-y-auto p-4 bg-white relative">
                     <div className="max-w-md mx-auto h-full flex flex-col">
                         
                         {/* Step Title */}
                         <div className="mb-6 text-center">
                             <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                                 {React.createElement(STEPS.find(s => s.id === viewingStep)?.icon || ClipboardList, { size: 24, className: 'text-blue-500' })}
                                 {STEPS.find(s => s.id === viewingStep)?.label}
                             </h2>
                             <p className="text-xs text-slate-400 mt-1">
                                 {selectedOrder.status === 'pending_receive' ? '等待接收订单' : 
                                  selectedOrder.currentStep >= viewingStep ? '此环节已完成' : '等待进行此环节'}
                             </p>
                         </div>

                         {/* Content based on state */}
                         <div className="flex-1 space-y-4">
                             {/* Order Details (Always visible as context) */}
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

                             {/* Specific Step Instructions (Mock) */}
                             {selectedOrder.status === 'pending_receive' ? (
                                 <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                                     <p className="text-sm font-bold text-orange-700 mb-2">订单待接收</p>
                                     <p className="text-xs text-orange-600/80">请确认订单信息无误后点击下方按钮接收，开始采购流程。</p>
                                 </div>
                             ) : (
                                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                     <p className="text-sm font-bold text-blue-800 mb-2">当前环节任务</p>
                                     <p className="text-xs text-blue-600/80">
                                         {viewingStep === 1 && "核对订单详细信息，确认无误。"}
                                         {viewingStep === 2 && "联系供应商备货，确认货期。"}
                                         {viewingStep === 3 && "清点货物，打包出库。"}
                                         {viewingStep === 4 && "安排物流运输，跟踪单号。"}
                                         {viewingStep === 5 && "门店签收确认，流程结束。"}
                                     </p>
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>

                 {/* Footer Navigation & Actions */}
                 <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                     <div className="max-w-md mx-auto flex flex-col gap-3">
                         {/* Primary Action Button */}
                         {selectedOrder.status === 'pending_receive' ? (
                             <button 
                                onClick={handleConfirmOrderStart}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                             >
                                <CheckCircle size={18} /> 确认接收订单
                             </button>
                         ) : (
                             // Only show complete button if viewing the current active step
                             selectedOrder.currentStep === viewingStep && selectedOrder.currentStep < 5 && (
                                 <button 
                                    onClick={handleCompleteCurrentStep}
                                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                 >
                                    <CheckCircle size={18} /> 确认完成此环节
                                 </button>
                             )
                         )}

                         {/* Navigation Buttons */}
                         {selectedOrder.status !== 'pending_receive' && (
                             <div className="flex gap-3">
                                 <button 
                                    onClick={() => navigateStep('prev')}
                                    disabled={viewingStep <= 1}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                                 >
                                     <ChevronLeft size={16} /> 上一环节
                                 </button>
                                 <button 
                                    onClick={() => navigateStep('next')}
                                    disabled={viewingStep >= 5} // Can view ahead? Usually restricted to current progress. Let's allow viewing all but only acting on current.
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                                 >
                                     下一环节 <ChevronRight size={16} />
                                 </button>
                             </div>
                         )}
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
};