import React, { useState, ChangeEvent, useMemo } from 'react';
import { TrendingUp, Truck, ChevronRight, CheckCircle, MapPin, X, ChevronLeft, Check, Upload, Link, Clipboard, Image as ImageIcon, ExternalLink, AlertCircle, Plus, Camera, ClipboardCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProcurementOrder } from '../../types';
import { AuditGate } from '../DeviceComponents';

const MOCK_ASSETS = [
    'https://images.unsplash.com/photo-1599690925058-90e1a0b368a4?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550920760-72cb7c2fb74e?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop'
];

interface OutboundOrdersProps {
    regionFilter: string;
}

export const OutboundOrders: React.FC<OutboundOrdersProps> = ({ regionFilter }) => {
  const { procurementOrders, updateProcurementOrder, approveProcurementOrder, stores } = useApp();
  
  // State for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<ProcurementOrder | null>(null);
  const [viewingStep, setViewingStep] = useState<number>(4);
  const [exampleImage, setExampleImage] = useState<{ title: string; url: string } | null>(null);
  
  // Audit State
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Logistics Editing State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Constants
  const STEPS = [
      { id: 4, label: '物流', icon: Truck },
      { id: 5, label: '确认收货', icon: CheckCircle },
  ];

  const EXAMPLE_IMAGES: Record<number, string> = {
      5: 'https://images.unsplash.com/photo-1623126908029-58cb08a2b272?q=80&w=600&auto=format&fit=crop'  // Signed
  };

  const filteredOrders = useMemo(() => {
      return procurementOrders.filter(order => {
          if (regionFilter) {
              const store = stores.find(s => s.id === order.storeId);
              if (store?.regionId !== regionFilter) return false;
          }
          return ['outbound_processing', 'pending_outbound_audit', 'completed'].includes(order.status);
      });
  }, [procurementOrders, regionFilter, stores]);

  const openDetail = (order: ProcurementOrder) => {
      setSelectedOrder(order);
      // Determine initial viewing step (4 or 5)
      // Normalize to 4 if somehow lower
      setViewingStep(Math.max(4, order.currentStep));
      setRejectMode(false);
      setRejectReason('');
      setEditingItemId(null);
  };

  const openExample = (stepId: number) => {
      const url = EXAMPLE_IMAGES[stepId];
      if (url) {
          const stepName = STEPS.find(s => s.id === stepId)?.label || '';
          setExampleImage({ title: `${stepName} - 示例图`, url });
      }
  };

  // --- Image Handlers ---
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

  // --- Logistics Handlers (Step 4) ---
  const getLogisticsItems = () => {
      if (!selectedOrder) return [];
      const stepData = selectedOrder.stepData?.[4] || {};
      return stepData.logisticsItems || [];
  };

  const updateLogisticsItems = (items: { id: string; name: string; url: string; images?: string[] }[]) => {
      if (!selectedOrder) return;
      const currentStepData = selectedOrder.stepData?.[4] || {};
      const newStepData = {
          ...selectedOrder.stepData,
          [4]: {
              ...currentStepData,
              logisticsItems: items,
              logisticsLink: items.length > 0 ? items[0].url : ''
          }
      };
      updateProcurementOrder(selectedOrder.id, { stepData: newStepData });
      setSelectedOrder({ ...selectedOrder, stepData: newStepData });
  };

  const handleAddLogisticsItem = () => {
      const items = getLogisticsItems();
      const newItem = { id: `log-${Date.now()}`, name: `物流单号 ${items.length + 1}`, url: '', images: [] };
      updateLogisticsItems([...items, newItem]);
      setEditingItemId(newItem.id); 
  };

  const handleUpdateLogisticsItem = (id: string, field: 'name' | 'url', value: string) => {
      const items = getLogisticsItems().map(item => 
          item.id === id ? { ...item, [field]: value } : item
      );
      updateLogisticsItems(items);
  };

  const handleRemoveLogisticsItem = (id: string) => {
      const items = getLogisticsItems().filter(item => item.id !== id);
      updateLogisticsItems(items);
  };

  const handleLogisticsImageUpload = (itemId: string, e: ChangeEvent<HTMLInputElement>) => {
      if (!selectedOrder) return;
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const items = getLogisticsItems().map(item => {
              if (item.id === itemId) {
                  return { ...item, images: [...(item.images || []), url] };
              }
              return item;
          });
          updateLogisticsItems(items);
          e.target.value = '';
      }
  };

  const handleSimulateLogisticsImage = (itemId: string) => {
      const url = MOCK_ASSETS[Math.floor(Math.random() * MOCK_ASSETS.length)];
      const items = getLogisticsItems().map(item => {
          if (item.id === itemId) {
              return { ...item, images: [...(item.images || []), url] };
          }
          return item;
      });
      updateLogisticsItems(items);
  };

  const handleRemoveLogisticsImage = (itemId: string, index: number) => {
      const items = getLogisticsItems().map(item => {
          if (item.id === itemId) {
              return { ...item, images: (item.images || []).filter((_, i) => i !== index) };
          }
          return item;
      });
      updateLogisticsItems(items);
  };

  const handlePasteUrl = async (itemId: string) => {
      try {
          const text = await navigator.clipboard.readText();
          if (text) handleUpdateLogisticsItem(itemId, 'url', text);
      } catch (err) { console.debug('Clipboard fail'); }
  };

  const handleOpenLink = (url: string) => {
      if (!url) return;
      const href = url.startsWith('http') ? url : `https://${url}`;
      window.open(href, '_blank');
  };

  // --- Actions ---
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
      if (viewingStep === 4) {
          nextState.currentStep = 5;
      }

      updateProcurementOrder(selectedOrder.id, nextState);
      setSelectedOrder(prev => prev ? ({ ...prev, ...nextState }) : null);
      if (nextState.currentStep) setViewingStep(nextState.currentStep);
  };

  const handleSubmitOutboundAudit = () => {
      if (!selectedOrder) return;
      const completionTime = new Date().toLocaleString();
      const currentStepData = selectedOrder.stepData?.[5] || {};
      const newStepData = {
          ...selectedOrder.stepData,
          [5]: {
              ...currentStepData,
              completionTime: completionTime
          }
      };

      updateProcurementOrder(selectedOrder.id, { status: 'pending_outbound_audit', auditStatus: 'pending', stepData: newStepData });
      setSelectedOrder(prev => prev ? ({ ...prev, status: 'pending_outbound_audit', auditStatus: 'pending', stepData: newStepData }) : null);
  };

  const handleAuditApprove = () => {
      if (!selectedOrder) return;
      approveProcurementOrder(selectedOrder.id);
      setSelectedOrder(prev => prev ? ({ ...prev, status: 'completed', auditStatus: 'approved' }) : null);
  };

  const handleAuditReject = () => {
      if (!selectedOrder) return;
      if (!rejectReason.trim()) { alert('请输入驳回原因'); return; }
      
      updateProcurementOrder(selectedOrder.id, { status: 'outbound_processing', auditStatus: 'rejected', rejectReason });
      setSelectedOrder(prev => prev ? ({ ...prev, status: 'outbound_processing', auditStatus: 'rejected', rejectReason }) : null);
      setRejectMode(false);
  };

  const canCompleteViewingStep = useMemo(() => {
        if (!selectedOrder) return false;
        const stepData = selectedOrder.stepData?.[viewingStep] || {};

        if (viewingStep === 4) { // Logistics
            const items = stepData.logisticsItems || [];
            return items.length > 0 && items.every(i => i.url.trim() !== '' && i.images && i.images.length > 0);
        }
        if (viewingStep === 5) { // Receipt
            return stepData.images && stepData.images.length > 0;
        }
        return true;
  }, [selectedOrder, viewingStep]);

  const navigateStep = (direction: 'prev' | 'next') => {
      if (direction === 'prev' && viewingStep > 4) setViewingStep(viewingStep - 1);
      const orderLimit = selectedOrder?.status === 'completed' ? 5 : selectedOrder?.currentStep || 4;
      if (direction === 'next' && viewingStep < orderLimit) setViewingStep(viewingStep + 1);
  };

  const logisticsItems = useMemo(() => getLogisticsItems(), [selectedOrder]);
  const isCompleted = selectedOrder?.status === 'completed';
  const isViewingStepCompleted = !!selectedOrder?.stepData?.[viewingStep]?.completionTime;

  return (
    <div className="p-4 space-y-3">
        {filteredOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <TrendingUp size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">暂无出库订单</p>
            </div>
        )}

        {filteredOrders.map(order => {
            const isCompleted = order.status === 'completed';
            const isAuditPending = order.status === 'pending_outbound_audit';
            const isAuditRejected = order.auditStatus === 'rejected';
            
            // Steps 4, 5. Normalize 4->0, 5->1
            const progress = isCompleted ? 100 : (order.status === 'pending_outbound_audit' ? 90 : ((order.currentStep - 4) / 1) * 100);

            return (
                <div 
                    key={order.id} 
                    onClick={() => openDetail(order)}
                    className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer hover:shadow-md transition-all relative overflow-hidden group 
                        ${isAuditRejected ? 'border-red-200' : isCompleted ? 'border-green-200' : 'border-slate-100'}
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
                                        isCompleted ? 'bg-green-50 text-green-600 border-green-200' :
                                        isAuditPending ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                        isAuditRejected ? 'bg-red-50 text-red-600 border-red-200' :
                                        'bg-blue-50 text-blue-600 border-blue-200'
                                    }`}>
                                        {isCompleted ? '已完成' : isAuditPending ? '待审核' : isAuditRejected ? '已驳回' : '进行中'}
                                    </span>
                                </div>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-50">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                            <span>出库进度</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                    isAuditRejected ? 'bg-red-500' : 
                                    isAuditPending ? 'bg-orange-500' : 
                                    isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                }`} 
                                style={{ width: `${Math.max(5, progress)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            );
        })}

        {selectedOrder && (
             <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slideInRight">
                 <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp size={20} className="text-blue-600" />
                            出库流程详情
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">订单号: {selectedOrder.id}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20} className="text-slate-500" /></button>
                 </div>
                 
                 <div className="bg-slate-50 px-4 py-6 pb-10 flex-shrink-0">
                     <div className="relative flex items-center justify-between mb-2 px-16">
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 z-0 rounded-full -translate-y-1/2" />
                        
                        {STEPS.map((step, idx) => {
                            const isCompleted = 
                                selectedOrder.status === 'completed' || 
                                selectedOrder.currentStep > step.id || 
                                (selectedOrder.currentStep === step.id && !!selectedOrder.stepData?.[step.id]?.completionTime);

                            const isCurrent = selectedOrder.currentStep === step.id;
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
                                 {React.createElement(STEPS.find(s => s.id === viewingStep)?.icon || Truck, { size: 24, className: 'text-blue-500' })}
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

                         {selectedOrder.auditStatus === 'rejected' && selectedOrder.rejectReason && selectedOrder.status === 'outbound_processing' && (
                             <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3 text-red-800 text-xs flex items-start gap-2">
                                 <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                 <div>
                                     <span className="font-bold">审核驳回:</span> {selectedOrder.rejectReason}
                                     <div className="mt-1 opacity-70">请修改信息后重新提交审核</div>
                                 </div>
                             </div>
                         )}

                         <div className="flex-1 space-y-4">
                             {viewingStep === 4 && (
                                 <div className="space-y-4">
                                     <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                         <div className="flex justify-between items-center mb-3">
                                             <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                 <Link size={12} /> 物流信息
                                             </label>
                                             {!isCompleted && (
                                             <button 
                                                 onClick={handleAddLogisticsItem}
                                                 className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1"
                                             >
                                                 <Plus size={10} /> 添加物流
                                             </button>
                                             )}
                                         </div>
                                         
                                         {logisticsItems.length === 0 && (
                                             <div className="text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                                                 暂无物流信息
                                             </div>
                                         )}

                                         <div className="space-y-4">
                                             {logisticsItems.map((item) => {
                                                 const isEditing = editingItemId === item.id;
                                                 return (
                                                     <div key={item.id} className="bg-slate-50 rounded-lg border border-slate-200 p-2 space-y-2">
                                                         {isEditing ? (
                                                             <div className="space-y-2">
                                                                 <div className="flex gap-2">
                                                                     <input 
                                                                         type="text" 
                                                                         placeholder="名称 (如: 顺丰)"
                                                                         className="w-1/3 text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 bg-white"
                                                                         value={item.name}
                                                                         onChange={(e) => handleUpdateLogisticsItem(item.id, 'name', e.target.value)}
                                                                     />
                                                                     <div className="flex-1 flex gap-1">
                                                                         <input 
                                                                             type="text" 
                                                                             placeholder="单号"
                                                                             className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 bg-white"
                                                                             value={item.url}
                                                                             onChange={(e) => handleUpdateLogisticsItem(item.id, 'url', e.target.value)}
                                                                         />
                                                                         <button onClick={() => handlePasteUrl(item.id)} className="bg-white border border-slate-300 rounded px-2"><Clipboard size={14} /></button>
                                                                     </div>
                                                                 </div>
                                                                 <div className="flex justify-end">
                                                                     <button onClick={() => setEditingItemId(null)} className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 font-bold">
                                                                         <Check size={12} /> 完成
                                                                     </button>
                                                                 </div>
                                                             </div>
                                                         ) : (
                                                             <div className="flex justify-between items-center px-1">
                                                                 <div className="flex-1 min-w-0 pr-2">
                                                                     <div className="text-xs font-bold text-slate-700">{item.name}</div>
                                                                     <div className="text-[10px] text-slate-500 truncate">{item.url || '暂无单号'}</div>
                                                                 </div>
                                                                 <div className="flex gap-2 shrink-0">
                                                                     <button onClick={() => handleOpenLink(item.url)} className="text-[10px] text-blue-600 bg-white border border-blue-200 px-2 py-1 rounded">跳转</button>
                                                                     {!isCompleted && (
                                                                     <>
                                                                     <button onClick={() => setEditingItemId(item.id)} className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded">编辑</button>
                                                                     <button onClick={() => handleRemoveLogisticsItem(item.id)} className="text-[10px] text-red-500 bg-white border border-red-200 px-2 py-1 rounded">删除</button>
                                                                     </>
                                                                     )}
                                                                 </div>
                                                             </div>
                                                         )}
                                                         
                                                         <div className="mt-2 bg-white rounded border border-slate-100 p-2">
                                                             <div className="grid grid-cols-4 gap-2">
                                                                 {!isCompleted && (
                                                                 <div className="aspect-square border border-dashed border-blue-200 rounded bg-blue-50/50 flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group">
                                                                     <input type="file" accept="image/*" onChange={(e) => handleLogisticsImageUpload(item.id, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                                     <Upload size={14} className="text-blue-400" />
                                                                 </div>
                                                                 )}
                                                                 {!isCompleted && (
                                                                 <div onClick={() => handleSimulateLogisticsImage(item.id)} className="aspect-square border border-dashed border-blue-200 rounded bg-blue-50/50 flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group">
                                                                     <Camera size={14} className="text-blue-400" />
                                                                 </div>
                                                                 )}
                                                                 {item.images?.map((url, imgIdx) => (
                                                                     <div key={imgIdx} className="aspect-square rounded border border-slate-200 overflow-hidden relative group bg-white">
                                                                         <img src={url} className="w-full h-full object-cover" />
                                                                         {!isCompleted && (
                                                                         <button onClick={() => handleRemoveLogisticsImage(item.id, imgIdx)} className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"><X size={8} /></button>
                                                                         )}
                                                                     </div>
                                                                 ))}
                                                             </div>
                                                         </div>
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {viewingStep === 5 && (
                                 <div className="space-y-4">
                                     <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                                         <div className="flex justify-center items-center gap-2 mb-1">
                                             <p className="text-sm font-bold text-blue-800">
                                                 确认收货现场拍照
                                             </p>
                                             <button 
                                                onClick={() => openExample(viewingStep)}
                                                className="text-[10px] text-blue-500 bg-white border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-50 flex items-center gap-0.5 transition-colors"
                                             >
                                                 <ImageIcon size={10} /> 示例
                                             </button>
                                         </div>
                                         <div className="grid grid-cols-3 gap-3 mt-3">
                                             {!isCompleted && (
                                             <div className="aspect-square border-2 border-dashed border-blue-300 rounded-lg bg-white flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group">
                                                 <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, viewingStep)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                 <Upload size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                 <span className="text-[9px] text-blue-500 font-bold mt-1">上传</span>
                                             </div>
                                             )}
                                             
                                             {!isCompleted && (
                                             <div onClick={() => handleSimulateImage(viewingStep)} className="aspect-square border-2 border-dashed border-blue-300 rounded-lg bg-white flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group">
                                                 <Camera size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                 <span className="text-[9px] text-blue-500 font-bold mt-1">拍照</span>
                                             </div>
                                             )}

                                             {selectedOrder.stepData?.[viewingStep]?.images?.map((url, idx) => (
                                                 <div key={idx} className="aspect-square rounded-lg border border-slate-200 overflow-hidden relative group bg-white">
                                                     <img src={url} className="w-full h-full object-cover" />
                                                     {!isCompleted && (
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
                     {selectedOrder.status === 'pending_outbound_audit' ? (
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
                                            出库审核通过
                                        </button>
                                     </AuditGate>
                                 </div>
                             )}
                         </div>
                     ) : (
                         <div className="max-w-md mx-auto flex flex-col gap-3">
                             {(viewingStep === 5 && isViewingStepCompleted && selectedOrder.status === 'outbound_processing') ? (
                                 <div className="flex gap-2">
                                     <button 
                                        onClick={handleUpdateStep}
                                        className="flex-1 py-3 bg-slate-100 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all border border-blue-200"
                                     >
                                        更新信息
                                     </button>
                                     <button 
                                        onClick={handleSubmitOutboundAudit}
                                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                     >
                                        <ClipboardCheck size={18} /> 提交出库审核
                                     </button>
                                 </div>
                             ) : (
                                 (viewingStep > selectedOrder.currentStep && !isCompleted && selectedOrder.status !== 'pending_outbound_audit') ? (
                                     <button disabled className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-default">
                                         等待进行
                                     </button>
                                 ) : (
                                     !isCompleted && (
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

                             <div className="flex gap-3">
                                 <button 
                                    onClick={() => navigateStep('prev')}
                                    disabled={viewingStep <= 4}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                                 >
                                     <ChevronLeft size={16} /> 上一环节
                                 </button>
                                 
                                 <button 
                                    onClick={() => navigateStep('next')}
                                    disabled={viewingStep >= 5 || (viewingStep >= 5 && isCompleted)} 
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                                 >
                                     下一环节 <ChevronRight size={16} />
                                 </button>
                             </div>
                         </div>
                     )}
                 </div>
             </div>
        )}
    </div>
  );
};