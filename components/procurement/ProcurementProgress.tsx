import React, { useState } from 'react';
import { TrendingUp, Package, ChevronRight, CheckCircle, Truck, ClipboardList, Box, MapPin, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProcurementOrder } from '../../types';

export const ProcurementProgress: React.FC = () => {
  const { procurementOrders, updateProcurementOrder } = useApp();
  
  // State for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<ProcurementOrder | null>(null);

  // Handlers
  const handleConfirmReceive = (e: React.MouseEvent, orderId: string) => {
      e.stopPropagation();
      if (window.confirm('确认接收此订单？订单将进入采购流程。')) {
          // Status becomes purchasing, Step 1 (Confirmed) is done
          updateProcurementOrder(orderId, { status: 'purchasing', currentStep: 1 });
      }
  };

  const handleStepAdvance = (orderId: string, currentStep: number) => {
      // Logic for demonstration to move through steps
      if (currentStep < 5) {
          const nextStep = currentStep + 1;
          const status = nextStep === 5 ? 'completed' : 'purchasing';
          updateProcurementOrder(orderId, { currentStep: nextStep, status });
          
          // Update local state if modal is open
          if (selectedOrder && selectedOrder.id === orderId) {
             setSelectedOrder(prev => prev ? ({ ...prev, currentStep: nextStep, status }) : null);
          }
      }
  };

  const STEPS = [
      { id: 1, label: '确认订单', icon: ClipboardList },
      { id: 2, label: '备货', icon: Box },
      { id: 3, label: '出库打包', icon: Package },
      { id: 4, label: '物流', icon: Truck },
      { id: 5, label: '签收', icon: CheckCircle },
  ];

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
                    onClick={() => setSelectedOrder(order)}
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
                                    <div key={step.id} className={`h-1 flex-1 rounded-full ${
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

        {/* Detail Modal */}
        {selectedOrder && (
             <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                 <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
                     <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-600" />
                                采购进度详情
                            </h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">订单号: {selectedOrder.id}</p>
                        </div>
                        <button onClick={() => setSelectedOrder(null)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto p-4 space-y-6">
                         {/* Stepper */}
                         {selectedOrder.status !== 'pending_receive' && (
                             <div className="relative pb-4">
                                 <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100 z-0"></div>
                                 <div className="space-y-6 relative z-10">
                                     {STEPS.map((step) => {
                                         const isCompleted = selectedOrder.currentStep >= step.id;
                                         const isCurrent = selectedOrder.currentStep === step.id;
                                         
                                         return (
                                             <div key={step.id} className="flex items-start gap-3">
                                                 <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 bg-white transition-colors ${
                                                     isCompleted ? 'border-blue-500 text-blue-500' : 'border-slate-200 text-slate-300'
                                                 }`}>
                                                     <step.icon size={14} />
                                                 </div>
                                                 <div className="pt-1">
                                                     <p className={`text-xs font-bold ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                                                     {isCurrent && !isCompleted && <p className="text-[10px] text-blue-500">进行中...</p>}
                                                     {isCompleted && <p className="text-[10px] text-green-600">已完成</p>}
                                                 </div>
                                             </div>
                                         )
                                     })}
                                 </div>
                                 
                                 {/* Demo Button to Advance Step */}
                                 {selectedOrder.status !== 'completed' && (
                                     <button 
                                        onClick={() => handleStepAdvance(selectedOrder.id, selectedOrder.currentStep)}
                                        className="mt-6 w-full py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded hover:bg-slate-200"
                                     >
                                        [演示] 进入下一环节
                                     </button>
                                 )}
                             </div>
                         )}

                         {selectedOrder.status === 'pending_receive' && (
                             <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-center">
                                 <p className="text-sm font-bold text-orange-700 mb-2">订单待接收</p>
                                 <p className="text-xs text-orange-600/80 mb-4">请确认订单信息无误后点击接收，开始采购流程。</p>
                                 <button 
                                    onClick={(e) => { handleConfirmReceive(e, selectedOrder.id); setSelectedOrder(prev => prev ? ({...prev, status: 'purchasing', currentStep: 1}) : null); }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                                 >
                                    确认接收
                                 </button>
                             </div>
                         )}

                         {/* Order Info */}
                         <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2">
                             <div className="flex justify-between text-xs">
                                 <span className="text-slate-500">归属门店</span>
                                 <span className="font-bold text-slate-700">{selectedOrder.storeName}</span>
                             </div>
                             <div className="flex justify-between text-xs">
                                 <span className="text-slate-500">下单时间</span>
                                 <span className="font-bold text-slate-700">{selectedOrder.createTime}</span>
                             </div>
                             <div className="flex justify-between text-xs">
                                 <span className="text-slate-500">备注说明</span>
                                 <span className="font-bold text-slate-700 text-right max-w-[60%]">{selectedOrder.remark}</span>
                             </div>
                             <div className="border-t border-slate-200 pt-2 mt-2">
                                 <p className="text-xs font-bold text-slate-500 mb-2">商品清单</p>
                                 <div className="space-y-2">
                                     {selectedOrder.items.map((item, idx) => (
                                         <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-100">
                                             <div className="w-8 h-8 bg-slate-100 rounded flex-shrink-0 overflow-hidden">
                                                 {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Package size={16} className="m-auto mt-2 text-slate-300" />}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                 <p className="text-xs font-bold truncate">{item.productName}</p>
                                                 <p className="text-[10px] text-slate-500">¥ {item.price} x {item.quantity}</p>
                                             </div>
                                             <div className="text-xs font-bold text-slate-700">¥ {(item.price * item.quantity).toLocaleString()}</div>
                                         </div>
                                     ))}
                                 </div>
                                 <div className="flex justify-end mt-2 pt-2 border-t border-dashed border-slate-200">
                                     <span className="text-sm font-bold text-orange-600">总计: ¥ {selectedOrder.totalPrice.toLocaleString()}</span>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
};
