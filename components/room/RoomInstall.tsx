import React, { useState, ChangeEvent, useMemo, useRef } from 'react';
import { Hammer, Store, ChevronDown, Clock, CheckCircle, Upload, X, Calendar, ClipboardList, AlertCircle, ArrowRight, Gavel, BedDouble, Info, Image as ImageIcon, MapPin, ChevronLeft, ChevronRight, Navigation, Plus, Check, RefreshCw, PlayCircle, Video, ChevronUp, Wifi, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Store as StoreType, InstallNode, InstallStatus, RoomImageCategory } from '../../types';
import { AuditGate } from '../DeviceComponents';

// Moved outside component to avoid scope/re-creation issues
const EXAMPLE_IMAGES: Record<string, string> = {
    '到店打卡': 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop', 
    '清点货物': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop', 
    '安装': 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=600&auto=format&fit=crop', 
    '调试': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=600&auto=format&fit=crop',
    '交付': 'https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=600&auto=format&fit=crop',
    // Modules
    '玄关': 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=600&auto=format&fit=crop',
    '桌面': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=600&auto=format&fit=crop',
    '床': 'https://images.unsplash.com/photo-1505693416388-b0346ef4174d?q=80&w=600&auto=format&fit=crop'
};

export const RoomInstall: React.FC = () => {
  const { regions, stores, updateStoreInstallation } = useApp();
  
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  
  // Modals & Active State
  const [activeStore, setActiveStore] = useState<StoreType | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // Progress Navigation State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Install Step (3) State: Active Room for Upload
  const [installingRoomNumber, setInstallingRoomNumber] = useState<string | null>(null);

  // Accordion State for Debug(4) step (Still using accordion for Debug if desired, or reuse grid pattern later)
  const [expandedRoomNumber, setExpandedRoomNumber] = useState<string | null>(null);

  // Debug Step Loading State
  const [debugLoading, setDebugLoading] = useState<Record<string, boolean>>({});

  // Rejection Reason Popup State
  const [viewingRejectReason, setViewingRejectReason] = useState<string | null>(null);

  // Example Image State
  const [exampleImage, setExampleImage] = useState<{ title: string; url: string } | null>(null);
  
  const appointmentInputRef = useRef<HTMLInputElement>(null);

  // Filter Logic
  const filteredStores = stores.filter(s => {
      if (selectedRegion && s.regionId !== selectedRegion) return false;
      if (selectedStoreId && s.id !== selectedStoreId) return false;
      return true;
  });

  // Helpers
  const getProgress = (nodes: InstallNode[] = []) => {
      const completed = nodes.filter(n => n.completed).length;
      return Math.round((completed / Math.max(nodes.length, 1)) * 100);
  };

  const getStatusConfig = (status: InstallStatus) => {
      switch(status) {
          case 'approved': return { label: '安装完成', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
          case 'pending_review_1': return { label: '待初审', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ClipboardList };
          case 'pending_review_2': return { label: '待二审', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ClipboardList };
          case 'pending_review_3': return { label: '待三审', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ClipboardList };
          case 'pending_review_4': return { label: '待终审', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ClipboardList };
          case 'in_progress': return { label: '进行中', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Hammer };
          case 'rejected': return { label: '已驳回', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle };
          default: return { label: '未开始', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock };
      }
  };

  const getCurrentNodeName = (nodes: InstallNode[]) => {
      const node = nodes.find(n => !n.completed);
      return node ? node.name : '等待交付';
  };

  const openExample = (nodeName: string, roomType?: string) => {
      // Try to get dynamic example from store config first if roomType is provided
      let url = null;
      if (roomType && activeStore) {
          const config = activeStore.roomTypeConfigs.find(rt => rt.name === roomType);
          if (config?.exampleImages?.[nodeName]) {
              url = config.exampleImages[nodeName];
          }
      }
      
      // Fallback to static
      if (!url) {
          url = EXAMPLE_IMAGES[nodeName];
      }

      if (url) {
          setExampleImage({ title: `${nodeName} - 示例图`, url });
      }
  };

  const toggleRoomAccordion = (roomNumber: string) => {
      setExpandedRoomNumber(prev => prev === roomNumber ? null : roomNumber);
  };

  // Actions
  const handleOpenDetail = (store: StoreType) => {
      // Check if appointment date is empty, if so, set default to today
      let initialNodes = store.installation?.nodes || [];
      let updatedStore = store;

      if (initialNodes.length > 0 && !initialNodes[0].data) {
          const now = new Date();
          now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
          const defaultTime = now.toISOString().slice(0, 16);
          
          const newNodes = [...initialNodes];
          newNodes[0] = { ...newNodes[0], data: defaultTime };
          
          updatedStore = {
              ...store,
              installation: { ...store.installation!, nodes: newNodes, appointmentTime: defaultTime }
          };
          // Persist default immediately so it shows in list view too if needed
          updateStoreInstallation(store.id, { nodes: newNodes, appointmentTime: defaultTime });
      }

      setActiveStore(updatedStore);
      setIsDetailModalOpen(true);
      setRejectMode(false);
      setRejectReason('');
      setExpandedRoomNumber(null);
      setInstallingRoomNumber(null);
      
      // Default to the first incomplete step, or the last step if all complete
      if (updatedStore.installation?.nodes) {
          const firstIncomplete = updatedStore.installation.nodes.findIndex(n => !n.completed);
          setCurrentStepIndex(firstIncomplete !== -1 ? firstIncomplete : updatedStore.installation.nodes.length - 1);
      } else {
          setCurrentStepIndex(0);
      }
  };

  const handleOpenAudit = (e: React.MouseEvent, store: StoreType) => {
      e.stopPropagation();
      handleOpenDetail(store);
  };

  const handleViewRejectReason = (e: React.MouseEvent, reason: string) => {
      e.stopPropagation();
      setViewingRejectReason(reason || '暂无驳回原因');
  };

  // Navigation Handlers
  const goNextStep = () => {
      if (activeStore?.installation && currentStepIndex < activeStore.installation.nodes.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
          setExpandedRoomNumber(null);
          setInstallingRoomNumber(null);
      }
  };

  const goPrevStep = () => {
      if (currentStepIndex > 0) {
          setCurrentStepIndex(prev => prev - 1);
          setExpandedRoomNumber(null);
          setInstallingRoomNumber(null);
      }
  };

  const jumpToStep = (index: number) => {
      setCurrentStepIndex(index);
      setExpandedRoomNumber(null);
      setInstallingRoomNumber(null);
  };

  // Node Updates
  const updateNodeData = (targetIndex: number, newData: any) => {
      if (!activeStore || !activeStore.installation) return;
      const newNodes = [...activeStore.installation.nodes];
      
      newNodes[targetIndex] = { ...newNodes[targetIndex], data: newData };

      // Update local state and global state
      const extraUpdates: any = {};
      if (targetIndex === 0) extraUpdates.appointmentTime = newData;

      const updatedStore = {
          ...activeStore,
          installation: { 
              ...activeStore.installation, 
              nodes: newNodes, 
              ...extraUpdates
          }
      };
      
      setActiveStore(updatedStore);
      updateStoreInstallation(activeStore.id, { nodes: newNodes, ...extraUpdates });
  };

  // --- Input Handlers ---

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
      updateNodeData(currentStepIndex, e.target.value);
  };

  // Check-in (Node 1)
  const handleCheckInImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const currentNode = activeStore?.installation?.nodes[1];
          const currentData = (currentNode?.data && typeof currentNode.data === 'object' && !Array.isArray(currentNode.data)) 
              ? currentNode.data 
              : { images: [], address: '' };
          
          const newData = {
              ...currentData,
              images: [...(currentData.images || []), url]
          };
          updateNodeData(1, newData);
          e.target.value = '';
      }
  };

  const removeCheckInImage = (imgIndex: number) => {
      const currentNode = activeStore?.installation?.nodes[1];
      const currentData = currentNode?.data || { images: [], address: '' };
      const newData = {
          ...currentData,
          images: (currentData.images || []).filter((_: any, i: number) => i !== imgIndex)
      };
      updateNodeData(1, newData);
  };

  const handleLocationConfirm = () => {
      const mockAddress = "上海市南京东路888号 (31.2304° N, 121.4737° E)";
      const currentNode = activeStore?.installation?.nodes[1];
      const currentData = (currentNode?.data && typeof currentNode.data === 'object' && !Array.isArray(currentNode.data)) 
          ? currentNode.data 
          : { images: [], address: '' };
      
      const newData = { ...currentData, address: mockAddress };
      updateNodeData(1, newData);
  };

  // Generic Image Upload (Nodes 2)
  const handleSimpleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const currentNode = activeStore?.installation?.nodes[currentStepIndex];
          const currentImages: string[] = Array.isArray(currentNode?.data) ? currentNode.data : [];
          const newImages = [...currentImages, url];
          updateNodeData(currentStepIndex, newImages);
          e.target.value = '';
      }
  };

  const removeSimpleImage = (imgIndex: number) => {
      const currentNode = activeStore?.installation?.nodes[currentStepIndex];
      const currentImages: string[] = Array.isArray(currentNode?.data) ? currentNode.data : [];
      const newImages = currentImages.filter((_, i) => i !== imgIndex);
      updateNodeData(currentStepIndex, newImages);
  };

  // Complex Node: Install Complete (Step 3)
  const handleRoomImageUpload = (roomNumber: string, category: RoomImageCategory, e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const currentNode = activeStore?.installation?.nodes[currentStepIndex];
          const currentData = (currentNode?.data && typeof currentNode.data === 'object' && !Array.isArray(currentNode.data)) ? currentNode.data : {};
          
          const roomData = currentData[roomNumber] || {};
          const categoryImages = roomData[category] || [];
          
          const newData = {
              ...currentData,
              [roomNumber]: {
                  ...roomData,
                  [category]: [...categoryImages, url]
              }
          };
          updateNodeData(currentStepIndex, newData);
          e.target.value = '';
      }
  };

  const removeRoomImage = (roomNumber: string, category: RoomImageCategory, imgIndex: number) => {
      const currentNode = activeStore?.installation?.nodes[currentStepIndex];
      const currentData = currentNode?.data || {};
      const roomData = currentData[roomNumber] || {};
      const categoryImages = roomData[category] || [];
      
      const newData = {
          ...currentData,
          [roomNumber]: {
              ...roomData,
              [category]: categoryImages.filter((_: string, i: number) => i !== imgIndex)
          }
      };
      updateNodeData(currentStepIndex, newData);
  };

  // Debug Sync Logic (Step 4)
  const handleDebugSync = (roomNumber: string, type: 'network' | 'log') => {
      const key = `${roomNumber}-${type}`;
      setDebugLoading(prev => ({ ...prev, [key]: true }));

      // Mock Async Detection
      setTimeout(() => {
          setDebugLoading(prev => ({ ...prev, [key]: false }));
          
          const currentNode = activeStore?.installation?.nodes[currentStepIndex];
          const currentData = (currentNode?.data && typeof currentNode.data === 'object' && !Array.isArray(currentNode.data)) ? currentNode.data : {};
          const roomData = currentData[roomNumber] || {};
          
          const newData = {
              ...currentData,
              [roomNumber]: {
                  ...roomData,
                  [type]: true
              }
          };
          updateNodeData(currentStepIndex, newData);
      }, 1500);
  };

  // Delivery Upload (Step 5 - Video/Image)
  const handleDeliveryUpload = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const url = URL.createObjectURL(file);
          const type = file.type.startsWith('video/') ? 'video' : 'image';
          
          const currentNode = activeStore?.installation?.nodes[currentStepIndex];
          // Ensure structure: Array<{url, type}>
          const currentItems = Array.isArray(currentNode?.data) ? currentNode.data : [];
          // Handle legacy string[] data
          const normalizeItems = currentItems.map((item: any) => typeof item === 'string' ? { url: item, type: 'image' } : item);
          
          const newItems = [...normalizeItems, { url, type }];
          updateNodeData(currentStepIndex, newItems);
          e.target.value = '';
      }
  };

  const removeDeliveryItem = (index: number) => {
      const currentNode = activeStore?.installation?.nodes[currentStepIndex];
      const currentItems = Array.isArray(currentNode?.data) ? currentNode.data : [];
      const newItems = currentItems.filter((_: any, i: number) => i !== index);
      updateNodeData(currentStepIndex, newItems);
  };

  // Validation Logic
  const canCompleteStep = useMemo(() => {
      if (!activeStore || !activeStore.installation) return false;
      const currentNode = activeStore.installation.nodes[currentStepIndex];
      if (!currentNode) return false;

      // 1. Check Previous Step
      if (currentStepIndex > 0) {
          const prevNode = activeStore.installation.nodes[currentStepIndex - 1];
          if (!prevNode.completed) return false;
      }

      // 2. Validate Requirements
      if (currentStepIndex === 0) { // Appointment
          return !!currentNode.data;
      } else if (currentStepIndex === 1) { // Check-in
          const data = currentNode.data as { images: string[], address: string };
          const hasImages = data?.images?.length > 0;
          const hasAddress = !!data?.address;
          return hasImages && hasAddress;
      } else if (currentStepIndex === 3) { // Installation
          const roomData = currentNode.data || {};
          const rooms = activeStore.rooms;
          const categories: RoomImageCategory[] = ['玄关', '桌面', '床'];
          if (rooms.length > 0) {
              return rooms.every(room => {
                  const rData = roomData[room.number] || {};
                  return categories.every(cat => Array.isArray(rData[cat]) && rData[cat].length > 0);
              });
          } else {
              return true; 
          }
      } else if (currentStepIndex === 4) { // Debug
          const roomData = currentNode.data || {};
          const rooms = activeStore.rooms;
          if (rooms.length > 0) {
              return rooms.every(room => {
                  const rData = roomData[room.number] || {};
                  return rData.network && rData.log;
              });
          } else {
              return true;
          }
      } else { // Generic or Delivery
          return Array.isArray(currentNode.data) && currentNode.data.length > 0;
      }
  }, [activeStore, currentStepIndex]);

  // Logic: Mark Step as Complete
  const handleConfirmStep = () => {
      if (!canCompleteStep) return;
      if (!activeStore || !activeStore.installation) return;
      
      const currentNode = activeStore.installation.nodes[currentStepIndex];
      const newNodes = [...activeStore.installation.nodes];
      
      // Update complete status and completion time
      newNodes[currentStepIndex] = { 
          ...currentNode, 
          completed: true,
          completionTime: new Date().toLocaleString()
      };
      
      const newStatus = activeStore.installation.status === 'unstarted' ? 'in_progress' : activeStore.installation.status;

      const updatedStore = {
          ...activeStore,
          installation: { 
              ...activeStore.installation, 
              nodes: newNodes, 
              status: newStatus 
          }
      };
      setActiveStore(updatedStore);
      updateStoreInstallation(activeStore.id, { nodes: newNodes, status: newStatus });
      
      goNextStep();
  };

  const handleSubmit = () => {
      if (!activeStore) return;
      // Start at stage 1
      updateStoreInstallation(activeStore.id, { status: 'pending_review_1' });
      setIsDetailModalOpen(false);
  };

  const handleAuditApprove = () => {
      if (!activeStore) return;
      
      let nextStatus: InstallStatus = 'approved';
      const current = activeStore.installation?.status;

      if (current === 'pending_review_1') nextStatus = 'pending_review_2';
      else if (current === 'pending_review_2') nextStatus = 'pending_review_3';
      else if (current === 'pending_review_3') nextStatus = 'pending_review_4';
      else if (current === 'pending_review_4') nextStatus = 'approved';

      updateStoreInstallation(activeStore.id, { status: nextStatus });
      setIsDetailModalOpen(false);
  };

  const handleAuditReject = () => {
      if (!activeStore) return;
      if (!rejectReason.trim()) { alert('请输入驳回原因'); return; }
      updateStoreInstallation(activeStore.id, { status: 'rejected', rejectReason }); 
      setIsDetailModalOpen(false);
  };

  const currentStatus = activeStore?.installation?.status;
  const isAuditMode = currentStatus?.startsWith('pending_review');
  const isApproved = currentStatus === 'approved';
  
  // Allow edit even if complete/approved/audit, essentially always unlocked unless waiting for audit result
  const isLocked = isAuditMode; 

  const isRoomCompleted = (roomData: any) => {
      const categories: RoomImageCategory[] = ['玄关', '桌面', '床'];
      return categories.every(cat => Array.isArray(roomData[cat]) && roomData[cat].length > 0);
  };

  const isDebugRoomCompleted = (rData: any) => rData?.network && rData?.log;

  const currentNode = activeStore?.installation?.nodes[currentStepIndex];

  // Helper to determine stage number
  const getCurrentStage = () => {
      if (currentStatus === 'pending_review_1') return 1;
      if (currentStatus === 'pending_review_2') return 2;
      if (currentStatus === 'pending_review_3') return 3;
      if (currentStatus === 'pending_review_4') return 4;
      return 0;
  };

  const getApproveLabel = () => {
      const stage = getCurrentStage();
      if (stage === 1) return '初审通过';
      if (stage === 2) return '二审通过';
      if (stage === 3) return '三审通过';
      if (stage === 4) return '终审通过';
      return '审核通过';
  }

  return (
    <div className="h-full flex flex-col">
        {/* Filters - Fixed at Top */}
        <div className="bg-white p-4 shrink-0 shadow-sm border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                <Store size={12} /> 安装筛选
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedRegion}
                        onChange={(e) => { setSelectedRegion(e.target.value); setSelectedStoreId(''); }}
                    >
                        <option value="">全部大区</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
                <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                    >
                        <option value="">全部门店</option>
                        {filteredStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>
        </div>

        {/* Store List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredStores.map(store => {
                const install = store.installation!;
                const progress = getProgress(install.nodes);
                const statusConfig = getStatusConfig(install.status);
                const isCompleted = install.status === 'approved';
                const isRejected = install.status === 'rejected';
                const isPending = install.status.startsWith('pending');

                return (
                    <div 
                        key={store.id} 
                        onClick={() => handleOpenDetail(store)}
                        className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all hover:shadow-md relative overflow-hidden group
                            ${isCompleted ? 'border-green-200' : isRejected ? 'border-red-200' : 'border-slate-100'}
                        `}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                                    {store.name}
                                    {isRejected && (
                                        <div className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px] font-normal animate-pulse">
                                            <AlertCircle size={10} /> 驳回
                                        </div>
                                    )}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusConfig.color}`}>
                                        <statusConfig.icon size={10} />
                                        {statusConfig.label}
                                    </span>
                                    {install.status === 'in_progress' && (
                                        <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-medium">
                                            当前: {getCurrentNodeName(install.nodes)}
                                        </span>
                                    )}
                                    {install.appointmentTime && (
                                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                                            <Calendar size={10} />
                                            {install.appointmentTime.replace('T', ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Audit Button */}
                            {isPending && (
                                <AuditGate type="installation" stage={parseInt(install.status.split('_').pop() || '0')}>
                                    <button 
                                        onClick={(e) => handleOpenAudit(e, store)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 animate-pulse"
                                    >
                                        <Gavel size={14} /> 审核
                                    </button>
                                </AuditGate>
                            )}
                        </div>

                        {/* Rejection Reason Display */}
                        {isRejected && install.rejectReason && (
                            <div className="mb-3 bg-red-50 p-2 rounded text-xs text-red-700 border border-red-100">
                                <span className="font-bold">驳回原因:</span> {install.rejectReason}
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                <span>安装进度</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                );
            })}
            {filteredStores.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">没有找到门店数据</div>
            )}
        </div>

        {/* Modal Components */}
        {viewingRejectReason && (
            <div className="fixed inset-0 z-[70] bg-black/20 flex items-center justify-center p-6 animate-fadeIn" onClick={() => setViewingRejectReason(null)}>
                <div className="bg-white rounded-xl shadow-lg p-5 max-w-xs w-full animate-scaleIn" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2 mb-3 text-red-600 font-bold">
                        <AlertCircle size={20} /> 驳回原因
                    </div>
                    <p className="text-sm text-slate-700 bg-red-50 p-3 rounded-lg border border-red-100">{viewingRejectReason}</p>
                    <button onClick={() => setViewingRejectReason(null)} className="w-full mt-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 text-xs">关闭</button>
                </div>
            </div>
        )}

        {/* FULL SCREEN PROGRESS PAGE */}
        {isDetailModalOpen && activeStore && activeStore.installation && currentNode && (
            <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slideInRight">
                <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Hammer size={18} className="text-blue-600" />{isAuditMode ? '安装审核' : '安装进度'}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">{activeStore.name}</p>
                    </div>
                    <button onClick={() => setIsDetailModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>

                <div className="px-6 py-6 bg-slate-50 flex-shrink-0 pb-12">
                    <div className="relative flex items-center justify-between mb-2 px-1">
                        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-200 z-0 rounded-full -translate-y-1/2" />
                        {(() => {
                            const total = activeStore.installation.nodes.length;
                            let lastCompletedIdx = -1;
                            for (let i = 0; i < total; i++) { if (activeStore.installation.nodes[i].completed) lastCompletedIdx = i; else break; }
                            const progressWidth = Math.min(100, (Math.max(lastCompletedIdx, 0) / (total - 1)) * 100);
                            const actualWidth = lastCompletedIdx === -1 ? 0 : progressWidth;
                            return <div className="absolute top-1/2 left-0 h-1.5 bg-green-500 z-0 transition-all duration-500 rounded-full shadow-sm -translate-y-1/2" style={{ width: `${actualWidth}%` }} />;
                        })()}
                        {activeStore.installation.nodes.map((node, i) => {
                            const isCompleted = node.completed;
                            const isCurrent = i === currentStepIndex;
                            return (
                                <div key={i} className="z-10 flex flex-col items-center relative cursor-pointer" onClick={() => jumpToStep(i)}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 z-10 border-2 shadow-sm ${isCompleted ? 'bg-green-500 border-green-500' : isCurrent ? 'bg-white border-blue-600 scale-125' : 'bg-white border-slate-300'}`}>
                                        {isCompleted && <Check size={10} className="text-white" strokeWidth={3} />}
                                        {isCurrent && <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />}
                                    </div>
                                    <span className={`absolute top-6 text-[9px] font-bold whitespace-nowrap transition-colors ${isCurrent ? 'text-blue-600 scale-110' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>{node.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-white relative">
                    <div className="max-w-md mx-auto h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{currentNode.name}</h2>
                                {currentNode.completed && currentNode.completionTime && (
                                    <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                                        完成时间: {currentNode.completionTime}
                                    </span>
                                )}
                            </div>
                            {currentStepIndex > 0 && currentStepIndex <= 5 && currentNode.name !== '安装' && (
                                <button onClick={() => openExample(currentNode.name)} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold hover:bg-blue-100 transition-colors"><ImageIcon size={12} /> 查看示例</button>
                            )}
                        </div>

                        <div className="flex-1 space-y-6">
                            
                            {/* Node 0: Appointment */}
                            {currentStepIndex === 0 && (
                                <div className="space-y-4">
                                    <div 
                                        className="bg-blue-50 p-4 rounded-xl border border-blue-100 cursor-pointer"
                                        onClick={() => {
                                            try {
                                                if (appointmentInputRef.current) {
                                                    appointmentInputRef.current.showPicker();
                                                }
                                            } catch (error) {
                                                appointmentInputRef.current?.focus();
                                            }
                                        }}
                                    >
                                        <label className="block text-xs font-bold text-blue-800 uppercase mb-2 pointer-events-none">预约安装时间</label>
                                        <input 
                                            ref={appointmentInputRef}
                                            type="datetime-local" 
                                            value={currentNode.data || ''}
                                            onChange={handleTimeChange}
                                            disabled={isLocked}
                                            className="w-full text-sm border border-blue-200 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 caret-transparent cursor-pointer"
                                            onKeyDown={(e) => e.preventDefault()}
                                            onClick={(e) => { 
                                                e.stopPropagation();
                                                try {
                                                    (e.target as HTMLInputElement).showPicker();
                                                } catch (error) {
                                                    // Ignore if not supported
                                                }
                                            }} 
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 text-center">请与客户沟通确认上门安装的具体时间。</p>
                                </div>
                            )}

                            {/* Node 1: Check-in */}
                            {currentStepIndex === 1 && (
                                <div className="space-y-4">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2"><MapPin size={16} className="text-blue-500" /> 位置确认</h4>
                                        {(() => {
                                            const data = (currentNode.data && typeof currentNode.data === 'object' && !Array.isArray(currentNode.data)) ? currentNode.data as { address: string } : { address: '' };
                                            return data.address ? (
                                                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-xs font-medium border border-green-100 flex items-start gap-2"><CheckCircle size={14} className="mt-0.5 shrink-0" />{data.address}</div>
                                            ) : (
                                                <button onClick={handleLocationConfirm} disabled={isLocked} className="w-full py-3 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"><Navigation size={14} /> 点击获取当前位置</button>
                                            );
                                        })()}
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2"><ImageIcon size={16} className="text-blue-500" /> 现场照片</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            {!isLocked && (
                                                <div className="aspect-square border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-300 relative group transition-all">
                                                    <input type="file" accept="image/*" onChange={handleCheckInImageUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                                                    <Upload size={20} className="text-slate-300 group-hover:text-blue-400 mb-1" />
                                                    <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-bold">上传</span>
                                                </div>
                                            )}
                                            {(() => {
                                                const data = (currentNode.data && typeof currentNode.data === 'object' && !Array.isArray(currentNode.data)) ? currentNode.data as { images: string[] } : { images: [] };
                                                return data.images?.map((url: string, imgIdx: number) => (
                                                    <div key={imgIdx} className="aspect-square rounded-xl border border-slate-200 overflow-hidden relative group">
                                                        <img src={url} alt={`checkin-${imgIdx}`} className="w-full h-full object-cover" />
                                                        {!isLocked && (
                                                            <button onClick={() => removeCheckInImage(imgIdx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                                        )}
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Node 3: Room Installation (Refactored to Grid) */}
                            {currentStepIndex === 3 && (
                                <div className="space-y-4">
                                    {/* Sub-view: Room Detail Upload */}
                                    {installingRoomNumber ? (
                                        <div className="animate-fadeIn">
                                            <div className="flex items-center gap-2 mb-4">
                                                <button 
                                                    onClick={() => setInstallingRoomNumber(null)}
                                                    className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                                >
                                                    <ChevronLeft size={16} className="text-slate-600" />
                                                </button>
                                                <h3 className="font-bold text-slate-800">
                                                    {installingRoomNumber} 房间安装图
                                                </h3>
                                            </div>

                                            {(() => {
                                                const roomData = (currentNode.data && typeof currentNode.data === 'object') ? currentNode.data[installingRoomNumber] || {} : {};
                                                const categories: RoomImageCategory[] = ['玄关', '桌面', '床'];
                                                const roomType = activeStore.rooms.find(r => r.number === installingRoomNumber)?.type;

                                                return (
                                                    <div className="space-y-4">
                                                        {categories.map(cat => {
                                                            const images = roomData[cat] || [];
                                                            return (
                                                                <div key={cat} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div> {cat}
                                                                        </p>
                                                                        <button onClick={() => openExample(cat, roomType)} className="flex items-center gap-1 bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded text-xs hover:text-blue-600 font-bold transition-colors">
                                                                            <ImageIcon size={12} /> 示例
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-4 gap-3">
                                                                        {!isLocked && (
                                                                            <div className="aspect-square border-2 border-dashed border-blue-200 rounded-lg bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 relative group transition-colors">
                                                                                <input type="file" accept="image/*" onChange={(e) => handleRoomImageUpload(installingRoomNumber, cat, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                                                <Plus size={20} className="text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                                                                                <span className="text-[9px] text-blue-500 font-bold">上传</span>
                                                                            </div>
                                                                        )}
                                                                        {images.map((url: string, imgIdx: number) => (
                                                                            <div key={imgIdx} className="aspect-square rounded-lg border border-slate-200 overflow-hidden relative group bg-white shadow-sm">
                                                                                <img src={url} alt={`${installingRoomNumber}-${cat}`} className="w-full h-full object-cover" />
                                                                                {!isLocked && (
                                                                                    <button onClick={() => removeRoomImage(installingRoomNumber, cat, imgIdx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><X size={10} /></button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        // Grid View of Rooms
                                        <div className="grid grid-cols-3 gap-3 animate-fadeIn">
                                            {activeStore.rooms.map((room) => {
                                                const roomData = (currentNode.data && typeof currentNode.data === 'object') ? currentNode.data[room.number] || {} : {};
                                                const roomCompleted = isRoomCompleted(roomData);
                                                
                                                return (
                                                    <div 
                                                        key={room.number}
                                                        onClick={() => setInstallingRoomNumber(room.number)}
                                                        className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:shadow-md active:scale-95 relative overflow-hidden bg-white
                                                            ${roomCompleted ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-blue-300'}
                                                        `}
                                                    >
                                                        <span className={`text-lg font-bold ${roomCompleted ? 'text-green-700' : 'text-slate-700'}`}>
                                                            {room.number}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 mt-1">{room.type}</span>
                                                        
                                                        {roomCompleted && (
                                                            <div className="absolute top-1 right-1">
                                                                <CheckCircle size={16} className="text-green-500 bg-white rounded-full" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {activeStore.rooms.length === 0 && <div className="col-span-3 p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed">无客房需安装</div>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Node 4: Debug (New Logic) */}
                            {currentStepIndex === 4 && (
                                <div className="space-y-4">
                                    {activeStore.rooms.map((room) => {
                                        const roomData = (currentNode.data && typeof currentNode.data === 'object') ? currentNode.data[room.number] || {} : {};
                                        const isRoomDone = isDebugRoomCompleted(roomData);
                                        const isExpanded = expandedRoomNumber === room.number;

                                        return (
                                            <div key={room.number} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${isRoomDone ? 'border-green-200' : 'border-slate-200'}`}>
                                                <div 
                                                    onClick={() => toggleRoomAccordion(room.number)}
                                                    className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <BedDouble size={16} className="text-slate-500" />
                                                        <span className="text-sm font-bold text-slate-700">{room.number} ({room.type}) 调试检测</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isRoomDone && <CheckCircle size={16} className="text-green-500" />}
                                                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="p-4 space-y-3 animate-fadeIn bg-white">
                                                        {/* Check Item 1: Network */}
                                                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                                                            <div className="flex items-center gap-2">
                                                                <Wifi size={16} className="text-blue-500" />
                                                                <span className="text-xs font-bold text-slate-700">网络情况检测</span>
                                                            </div>
                                                            {roomData.network ? (
                                                                <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded"><Check size={12} /> 检测通过</span>
                                                            ) : debugLoading[`${room.number}-network`] ? (
                                                                <span className="text-xs text-blue-500 font-bold animate-pulse">检测中...</span>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleDebugSync(room.number, 'network')}
                                                                    disabled={isLocked}
                                                                    className="flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                                                                >
                                                                    <RefreshCw size={12} /> 同步
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Check Item 2: Logs */}
                                                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                                                            <div className="flex items-center gap-2">
                                                                <FileText size={16} className="text-orange-500" />
                                                                <span className="text-xs font-bold text-slate-700">Log记录检测</span>
                                                            </div>
                                                            {roomData.log ? (
                                                                <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded"><Check size={12} /> 检测通过</span>
                                                            ) : debugLoading[`${room.number}-log`] ? (
                                                                <span className="text-xs text-blue-500 font-bold animate-pulse">检测中...</span>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleDebugSync(room.number, 'log')}
                                                                    disabled={isLocked}
                                                                    className="flex items-center gap-1 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                                                                >
                                                                    <RefreshCw size={12} /> 同步
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {activeStore.rooms.length === 0 && <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed">无客房需调试</div>}
                                </div>
                            )}

                            {/* Node 5: Delivery (Video Support) */}
                            {currentStepIndex === 5 && (
                                <div className="space-y-4">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="grid grid-cols-3 gap-3">
                                            {!isLocked && (
                                                <div className="aspect-square border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-300 relative group transition-all">
                                                    <input type="file" accept="image/*,video/*" onChange={handleDeliveryUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                                                    <Upload size={20} className="text-slate-300 group-hover:text-blue-400 mb-1" />
                                                    <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-bold text-center leading-tight">上传图片<br/>或视频</span>
                                                </div>
                                            )}
                                            {(() => {
                                                const rawData = currentNode.data;
                                                const items = Array.isArray(rawData) ? rawData : [];
                                                // Normalize data: some items might be strings (legacy), some objects {url, type}
                                                return items.map((item: any, idx: number) => {
                                                    const isObj = typeof item === 'object';
                                                    const url = isObj ? item.url : item;
                                                    const isVideo = isObj ? item.type === 'video' : false;

                                                    return (
                                                        <div key={idx} className="aspect-square rounded-xl border border-slate-200 overflow-hidden relative group bg-black">
                                                            {isVideo ? (
                                                                <div className="w-full h-full flex items-center justify-center relative">
                                                                    <video src={url} className="w-full h-full object-cover opacity-80" />
                                                                    <PlayCircle size={24} className="text-white absolute opacity-80" />
                                                                    <Video size={12} className="absolute top-1 left-1 text-white bg-black/50 rounded p-0.5" />
                                                                </div>
                                                            ) : (
                                                                <img src={url} alt={`delivery-${idx}`} className="w-full h-full object-cover" />
                                                            )}
                                                            {!isLocked && (
                                                                <button onClick={() => removeDeliveryItem(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 text-center">请上传交付相关的照片或演示视频。</p>
                                </div>
                            )}

                            {/* Generic Image Steps (2) */}
                            {currentStepIndex === 2 && (
                                <div className="space-y-4">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="grid grid-cols-3 gap-3">
                                            {!isLocked && (
                                                <div className="aspect-square border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-300 relative group transition-all">
                                                    <input type="file" accept="image/*" onChange={handleSimpleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                                                    <Upload size={20} className="text-slate-300 group-hover:text-blue-400 mb-1" />
                                                    <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-bold">上传</span>
                                                </div>
                                            )}
                                            {Array.isArray(currentNode.data) && currentNode.data.map((url, imgIdx) => (
                                                <div key={imgIdx} className="aspect-square rounded-xl border border-slate-200 overflow-hidden relative group bg-white">
                                                    <img src={url} alt={`${currentNode.name}-${imgIdx}`} className="w-full h-full object-cover" />
                                                    {!isLocked && (
                                                        <button onClick={() => removeSimpleImage(imgIdx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 text-center">请上传{currentNode.name}的相关照片凭证。</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                    {/* Rejection Input Mode */}
                    {isAuditMode && rejectMode ? (
                         <div className="space-y-3 animate-fadeIn">
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
                        <div className="flex flex-col gap-3">
                            {/* Audit Decision Buttons (Visible only in Audit Mode and NOT reject mode) */}
                            {isAuditMode && (
                                <div className="flex gap-3 mb-1">
                                    <AuditGate type="installation" stage={getCurrentStage()} className="flex-1">
                                        <button onClick={() => setRejectMode(true)} className="w-full py-2 border border-red-200 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors text-xs">驳回</button>
                                    </AuditGate>
                                    <AuditGate type="installation" stage={getCurrentStage()} className="flex-1">
                                        <button onClick={handleAuditApprove} className="w-full py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm transition-colors text-xs">
                                            {getApproveLabel()}
                                        </button>
                                    </AuditGate>
                                </div>
                            )}

                            {/* Normal Operation Button - Visible if NOT Audit Mode (Allowed even if approved/completed) */}
                            {/* Hide during room upload sub-view */}
                            {!isAuditMode && !installingRoomNumber && (
                                <button 
                                    onClick={handleConfirmStep}
                                    disabled={!canCompleteStep}
                                    className={`w-full py-3 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                                        canCompleteStep 
                                            ? (currentNode.completed ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95')
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    {currentNode.completed ? <><CheckCircle size={18} /> 更新并完成</> : <><CheckCircle size={18} /> 确认完成此环节</>}
                                </button>
                            )}
                            
                            {/* Navigation Buttons - Always visible to allow flipping pages */}
                            <div className="flex gap-3">
                                <button 
                                    onClick={goPrevStep} 
                                    disabled={currentStepIndex === 0}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                                >
                                    <ChevronLeft size={16} /> 上一步
                                </button>
                                
                                {currentStepIndex === activeStore.installation.nodes.length - 1 ? (
                                    /* If last step, show Submit Audit if applicable, or disabled */
                                    !isAuditMode && !isApproved ? (
                                        <button 
                                            onClick={handleSubmit}
                                            disabled={!activeStore.installation.nodes.every(n => n.completed)}
                                            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                                        >
                                            提交初审
                                        </button>
                                    ) : (
                                        <button disabled className="flex-1 py-3 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-default">
                                            已是最后一步
                                        </button>
                                    )
                                ) : (
                                    <button 
                                        onClick={goNextStep}
                                        className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 flex items-center justify-center gap-1 transition-colors"
                                    >
                                        下一步 <ChevronRight size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Example Image Modal - Moved to end to ensure high z-index stacking */}
        {exampleImage && (
            <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setExampleImage(null)}>
                <div className="bg-transparent w-full max-w-lg flex flex-col items-center animate-scaleIn" onClick={e => e.stopPropagation()}>
                    <div className="bg-white rounded-t-lg px-4 py-2 w-full flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800 flex items-center gap-2"><ImageIcon size={16} className="text-blue-500"/> {exampleImage.title}</span>
                        <button onClick={() => setExampleImage(null)} className="p-1 hover:bg-slate-100 rounded-full"><X size={16} className="text-slate-500"/></button>
                    </div>
                    <div className="bg-black rounded-b-lg overflow-hidden w-full border-t border-slate-100"><img src={exampleImage.url} alt="Example" className="w-full max-h-[70vh] object-contain" /></div>
                </div>
            </div>
        )}
    </div>
  );
};