import React, { useState, ChangeEvent, useMemo } from 'react';
import { TrendingUp, Package, ChevronRight, CheckCircle, Truck, ClipboardList, Box, MapPin, X, ChevronLeft, Check, Upload, Link, Copy, Clipboard, FileText, Image as ImageIcon, ExternalLink, Calendar, AlertCircle, Plus, Trash2, Edit2, Store, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProcurementOrder, Region } from '../../types';
import { AuditGate } from '../DeviceComponents';

export const ProcurementProgress: React.FC = () => {
  const { procurementOrders, updateProcurementOrder, approveProcurementOrder, regions, stores } = useApp();
  
  // State for Filters
  const [regionFilter, setRegionFilter] = useState('');

  // State for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<ProcurementOrder | null>(null);
  
  // Internal step view for detail page navigation (to review previous steps)
  const [viewingStep, setViewingStep] = useState<number>(1);

  // Example Image State
  const [exampleImage, setExampleImage] = useState<{ title: string; url: string } | null>(null);

  // Audit State
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Logistics Editing State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Constants
  const STEPS = [
      { id: 1, label: '确认订单', icon: ClipboardList },
      { id: 2, label: '备货', icon: Box },
      { id: 3, label: '出库打包', icon: Package },
      { id: 4, label: '物流', icon: Truck },
      { id: 5, label: '签收', icon: CheckCircle },
  ];

  // Example Images Map
  const EXAMPLE_IMAGES: Record<number, string> = {
      2: 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=600&auto=format&fit=crop', // Stocking
      3: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?q=80&w=600&auto=format&fit=crop', // Packing
      5: 'https://images.unsplash.com/photo-1623126908029-58cb08a2b272?q=80&w=600&auto=format&fit=crop'  // Signed
  };

  // --- Helper for Region Label with Detailed Order Counts ---
  const getRegionLabel = (region: Region) => {
      const regionOrders = procurementOrders.filter(o => {
          const store = stores.find(s => s.id === o.storeId);
          return store?.regionId === region.id;
      });
      
      const total = regionOrders.length;
      const pendingReceive = regionOrders.filter(o => o.status === 'pending_receive').length;
      const pendingAudit = regionOrders.filter(o => o.auditStatus === 'pending').length;
      // In Progress: status is purchasing, and not pending audit (which is technically purchasing but waiting)
      const inProgress = regionOrders.filter(o => o.status === 'purchasing' && o.auditStatus !== 'pending').length;

      let label = `${region.name} (总:${total}`;
      if (pendingReceive > 0) label += ` 待接:${pendingReceive}`;
      if (inProgress > 0) label += ` 进行:${inProgress}`;
      if (pendingAudit > 0) label += ` 待审:${pendingAudit}`;
      label += `)`;
      return label;
  };

  const getAllRegionsLabel = () => {
      const total = procurementOrders.length;
      return `全部大区 (总:${total})`;
  };

  // Filter Logic
  const filteredOrders = useMemo(() => {
      return procurementOrders.filter(order => {
          if (regionFilter) {
              const store = stores.find(s => s.id === order.storeId);
              if (store?.regionId !== regionFilter) return false;
          }
          return true;
      });
  }, [procurementOrders, regionFilter, stores]);

  // Helpers
  const openDetail = (order: ProcurementOrder) => {
      setSelectedOrder(order);
      // If pending, default to step 1 (Confirm Receive view). If active, go to current step.
      setViewingStep(order.status === 'pending_receive' ? 1 : Math.max(1, order.currentStep));
      setRejectMode(false);
      setRejectReason('');
      setEditingItemId(null);
  };

  const handleConfirmReceive = (e: React.MouseEvent, orderId: string) => {
      e.stopPropagation();
      // Logic for list item button: Open modal and initiate receive flow
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
      // Backward compatibility: If legacy string exists and items array is empty, wrap it
      if ((!stepData.logisticsItems || stepData.logisticsItems.length === 0) && stepData.logisticsLink) {
          return [{ id: 'legacy', name: '物流链接', url: stepData.logisticsLink }];
      }
      return stepData.logisticsItems || [];
  };

  const updateLogisticsItems = (items: { id: string; name: string; url: string; }[]) => {
      if (!selectedOrder) return;
      const currentStepData = selectedOrder.stepData?.[4] || {};
      const newStepData = {
          ...selectedOrder.stepData,
          [4]: {
              ...currentStepData,
              logisticsItems: items,
              // Keep legacy field synced with first item url if available, or clear it
              logisticsLink: items.length > 0 ? items[0].url : ''
          }
      };
      updateProcurementOrder(selectedOrder.id, { stepData: newStepData });
      setSelectedOrder({ ...selectedOrder, stepData: newStepData });
  };

  const handleAddLogisticsItem = () => {
      const items = getLogisticsItems();
      const newItem = { id: `log-${Date.now()}`, name: `物流单号 ${items.length + 1}`, url: '' };
      updateLogisticsItems([...items, newItem]);
      setEditingItemId(newItem.id); // Auto-enter edit mode
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

  const handlePasteUrl = async (itemId: string) => {
      try {
          const text = await navigator.clipboard.readText();
          if (text) {
              handleUpdateLogisticsItem(itemId, 'url', text);
          }
      } catch (err) {
          // Fallback or ignore if permission denied
          console.debug('Clipboard read failed', err);
      }
  };

  const handleOpenLink = (url: string) => {
      if (!url) return;
      // Basic check to prepend http if missing
      const href = url.startsWith('http') ? url : `https://${url}`;
      window.open(href, '_blank');
  };

  // --- Actions ---

  const handleConfirmOrderStart = () => {
      if (!selectedOrder) return;
      
      // Step 1 completed now
      const completionTime = new Date().toLocaleString();
      const currentStepData = selectedOrder.stepData?.[1] || {};
      const newStepData = {
          ...selectedOrder.stepData,
          [1]: {
              ...currentStepData,
              completionTime: completionTime
          }
      };

      // Change status to purchasing.
      // Automatically skip Step 1 (Confirm Order) as "completed" and move to Step 2 (Stocking)
      const nextStep = 2;
      
      updateProcurementOrder(selectedOrder.id, { status: 'purchasing', currentStep: nextStep, stepData: newStepData });
      setSelectedOrder(prev => prev ? ({ ...prev, status: 'purchasing', currentStep: nextStep, stepData: newStepData }) : null);
      setViewingStep(nextStep);
  };

  const handleUpdateStep = () => {
      if (!selectedOrder) return;

      const completionTime = new Date().toLocaleString();
      
      // Update completion time for VIEWING step
      const currentStepData = selectedOrder.stepData?.[viewingStep] || {};
      const newStepData = {
          ...selectedOrder.stepData,
          [viewingStep]: {
              ...currentStepData,
              completionTime: completionTime
          }
      };

      // Determine flow
      const currentOrderId = selectedOrder.id;
      let nextState: Partial<ProcurementOrder> = { stepData: newStepData };

      // If we are at the "current" step (not completed yet), move forward unless it's step 5
      if (viewingStep === selectedOrder.currentStep && selectedOrder.status !== 'completed' && viewingStep < 5) {
          nextState.currentStep = selectedOrder.currentStep + 1;
      }
      
      updateProcurementOrder(currentOrderId, nextState);
      setSelectedOrder(prev => prev ? ({ ...prev, ...nextState }) : null);
      
      // If advancing, optionally move view
      if (nextState.currentStep && nextState.currentStep !== selectedOrder.currentStep) {
          setViewingStep(nextState.currentStep);
      }
  };

  // Audit Actions
  const handleAuditSubmit = () => {
      if (!selectedOrder) return;
      updateProcurementOrder(selectedOrder.id, { auditStatus: 'pending' });
      setSelectedOrder(prev => prev ? ({ ...prev, auditStatus: 'pending' }) : null);
  };

  const handleAuditApprove = () => {
      if (!selectedOrder) return;
      // This function now triggers device creation
      approveProcurementOrder(selectedOrder.id);
      
      // Manually update local state to reflect changes without full re-fetch if context is slow
      setSelectedOrder(prev => prev ? ({ ...prev, auditStatus: 'approved', status: 'completed' }) : null);
  };

  const handleAuditReject = () => {
      if (!selectedOrder) return;
      if (!rejectReason.trim()) {
          alert('请输入驳回原因');
          return;
      }
      updateProcurementOrder(selectedOrder.id, { auditStatus: 'rejected', rejectReason: rejectReason });
      setSelectedOrder(prev => prev ? ({ ...prev, auditStatus: 'rejected', rejectReason: rejectReason }) : null);
      setRejectMode(false);
  };

  const canCompleteViewingStep = useMemo(() => {
        if (!selectedOrder) return false;
        
        const stepData = selectedOrder.stepData?.[viewingStep] || {};

        if (viewingStep === 2) { // Stocking
            return stepData.images && stepData.images.length > 0;
        }
        if (viewingStep === 3) { // Packing
            return stepData.images && stepData.images.length > 0;
        }
        if (viewingStep === 4) { // Logistics
            const items = stepData.logisticsItems || [];
            // If legacy link exists and no items, consider it valid
            if (items.length === 0 && stepData.logisticsLink) return true;
            // Valid if there is at least one item with a URL
            return items.length > 0 && items.some(i => i.url.trim() !== '');
        }
        if (viewingStep === 5) { // Signed
            return stepData.images && stepData.images.length > 0;
        }
        return true;
  }, [selectedOrder, viewingStep]);

  const navigateStep = (direction: 'prev' | 'next') => {
      if (direction === 'prev' && viewingStep > 1) setViewingStep(viewingStep - 1);
      if (direction === 'next' && viewingStep < STEPS.length) setViewingStep(viewingStep + 1);
  };

  const getStepLabel = (stepId: number) => STEPS.find(s => s.id === stepId)?.label || '';

  // Is Step 5 completed in data?
  const isStep5Completed = !!selectedOrder?.stepData?.[5]?.completionTime;
  
  // Is Viewing Step completed?
  const isViewingStepCompleted = !!selectedOrder?.stepData?.[viewingStep]?.completionTime;

  // We allow editing always except strictly read-only views if any (requirement says editable)
  const isEditable = selectedOrder?.status !== 'pending_receive'; 

  // Logistics Items Helper
  const logisticsItems = useMemo(() => getLogisticsItems(), [selectedOrder]);

  return (
    <div className="h-full flex flex-col relative">
        {/* Header / Filter - Fixed at Top */}
        <div className="bg-white p-4 shrink-0 shadow-sm border-b border-slate-100 z-10">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                <Store size={12} /> 大区筛选
            </h3>
            <div className="relative">
                <select 
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                >
                    <option value="">{getAllRegionsLabel()}</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{getRegionLabel(r)}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <TrendingUp size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-medium">暂无采购订单</p>
                    <p className="text-xs opacity-60 mt-1">请先在「客户下单」模块提交订单</p>
                </div>
            )}

            {filteredOrders.map(order => {
                const isPending = order.status === 'pending_receive';
                const isCompleted = order.status === 'completed'; // Means Audit Approved
                const isAuditPending = order.auditStatus === 'pending';
                const isAuditRejected = order.auditStatus === 'rejected';
                
                let currentStepLabel = isPending ? '待接收' : getStepLabel(order.currentStep);
                if (isCompleted) currentStepLabel = '已完成';
                else if (isAuditPending) currentStepLabel = '待审核';
                else if (isAuditRejected) currentStepLabel = '已驳回';

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
                                {/* Added Order ID display */}
                                <div className="text-[10px] text-slate-400 mt-0.5 bg-slate-50 inline-block px-1 rounded border border-slate-100">
                                    ID: {order.id}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    共 {order.items.reduce((sum, item) => sum + item.quantity, 0)} 件商品
                                </div>
                                
                                <div className="mt-1.5 space-y-1">
                                    {order.expectDeliveryDate && (
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <Calendar size={10} className="text-blue-500" />
                                            期望交货: <span className="font-bold text-slate-700">{order.expectDeliveryDate}</span>
                                        </div>
                                    )}
                                    {order.remark && (
                                        <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded flex items-start gap-1">
                                            <FileText size={10} className="mt-0.5 shrink-0 text-slate-400" />
                                            <span className="line-clamp-1">{order.remark}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                 <div className="font-bold text-orange-600 text-sm">¥ {order.totalPrice.toLocaleString()}</div>
                                 <div className="mt-1 text-right">
                                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                         isPending ? 'bg-slate-50 text-slate-500 border-slate-200' :
                                         isCompleted ? 'bg-green-50 text-green-600 border-green-200' :
                                         isAuditPending ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                         isAuditRejected ? 'bg-red-50 text-red-600 border-red-200' :
                                         'bg-blue-50 text-blue-600 border-blue-200'
                                     }`}>
                                         当前: {currentStepLabel}
                                     </span>
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
                                            order.currentStep > step.id || isCompleted ? 'bg-green-500' : 
                                            order.currentStep === step.id ? (isAuditRejected ? 'bg-red-500' : isAuditPending ? 'bg-orange-500' : 'bg-blue-500') : 'bg-slate-100'
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
        </div>

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
                 <div className="bg-slate-50 px-6 py-8 pb-12 flex-shrink-0">
                     <div className="relative flex items-center justify-between mb-2 px-2">
                        {/* Background Track */}
                        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-200 z-0 rounded-full -translate-y-1/2" />
                        
                        {/* Active Progress */}
                        {(() => {
                            const total = STEPS.length;
                            const currentIdx = Math.min(Math.max(selectedOrder.currentStep - 1, 0), total - 1);
                            
                            // Progress bar reflects current position
                            const progressWidth = Math.min(100, (currentIdx / (total - 1)) * 100);
                            
                            return (
                                <div 
                                    className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-blue-400 to-blue-600 z-0 transition-all duration-500 rounded-full shadow-sm -translate-y-1/2" 
                                    style={{ width: `${selectedOrder.status === 'pending_receive' ? 0 : progressWidth}%` }} 
                                />
                            );
                        })()}

                        {STEPS.map((step) => {
                            // Logic: 
                            // Completed: Current status is 'completed' OR Current step has moved PAST this step.
                            const isCompleted = selectedOrder.status === 'completed' || (selectedOrder.status !== 'pending_receive' && selectedOrder.currentStep > step.id);
                            
                            // Current: Not completed, not pending receive, and step matches.
                            const isCurrent = selectedOrder.status !== 'pending_receive' && selectedOrder.status !== 'completed' && selectedOrder.currentStep === step.id;
                            
                            const isViewing = viewingStep === step.id;
                            
                            return (
                                <div key={step.id} className="z-10 flex flex-col items-center relative cursor-pointer group" onClick={() => setViewingStep(step.id)}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm border-2 ${
                                        isCompleted ? 'bg-green-500 border-green-500 scale-110' : 
                                        isCurrent ? 'bg-white border-blue-600 scale-125 shadow-blue-200' :
                                        'bg-white border-slate-300'
                                    } ${isViewing && !isCurrent ? 'ring-2 ring-blue-200 ring-offset-2' : ''}`}>
                                        {isCompleted && <Check size={12} className="text-white" strokeWidth={3} />}
                                        {isCurrent && <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />}
                                    </div>
                                    <span className={`absolute top-7 text-[10px] font-bold whitespace-nowrap transition-colors duration-300 ${
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

                 {/* Content Area */}
                 <div className="flex-1 overflow-y-auto p-4 bg-white relative">
                     <div className="max-w-md mx-auto h-full flex flex-col">
                         
                         {/* Step Title */}
                         <div className="mb-6 text-center">
                             <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                                 {React.createElement(STEPS.find(s => s.id === viewingStep)?.icon || ClipboardList, { size: 24, className: 'text-blue-500' })}
                                 {STEPS.find(s => s.id === viewingStep)?.label}
                             </h2>
                             <div className="flex flex-col items-center gap-1 mt-1">
                                 <p className="text-xs text-slate-400">
                                     {selectedOrder.status === 'pending_receive' ? '等待接收订单' : 
                                      selectedOrder.currentStep > viewingStep || selectedOrder.status === 'completed' ? '此环节已完成' : 
                                      selectedOrder.currentStep === viewingStep ? '当前正在进行' : '等待进行此环节'}
                                 </p>
                                 {/* Show Completion Time */}
                                 {selectedOrder.stepData?.[viewingStep]?.completionTime && (
                                     <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">
                                         完成时间: {selectedOrder.stepData[viewingStep].completionTime}
                                     </span>
                                 )}
                             </div>
                         </div>

                         {/* Audit Status Banner (If Rejected) */}
                         {selectedOrder.auditStatus === 'rejected' && selectedOrder.rejectReason && (
                             <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3 text-red-800 text-xs flex items-start gap-2">
                                 <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                 <div>
                                     <span className="font-bold">审核驳回:</span> {selectedOrder.rejectReason}
                                     <div className="mt-1 opacity-70">请修改相关信息后重新提交审核</div>
                                 </div>
                             </div>
                         )}

                         {/* Content based on state */}
                         <div className="flex-1 space-y-4">
                             {/* Context Info */}
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
                                    {selectedOrder.expectDeliveryDate && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">期望交货</span>
                                            <span className="font-bold text-blue-600 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {selectedOrder.expectDeliveryDate}
                                            </span>
                                        </div>
                                    )}
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

                             {/* Step Specific Inputs */}
                             
                             {/* Step 2 (Stocking) & Step 3 (Packing) & Step 5 (Signed) - Image Upload */}
                             {(viewingStep === 2 || viewingStep === 3 || viewingStep === 5) && (
                                 <div className="space-y-4">
                                     <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                                         <div className="flex justify-center items-center gap-2 mb-1">
                                             <p className="text-sm font-bold text-blue-800">
                                                 {viewingStep === 2 ? '备货清单拍照' : viewingStep === 3 ? '打包现场拍照' : '签收现场拍照'}
                                             </p>
                                             <button 
                                                onClick={() => openExample(viewingStep)}
                                                className="text-[10px] text-blue-500 bg-white border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-50 flex items-center gap-0.5 transition-colors"
                                             >
                                                 <ImageIcon size={10} /> 示例
                                             </button>
                                         </div>
                                         <p className="text-xs text-blue-600/70 mb-3">
                                             {isEditable ? '请上传照片以确认完成' : '已上传照片凭证'}
                                         </p>
                                         
                                         <div className="grid grid-cols-3 gap-3">
                                             {isEditable && (
                                                 <div className="aspect-square border-2 border-dashed border-blue-300 rounded-lg bg-white flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group">
                                                     <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, viewingStep)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                     <Upload size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                                     <span className="text-[9px] text-blue-500 font-bold mt-1">上传</span>
                                                 </div>
                                             )}
                                             {selectedOrder.stepData?.[viewingStep]?.images?.map((url, idx) => (
                                                 <div key={idx} className="aspect-square rounded-lg border border-slate-200 overflow-hidden relative group bg-white">
                                                     <img src={url} className="w-full h-full object-cover" />
                                                     {isEditable && (
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

                             {/* Step 4: Logistics (Multiple Links Support) */}
                             {viewingStep === 4 && (
                                 <div className="space-y-4">
                                     <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                         <div className="flex justify-between items-center mb-3">
                                             <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                                 <Link size={12} /> 物流链接/单号
                                             </label>
                                             {isEditable && (
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

                                         <div className="space-y-3">
                                             {logisticsItems.map((item, index) => {
                                                 const isEditing = editingItemId === item.id;
                                                 return (
                                                     <div key={item.id} className="bg-slate-50 rounded-lg border border-slate-200 p-2 space-y-2">
                                                         {isEditing ? (
                                                             // Edit Mode
                                                             <div className="space-y-2">
                                                                 <div className="flex gap-2">
                                                                     <div className="w-1/3">
                                                                         <input 
                                                                             type="text" 
                                                                             placeholder="名称 (如: 顺丰)"
                                                                             className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 bg-white"
                                                                             value={item.name}
                                                                             onChange={(e) => handleUpdateLogisticsItem(item.id, 'name', e.target.value)}
                                                                             disabled={!isEditable}
                                                                         />
                                                                     </div>
                                                                     <div className="flex-1 flex gap-1">
                                                                         <input 
                                                                             type="text" 
                                                                             placeholder="物流链接或单号"
                                                                             className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 bg-white"
                                                                             value={item.url}
                                                                             onChange={(e) => handleUpdateLogisticsItem(item.id, 'url', e.target.value)}
                                                                             disabled={!isEditable}
                                                                         />
                                                                         <button 
                                                                            onClick={() => handlePasteUrl(item.id)}
                                                                            className="bg-white border border-slate-300 rounded px-2 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                                                            title="粘贴"
                                                                         >
                                                                             <Clipboard size={14} />
                                                                         </button>
                                                                     </div>
                                                                 </div>
                                                                 <div className="flex justify-end">
                                                                     <button 
                                                                        onClick={() => setEditingItemId(null)}
                                                                        className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 font-bold hover:bg-blue-700 shadow-sm transition-colors"
                                                                     >
                                                                         <Check size={12} /> 完成
                                                                     </button>
                                                                 </div>
                                                             </div>
                                                         ) : (
                                                             // Read Mode
                                                             <div className="flex justify-between items-center px-1">
                                                                 <div className="flex-1 min-w-0 pr-2">
                                                                     <div className="text-xs font-bold text-slate-700">{item.name}</div>
                                                                     <div className="text-[10px] text-slate-500 truncate">{item.url || '暂无链接/单号'}</div>
                                                                 </div>
                                                                 <div className="flex gap-2 shrink-0">
                                                                     {item.url && (
                                                                         <button 
                                                                             onClick={() => handleOpenLink(item.url)}
                                                                             className="text-[10px] text-blue-600 bg-white border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 flex items-center gap-1"
                                                                         >
                                                                             <ExternalLink size={10} /> 跳转
                                                                         </button>
                                                                     )}
                                                                     {isEditable && (
                                                                         <>
                                                                             <button 
                                                                                 onClick={() => setEditingItemId(item.id)}
                                                                                 className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 flex items-center gap-1"
                                                                             >
                                                                                 <Edit2 size={10} /> 编辑
                                                                             </button>
                                                                             <button 
                                                                                 onClick={() => handleRemoveLogisticsItem(item.id)}
                                                                                 className="text-[10px] text-red-500 bg-white border border-red-200 px-2 py-1 rounded hover:bg-red-50 flex items-center gap-1"
                                                                             >
                                                                                 <Trash2 size={10} /> 删除
                                                                             </button>
                                                                         </>
                                                                     )}
                                                                 </div>
                                                             </div>
                                                         )}
                                                     </div>
                                                 );
                                             })}
                                         </div>
                                     </div>
                                 </div>
                             )}

                         </div>
                     </div>
                 </div>

                 {/* Footer Navigation & Actions */}
                 <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                     
                     {/* Audit UI Logic */}
                     {(selectedOrder.auditStatus as string) === 'pending' ? (
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
                                        <button onClick={() => setRejectMode(true)} className="w-full py-3 border border-red-200 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors text-sm">驳回订单</button>
                                     </AuditGate>
                                     <AuditGate type="procurement" className="flex-1">
                                        <button onClick={handleAuditApprove} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-sm transition-colors text-sm">签收通过</button>
                                     </AuditGate>
                                 </div>
                             )}
                         </div>
                     ) : (
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
                                 // Logic Handling for Step Actions
                                 // Step 5 Special Logic: Audit
                                 (viewingStep === 5 && isStep5Completed && selectedOrder.auditStatus !== 'pending') ? (
                                     <div className="flex gap-2">
                                         {/* Allow updating data always */}
                                         <button 
                                            onClick={handleUpdateStep}
                                            className="flex-1 py-3 bg-slate-100 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all border border-blue-200"
                                         >
                                            更新签收信息
                                         </button>
                                         <button 
                                            onClick={handleAuditSubmit}
                                            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                         >
                                            <ClipboardList size={18} /> {selectedOrder.auditStatus === 'rejected' ? '重新提交审核' : '提交审核'}
                                         </button>
                                     </div>
                                 ) : (
                                     // Steps 1-4 or Step 5 not yet done
                                     // If viewing future step (beyond current progress), just show Waiting
                                     (viewingStep > selectedOrder.currentStep && selectedOrder.status !== 'completed') ? (
                                         <button disabled className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-default">
                                             等待进行
                                         </button>
                                     ) : (
                                         // Viewing active or past step
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
                                        disabled={viewingStep >= 5} 
                                        className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                                     >
                                         下一环节 <ChevronRight size={16} />
                                     </button>
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
             </div>
        )}

        {/* Example Image Modal */}
        {exampleImage && (
            <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setExampleImage(null)}>
                <div className="bg-transparent w-full max-w-lg flex flex-col items-center animate-scaleIn" onClick={e => e.stopPropagation()}>
                    <div className="bg-white rounded-t-lg px-4 py-2 w-full flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <ImageIcon size={16} className="text-blue-500"/> {exampleImage.title}
                        </span>
                        <button onClick={() => setExampleImage(null)} className="p-1 hover:bg-slate-100 rounded-full">
                            <X size={16} className="text-slate-500"/>
                        </button>
                    </div>
                    <div className="bg-black rounded-b-lg overflow-hidden w-full border-t border-slate-100"><img src={exampleImage.url} alt="Example" className="w-full max-h-[70vh] object-contain" /></div>
                </div>
            </div>
        )}
    </div>
  );
};