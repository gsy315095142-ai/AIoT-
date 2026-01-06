import React, { useState, ChangeEvent, useMemo, useRef } from 'react';
import { Hammer, Store, ChevronDown, Clock, CheckCircle, Upload, X, Calendar, ClipboardList, AlertCircle, ArrowRight, Gavel, BedDouble, Info, Image as ImageIcon, MapPin, ChevronLeft, ChevronRight, Navigation, Plus, Check, RefreshCw, PlayCircle, Video, ChevronUp, Wifi, FileText, Square, CheckSquare, ListChecks, ToggleLeft, ToggleRight, Download, Camera, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Store as StoreType, InstallNode, InstallStatus, RoomImageCategory, Region, InstallationParamKey } from '../../types';
import { AuditGate } from '../DeviceComponents';

// Moved outside component to avoid scope/re-creation issues
const EXAMPLE_IMAGES: Record<string, string> = {
    '到店打卡': 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop', 
    '清点货物': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop', 
    '安装': 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=600&auto=format&fit=crop', 
    '调试': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=600&auto=format&fit=crop',
    '交付': 'https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=600&auto=format&fit=crop',
    // Modules - Fallback if no store config
    '地投环境': 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=600&auto=format&fit=crop',
    '桌显桌子形状尺寸': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=600&auto=format&fit=crop',
    '床头背景墙尺寸': 'https://images.unsplash.com/photo-1505693416388-b0346ef4174d?q=80&w=600&auto=format&fit=crop',
    '桌显处墙面宽高': 'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=600&auto=format&fit=crop',
    '浴室镜面形状和尺寸': 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=600&auto=format&fit=crop',
    '电视墙到床尾距离': 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=600&auto=format&fit=crop',
    '照片墙处墙面宽高': 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600&auto=format&fit=crop',
    '玩乐活动区域长宽': 'https://images.unsplash.com/photo-1596178065887-1198b6148b2e?q=80&w=600&auto=format&fit=crop'
};

const MOCK_ASSETS = [
    'https://images.unsplash.com/photo-1599690925058-90e1a0b368a4?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550920760-72cb7c2fb74e?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop'
];

export const RoomInstall: React.FC = () => {
  const { regions, stores, updateStoreInstallation, devices, currentUser } = useApp();
  
  const [selectedRegion, setSelectedRegion] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved'>('all'); // New Tab State
  
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
      // 3.1 Only show stores with published installation tasks
      if (s.installationTask?.status !== 'published') return false;
      if (selectedRegion && s.regionId !== selectedRegion) return false;
      
      // Tab Filtering
      const isApproved = s.installation?.status === 'approved';
      if (filterTab === 'pending' && isApproved) return false;
      if (filterTab === 'approved' && !isApproved) return false;

      return true;
  });

  // Helpers
  const getProgress = (nodes: InstallNode[]) => {
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

  // Helper for Region Label with Status Counts
  const getRegionLabel = (region: Region) => {
      // Calculate from all published tasks, before tab filtering
      const regionStores = stores.filter(s => s.regionId === region.id && s.installationTask?.status === 'published');
      const total = regionStores.length;
      
      const p1 = regionStores.filter(s => s.installation?.status === 'pending_review_1').length;
      const p2 = regionStores.filter(s => s.installation?.status === 'pending_review_2').length;
      const p3 = regionStores.filter(s => s.installation?.status === 'pending_review_3').length;
      const p4 = regionStores.filter(s => s.installation?.status === 'pending_review_4').length;
      const approved = regionStores.filter(s => s.installation?.status === 'approved').length;

      let label = `${region.name} (总:${total}`;
      if (p1 > 0) label += ` 初审:${p1}`;
      if (p2 > 0) label += ` 二审:${p2}`;
      if (p3 > 0) label += ` 三审:${p3}`;
      if (p4 > 0) label += ` 终审:${p4}`;
      if (approved > 0) label += ` 完成:${approved}`;
      label += `)`;
      return label;
  };

  const getAllRegionsLabel = () => {
      const baseStores = stores.filter(s => s.installationTask?.status === 'published');
      const total = baseStores.length;
      const p1 = baseStores.filter(s => s.installation?.status === 'pending_review_1').length;
      const p2 = baseStores.filter(s => s.installation?.status === 'pending_review_2').length;
      const p3 = baseStores.filter(s => s.installation?.status === 'pending_review_3').length;
      const p4 = baseStores.filter(s => s.installation?.status === 'pending_review_4').length;
      const approved = baseStores.filter(s => s.installation?.status === 'approved').length;

      let label = `全部大区 (总:${total}`;
      if (p1 > 0) label += ` 初审:${p1}`;
      if (p2 > 0) label += ` 二审:${p2}`;
      if (p3 > 0) label += ` 三审:${p3}`;
      if (p4 > 0) label += ` 终审:${p4}`;
      if (approved > 0) label += ` 完成:${approved}`;
      label += `)`;
      return label;
  };

  const getCurrentNodeName = (nodes: InstallNode[]) => {
      const node = nodes.find(n => !n.completed);
      return node ? node.name : '等待交付';
  };

  const openExample = (nodeName: string, roomType?: string) => {
      // Try to get dynamic example from store config first if roomType is provided
      let url = null;
      if (roomType && activeStore) {
          // Use Store-Level Config for Examples
          if (activeStore.moduleConfig.exampleImages?.[nodeName]) {
              url = activeStore.moduleConfig.exampleImages[nodeName];
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

  const handleExport = (e: React.MouseEvent, store: StoreType) => {
      e.stopPropagation();
      // Generate CSV
      const headers = ['步骤序号', '步骤名称', '状态', '完成时间', '操作人', '备注详情'];
      const rows = store.installation?.nodes.map((node, index) => {
          let details = '';
          if (node.name === '安装筹备' && node.data?.appointmentTime) details = `预约: ${node.data.appointmentTime}`;
          else if (node.name === '到店打卡' && node.data?.address) details = `地址: ${node.data.address}`;
          else if (node.name === '安装') {
             const roomCount = store.rooms.length;
             details = `共 ${roomCount} 间客房`;
          }
          
          return [
              index + 1,
              node.name,
              node.completed ? '已完成' : '未完成',
              node.completionTime || '-',
              node.operator || '-',
              `"${details}"` // Escape quotes
          ].join(',');
      });
      
      const csvContent = [
          `门店名称: ${store.name}, 所属大区: ${regions.find(r=>r.id===store.regionId)?.name || '-'}`,
          headers.join(','),
          ...(rows || [])
      ].join('\n');

      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${store.name}_安装记录.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Actions
  const handleOpenDetail = (store: StoreType) => {
      let initialNodes = store.installation?.nodes || [];
      let updatedStore = store;

      // Check step 0 data for default appointment time
      if (initialNodes.length > 0) {
          const step0 = initialNodes[0];
          let currentStep0Data = step0.data;
          let needUpdate = false;

          // Normalize data structure if legacy string
          if (typeof currentStep0Data === 'string') {
              currentStep0Data = {
                  appointmentTime: currentStep0Data,
                  checklist: { networkWhitelist: false, roomAvailability: false }
              };
              needUpdate = true;
          } else if (!currentStep0Data) {
              currentStep0Data = {
                  appointmentTime: '',
                  checklist: { networkWhitelist: false, roomAvailability: false }
              };
              needUpdate = true;
          }

          // Force default time to today if empty
          if (!currentStep0Data.appointmentTime) {
              const now = new Date();
              now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
              const defaultTime = now.toISOString().slice(0, 16);
              currentStep0Data.appointmentTime = defaultTime;
              needUpdate = true;
          }

          if (needUpdate) {
              const newNodes = [...initialNodes];
              newNodes[0] = { ...step0, data: currentStep0Data, name: '安装筹备' };
              
              updatedStore = {
                  ...store,
                  installation: { ...store.installation!, nodes: newNodes, appointmentTime: currentStep0Data.appointmentTime }
              };
              updateStoreInstallation(store.id, { nodes: newNodes, appointmentTime: currentStep0Data.appointmentTime });
          }
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
      // For step 0, sync appointment time to store root
      if (targetIndex === 0) {
          if (typeof newData === 'object' && newData.appointmentTime) {
              extraUpdates.appointmentTime = newData.appointmentTime;
          } else if (typeof newData === 'string') {
              extraUpdates.appointmentTime = newData;
          }
      }

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

  // --- Handlers for Step 0 (Preparation) ---
  const handlePreparationUpdate = (field: 'appointmentTime' | 'networkWhitelist' | 'roomAvailability', value: any) => {
      const currentNode = activeStore?.installation?.nodes[0];
      const currentData = currentNode?.data || { appointmentTime: '', checklist: { networkWhitelist: false, roomAvailability: false } };
      
      // Handle potential legacy string data gracefully
      const safeData = typeof currentData === 'string' 
          ? { appointmentTime: currentData, checklist: { networkWhitelist: false, roomAvailability: false } }
          : currentData;

      let newData;
      if (field === 'appointmentTime') {
          newData = { ...safeData, appointmentTime: value };
      } else {
          newData = { 
              ...safeData, 
              checklist: { 
                  ...safeData.checklist,
                  [field]: value 
              } 
          };
      }
      updateNodeData(0, newData);
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

  const handleSimulateCheckInImage = () => {
      const url = MOCK_ASSETS[Math.floor(Math.random() * MOCK_ASSETS.length)];
      const currentNode = activeStore?.installation?.nodes[1];
      const currentData = (currentNode?.data && typeof currentNode.data === 'object' && !Array.isArray(currentNode.data)) 
          ? currentNode.data 
          : { images: [], address: '' };
      
      const newData = {
          ...currentData,
          images: [...(currentData.images || []), url]
      };
      updateNodeData(1, newData);
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

  const handleSimulateSimpleImage = () => {
      const url = MOCK_ASSETS[Math.floor(Math.random() * MOCK_ASSETS.length)];
      const currentNode = activeStore?.installation?.nodes[currentStepIndex];
      const currentImages: string[] = Array.isArray(currentNode?.data) ? currentNode.data : [];
      const newImages = [...currentImages, url];
      updateNodeData(currentStepIndex, newImages);
  };

  const removeSimpleImage = (imgIndex: number) => {
      const currentNode = activeStore?.installation?.nodes[currentStepIndex];
      const currentImages: string[] = Array.isArray(currentNode?.data) ? currentNode.data : [];
      const newImages = currentImages.filter((_, i) => i !== imgIndex);
      updateNodeData(currentStepIndex, newImages);
  };

  // Helper to normalize room install data structure
  const getInstallModuleData = (rawData: any) => {
      if (Array.isArray(rawData)) {
          return { images: rawData, params: {} };
      } else if (typeof rawData === 'object' && rawData) {
          return { 
              images: rawData.images || [], 
              params: rawData.params || {} 
          };
      }
      return { images: [], params: {} };
  };

  // Complex Node: Install Complete (Step 3)
  const handleRoomImageUpload = (roomNumber: string, category: RoomImageCategory, e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const currentNode = activeStore?.installation?.nodes[currentStepIndex];
          const currentData = (currentNode?.data && typeof currentNode.data === 'object') ? currentNode.data : {};
          
          const roomData = currentData[roomNumber] || {};
          // Normalize to object structure
          const categoryData = getInstallModuleData(roomData[category]);
          
          const newData = {
              ...currentData,
              [roomNumber]: {
                  ...roomData,
                  [category]: {
                      ...categoryData,
                      images: [...categoryData.images, url]
                  }
              }
          };
          updateNodeData(currentStepIndex, newData);
          e.target.value = '';
      }
  };

  const handleSimulateRoomImage = (roomNumber: string, category: RoomImageCategory) => {
      const url = MOCK_ASSETS[Math.floor(Math.random() * MOCK_ASSETS.length)];
      const currentNode = activeStore?.installation?.nodes[currentStepIndex];
      const currentData = (currentNode?.data && typeof currentNode.data === 'object') ? currentNode.data : {};
      
      const roomData = currentData[roomNumber] || {};
      const categoryData = getInstallModuleData(roomData[category]);
      
      const newData = {
          ...currentData,
          [roomNumber]: {
              ...roomData,
              [category]: {
                  ...categoryData,
                  images: [...categoryData.images, url]
              }
          }
      };
      updateNodeData(currentStepIndex, newData);
  };

  const removeRoomImage = (roomNumber: string, category: RoomImageCategory, imgIndex: number) => {
      const currentNode = activeStore?.installation?.nodes[currentStepIndex];
      const currentData = currentNode?.data || {};
      const roomData = currentData[roomNumber] || {};
      const categoryData = getInstallModuleData(roomData[category]);
      
      const newData = {
          ...currentData,
          [roomNumber]: {
              ...roomData,
              [category]: {
                  ...categoryData,
                  images: categoryData.images.filter((_: string, i: number) => i !== imgIndex)
              }
          }
      };
      updateNodeData(currentStepIndex, newData);
  };

  // New: Handle Parameter Input
  const handleRoomParamUpdate = (roomNumber: string, category: RoomImageCategory, paramKey: string, value: any) => {
      const currentNode = activeStore?.installation?.nodes[currentStepIndex];
      const currentData = currentNode?.data || {};
      const roomData = currentData[roomNumber] || {};
      const categoryData = getInstallModuleData(roomData[category]);

      const newData = {
          ...currentData,
          [roomNumber]: {
              ...roomData,
              [category]: {
                  ...categoryData,
                  params: {
                      ...categoryData.params,
                      [paramKey]: value
                  }
              }
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

  const handleSimulateDeliveryItem = (type: 'image' | 'video') => {
      const url = MOCK_ASSETS[Math.floor(Math.random() * MOCK_ASSETS.length)];
      
      const currentNode = activeStore?.installation?.nodes[currentStepIndex];
      const currentItems = Array.isArray(currentNode?.data) ? currentNode.data : [];
      const normalizeItems = currentItems.map((item: any) => typeof item === 'string' ? { url: item, type: 'image' } : item);
      
      const newItems = [...normalizeItems, { url, type }];
      updateNodeData(currentStepIndex, newItems);
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
      if (currentStepIndex === 0) { // Prep
          const data = currentNode.data;
          // Handle legacy/string case
          if (typeof data === 'string') return !!data;
          if (typeof data === 'object') {
              return !!data.appointmentTime && data.checklist?.networkWhitelist && data.checklist?.roomAvailability;
          }
          return false;
      } else if (currentStepIndex === 1) { // Check-in
          const data = currentNode.data as { images: string[], address: string };
          const hasImages = data?.images?.length > 0;
          const hasAddress = !!data?.address;
          return hasImages && hasAddress;
      } else if (currentStepIndex === 3) { // Installation
          const roomData = currentNode.data || {};
          const rooms = activeStore.rooms;
          // Get Dynamic Installation Modules
          const installationModules = activeStore.moduleConfig.activeModules.filter(m => activeStore.moduleConfig.moduleTypes?.[m] === 'installation');
          
          if (installationModules.length === 0) return true; // No modules configured, allow complete

          if (rooms.length > 0) {
              return rooms.every(room => {
                  const rData = roomData[room.number] || {};
                  return installationModules.every(cat => {
                      const modData = getInstallModuleData(rData[cat]);
                      const hasImages = modData.images.length > 0;
                      
                      // Check Params if configured
                      const requiredParams = activeStore.moduleConfig.installationParams?.[cat] || [];
                      let hasParams = true;
                      if (requiredParams.length > 0) {
                          hasParams = requiredParams.every(pk => {
                              const val = modData.params[pk];
                              if (pk === 'deviceSn') return !!val && val.trim() !== '';
                              if (pk === 'powerOnBoot') return val !== undefined; // boolean check
                              return true;
                          });
                      }

                      return hasImages && hasParams;
                  });
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
          completionTime: new Date().toLocaleString(),
          operator: currentUser || 'System'
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
  const isRejected = currentStatus === 'rejected';
  
  // Allow edit even if complete/approved/audit, essentially always unlocked unless waiting for audit result
  // If isAuditMode is true, user sees Audit Actions. If false, user sees Installation Actions.
  // We hide "Confirm" if it's already approved to avoid re-submitting same state, but still allow viewing.
  const isLocked = isAuditMode; 

  const isRoomCompleted = (roomData: any) => {
      // Get Dynamic Installation Modules
      const installationModules = activeStore?.moduleConfig.activeModules.filter(m => activeStore.moduleConfig.moduleTypes?.[m] === 'installation') || [];
      if (installationModules.length === 0) return true;
      
      return installationModules.every(cat => {
          const modData = getInstallModuleData(roomData[cat]);
          const hasImages = modData.images.length > 0;
          
          // Check Params if configured
          const requiredParams = activeStore.moduleConfig.installationParams?.[cat] || [];
          let hasParams = true;
          if (requiredParams.length > 0) {
              hasParams = requiredParams.every(pk => {
                  const val = modData.params[pk];
                  if (pk === 'deviceSn') return !!val && val.trim() !== '';
                  if (pk === 'powerOnBoot') return val !== undefined; 
                  return true;
              });
          }
          return hasImages && hasParams;
      });
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
            <div className="relative mb-3">
                <select 
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                >
                    <option value="">{getAllRegionsLabel()}</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{getRegionLabel(r)}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            {/* Filter Tabs - New */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setFilterTab('all')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${filterTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    全部
                </button>
                <button 
                    onClick={() => setFilterTab('pending')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${filterTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    待完成
                </button>
                <button 
                    onClick={() => setFilterTab('approved')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${filterTab === 'approved' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    已审核
                </button>
            </div>
        </div>

        {/* Store List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredStores.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">没有找到门店数据</div>
            )}
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
                                {store.installationTask && (
                                    <div className="flex gap-2 mt-1.5">
                                        <div className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-1 self-start">
                                            <Calendar size={10} /> 预期安装: {store.installationTask.deadline}
                                        </div>
                                        {store.installationTask.assignee && (
                                            <div className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-1 self-start">
                                                <User size={10} /> 负责人: {store.installationTask.assignee}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                                <button 
                                    onClick={(e) => handleExport(e, store)}
                                    className="p-1.5 bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-500 rounded-lg transition-colors"
                                    title="导出安装记录"
                                >
                                    <Download size={16} />
                                </button>

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

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                );
            })}
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
                                    <div className="text-[10px] bg-green-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-green-100">
                                        <span className="text-green-600 font-bold">完成时间: {currentNode.completionTime}</span>
                                        <span className="text-slate-500 font-medium ml-2">操作人: {currentNode.operator || '-'}</span>
                                    </div>
                                )}
                            </div>
                            {currentStepIndex > 0 && currentStepIndex <= 5 && currentNode.name !== '安装' && (
                                <button onClick={() => openExample(currentNode.name)} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold hover:bg-blue-100 transition-colors"><ImageIcon size={12} /> 查看示例</button>
                            )}
                        </div>

                        <div className="flex-1 space-y-6">
                            
                            {/* Node 0: Preparation (Renamed from Appointment) */}
                            {currentStepIndex === 0 && (
                                <div className="space-y-4">
                                    {/* Date Picker */}
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
                                            value={currentNode.data && typeof currentNode.data === 'object' ? currentNode.data.appointmentTime : (typeof currentNode.data === 'string' ? currentNode.data : '')}
                                            onChange={(e) => handlePreparationUpdate('appointmentTime', e.target.value)}
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

                                    {/* Preparation Checklist */}
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                                            <ClipboardList size={16} className="text-blue-500" /> 
                                            安装筹备清单
                                        </h4>
                                        <div className="space-y-3">
                                            <div 
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                    (currentNode.data?.checklist?.networkWhitelist) 
                                                        ? 'bg-green-50 border-green-200' 
                                                        : 'bg-slate-50 border-slate-200 hover:border-blue-200'
                                                }`}
                                                onClick={() => !isLocked && handlePreparationUpdate('networkWhitelist', !(currentNode.data?.checklist?.networkWhitelist))}
                                            >
                                                <div className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                                                    (currentNode.data?.checklist?.networkWhitelist) ? 'text-green-600' : 'text-slate-300'
                                                }`}>
                                                    {(currentNode.data?.checklist?.networkWhitelist) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </div>
                                                <span className={`text-xs font-bold ${(currentNode.data?.checklist?.networkWhitelist) ? 'text-green-800' : 'text-slate-600'}`}>酒店网络白名单</span>
                                            </div>

                                            <div 
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                    (currentNode.data?.checklist?.roomAvailability) 
                                                        ? 'bg-green-50 border-green-200' 
                                                        : 'bg-slate-50 border-slate-200 hover:border-blue-200'
                                                }`}
                                                onClick={() => !isLocked && handlePreparationUpdate('roomAvailability', !(currentNode.data?.checklist?.roomAvailability))}
                                            >
                                                <div className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                                                    (currentNode.data?.checklist?.roomAvailability) ? 'text-green-600' : 'text-slate-300'
                                                }`}>
                                                    {(currentNode.data?.checklist?.roomAvailability) ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </div>
                                                <span className={`text-xs font-bold ${(currentNode.data?.checklist?.roomAvailability) ? 'text-green-800' : 'text-slate-600'}`}>运营空房时间确认</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-2 text-center">需完成上述所有筹备事项方可进入下一环节</p>
                                    </div>
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
                                                    <span className="text-[9px] text-slate-400 group-hover:text-blue-500 font-bold">上传</span>
                                                </div>
                                            )}
                                            {!isLocked && (
                                                <div 
                                                    onClick={handleSimulateCheckInImage}
                                                    className="aspect-square border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-300 relative group transition-all"
                                                >
                                                    <Camera size={20} className="text-slate-300 group-hover:text-blue-400 mb-1" />
                                                    <span className="text-[9px] text-slate-400 group-hover:text-blue-500 font-bold">拍照</span>
                                                </div>
                                            )}
                                            {(() => {
                                                const data = (currentNode.data && typeof currentNode.data === 'object' && !Array.isArray(currentNode.data)) ? currentNode.data as { images: string[] } : { images: [] };
                                                return data.images?.map((url: string, imgIdx: number) => (
                                                    <div key={imgIdx} className="aspect-square rounded-xl border border-slate-200 overflow-hidden relative group">
                                                        <img src={url} alt={`checkin-${imgIdx}`} className="w-full h-full object-cover" />
                                                        {!isLocked && (
                                                            <button onClick={() => removeCheckInImage(imgIdx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                                                        )}
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Node 3: Installation */}
                            {currentStepIndex === 3 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {activeStore.rooms.map(room => {
                                            const roomData = (currentNode.data && typeof currentNode.data === 'object') ? currentNode.data : {};
                                            const isComplete = isRoomCompleted(roomData[room.number] || {});
                                            
                                            return (
                                                <div 
                                                    key={room.number}
                                                    onClick={() => setInstallingRoomNumber(room.number)}
                                                    className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md text-center ${
                                                        isComplete ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-600'
                                                    }`}
                                                >
                                                    <div className="text-lg font-bold">{room.number}</div>
                                                    <div className="text-[9px] mt-1 opacity-80">{room.type}</div>
                                                    {isComplete && <div className="mt-2 text-[9px] flex items-center justify-center gap-1 font-bold"><CheckCircle size={10} /> 已完成</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Upload Modal for Room */}
                                    {installingRoomNumber && (
                                        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={() => setInstallingRoomNumber(null)}>
                                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><BedDouble size={18} className="text-blue-600"/> {installingRoomNumber} 安装上传</h3>
                                                    <button onClick={() => setInstallingRoomNumber(null)}><X size={20} className="text-slate-400" /></button>
                                                </div>
                                                <div className="p-4 space-y-6 overflow-y-auto flex-1">
                                                    {(() => {
                                                        const roomData = (currentNode.data && typeof currentNode.data === 'object') ? currentNode.data[installingRoomNumber] || {} : {};
                                                        
                                                        // Dynamic Modules
                                                        const installationModules = activeStore.moduleConfig.activeModules.filter(m => activeStore.moduleConfig.moduleTypes?.[m] === 'installation');

                                                        return installationModules.map((cat) => {
                                                            const modData = getInstallModuleData(roomData[cat]);
                                                            const catImages = modData.images;
                                                            const params = modData.params;
                                                            
                                                            const requiredParams = activeStore.moduleConfig.installationParams?.[cat] || [];

                                                            return (
                                                                <div key={cat} className="space-y-3">
                                                                    <label className="text-xs font-bold text-slate-600 uppercase flex items-center justify-between">
                                                                        {cat}
                                                                        <span className="text-[9px] text-slate-400 font-normal">至少1张</span>
                                                                    </label>
                                                                    
                                                                    {/* Render Parameters Input */}
                                                                    {requiredParams.length > 0 && (
                                                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 mb-2">
                                                                            {requiredParams.map(pk => (
                                                                                <div key={pk} className="flex flex-col gap-1">
                                                                                    <label className="text-[10px] font-bold text-slate-500">
                                                                                        {pk === 'deviceSn' ? '设备SN号' : pk === 'powerOnBoot' ? '通电自启' : pk}
                                                                                    </label>
                                                                                    {pk === 'powerOnBoot' ? (
                                                                                        <div className="flex gap-2">
                                                                                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                                                                                                <input 
                                                                                                    type="radio" 
                                                                                                    name={`${installingRoomNumber}-${cat}-${pk}`}
                                                                                                    checked={params[pk] === true} 
                                                                                                    onChange={() => !isLocked && handleRoomParamUpdate(installingRoomNumber, cat, pk, true)}
                                                                                                    disabled={isLocked}
                                                                                                /> 是
                                                                                            </label>
                                                                                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                                                                                                <input 
                                                                                                    type="radio" 
                                                                                                    name={`${installingRoomNumber}-${cat}-${pk}`}
                                                                                                    checked={params[pk] === false} 
                                                                                                    onChange={() => !isLocked && handleRoomParamUpdate(installingRoomNumber, cat, pk, false)}
                                                                                                    disabled={isLocked}
                                                                                                /> 否
                                                                                            </label>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <input 
                                                                                            type="text" 
                                                                                            className="border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-400"
                                                                                            value={params[pk] || ''}
                                                                                            onChange={(e) => !isLocked && handleRoomParamUpdate(installingRoomNumber, cat, pk, e.target.value)}
                                                                                            placeholder={`输入${pk}`}
                                                                                            disabled={isLocked}
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {!isLocked && (
                                                                            <div className="aspect-square border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 relative group transition-all">
                                                                                <input type="file" accept="image/*" onChange={(e) => handleRoomImageUpload(installingRoomNumber, cat, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                                                <Upload size={16} className="text-slate-300 group-hover:text-blue-400 mb-1" />
                                                                                <span className="text-[8px] text-slate-400 group-hover:text-blue-500 font-bold">上传</span>
                                                                            </div>
                                                                        )}
                                                                        {!isLocked && (
                                                                            <div 
                                                                                onClick={() => handleSimulateRoomImage(installingRoomNumber, cat)}
                                                                                className="aspect-square border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 relative group transition-all"
                                                                            >
                                                                                <Camera size={16} className="text-slate-300 group-hover:text-blue-400 mb-1" />
                                                                                <span className="text-[8px] text-slate-400 group-hover:text-blue-500 font-bold">拍照</span>
                                                                            </div>
                                                                        )}
                                                                        {catImages.map((url: string, imgIdx: number) => (
                                                                            <div key={imgIdx} className="aspect-square rounded-lg border border-slate-200 overflow-hidden relative group">
                                                                                <img src={url} alt="room-install" className="w-full h-full object-cover" />
                                                                                {!isLocked && (
                                                                                    <button onClick={() => removeRoomImage(installingRoomNumber, cat, imgIdx)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"><X size={10} /></button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                                <div className="p-4 border-t border-slate-100 bg-slate-50">
                                                    <button onClick={() => setInstallingRoomNumber(null)} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">完成上传</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Debug */}
                            {currentStepIndex === 4 && (
                                <div className="space-y-3">
                                    {activeStore.rooms.map(room => {
                                        const roomData = (currentNode.data && typeof currentNode.data === 'object' && !Array.isArray(currentNode.data)) ? currentNode.data : {};
                                        const rData = roomData[room.number] || {};
                                        const isDone = isDebugRoomCompleted(rData);
                                        const isExpanded = expandedRoomNumber === room.number;

                                        return (
                                            <div key={room.number} className={`border rounded-xl transition-all ${isDone ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                                <div 
                                                    className="p-3 flex justify-between items-center cursor-pointer"
                                                    onClick={() => toggleRoomAccordion(room.number)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-bold ${isDone ? 'text-green-800' : 'text-slate-700'}`}>{room.number}</span>
                                                        <span className="text-[10px] text-slate-400 bg-white/50 px-1.5 py-0.5 rounded border border-slate-100">{room.type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isDone && <CheckCircle size={16} className="text-green-600" />}
                                                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                    </div>
                                                </div>
                                                
                                                {isExpanded && (
                                                    <div className="p-3 border-t border-slate-100/50 bg-white/50 rounded-b-xl animate-fadeIn space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-600 flex items-center gap-2"><Wifi size={14} className="text-blue-500" /> 网络连通性</span>
                                                            {rData.network ? (
                                                                <span className="text-[10px] text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded">正常</span>
                                                            ) : (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleDebugSync(room.number, 'network'); }}
                                                                    disabled={isLocked || debugLoading[`${room.number}-network`]}
                                                                    className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    {debugLoading[`${room.number}-network`] ? <RefreshCw size={10} className="animate-spin" /> : '检测'}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-600 flex items-center gap-2"><FileText size={14} className="text-purple-500" /> 日志上报</span>
                                                            {rData.log ? (
                                                                <span className="text-[10px] text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded">正常</span>
                                                            ) : (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleDebugSync(room.number, 'log'); }}
                                                                    disabled={isLocked || debugLoading[`${room.number}-log`]}
                                                                    className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    {debugLoading[`${room.number}-log`] ? <RefreshCw size={10} className="animate-spin" /> : '检测'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Generic Image Upload Steps (2: Inventory, 5: Delivery) */}
                            {(currentStepIndex === 2 || currentStepIndex === 5) && (
                                <div className="space-y-4">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center py-8">
                                        <div className="inline-flex justify-center items-center gap-2 mb-4 bg-blue-50 px-3 py-1 rounded-full text-blue-600 text-xs font-bold border border-blue-100">
                                            <Upload size={14} />
                                            {currentStepIndex === 5 ? '上传交付确认单 / 现场视频' : '请拍照上传'}
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-3">
                                            {!isLocked && (
                                                <div className="aspect-square border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 relative group transition-all">
                                                    <input type="file" accept={currentStepIndex === 5 ? "image/*,video/*" : "image/*"} onChange={currentStepIndex === 5 ? handleDeliveryUpload : handleSimpleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                    <Upload size={24} className="text-blue-400 group-hover:scale-110 transition-transform mb-1" />
                                                    <span className="text-[10px] text-blue-500 font-bold">上传</span>
                                                </div>
                                            )}
                                            {!isLocked && (
                                                <div 
                                                    onClick={() => currentStepIndex === 5 ? handleSimulateDeliveryItem('image') : handleSimulateSimpleImage()}
                                                    className="aspect-square border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 relative group transition-all"
                                                >
                                                    <Camera size={24} className="text-blue-400 group-hover:scale-110 transition-transform mb-1" />
                                                    <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-bold">拍照</span>
                                                </div>
                                            )}
                                            {(() => {
                                                const currentItems = Array.isArray(currentNode.data) ? currentNode.data : [];
                                                const normalizeItems = currentItems.map((item: any) => typeof item === 'string' ? { url: item, type: 'image' } : item);
                                                
                                                return normalizeItems.map((item: { url: string, type: 'image' | 'video' }, idx: number) => (
                                                    <div key={idx} className="aspect-square rounded-xl border border-slate-200 overflow-hidden relative group">
                                                        <img src={item.url} alt={`delivery-${idx}`} className="w-full h-full object-cover" />
                                                        {item.type === 'video' && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><PlayCircle size={24} className="text-white opacity-80" /></div>}
                                                        {!isLocked && (
                                                            <button onClick={() => removeDeliveryItem(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                                                        )}
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Navigation & Actions - UPDATED: Nav Buttons Always Visible */}
                <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0 flex flex-col gap-3 sticky bottom-0 z-20">
                    
                    {/* Action Area: Differs by Mode */}
                    {isAuditMode ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3 justify-between items-center mb-1">
                                <span className="text-xs text-slate-400 font-bold">
                                    审核环节: {currentNode.name}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <AuditGate type="installation" stage={getCurrentStage()} className="flex-1">
                                    <button onClick={() => setRejectMode(true)} className="w-full py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">驳回</button>
                                </AuditGate>
                                <AuditGate type="installation" stage={getCurrentStage()} className="flex-1">
                                    <button onClick={handleAuditApprove} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-all">{getApproveLabel()}</button>
                                </AuditGate>
                            </div>
                            
                            {/* Reject Input Overlay inside Footer area if active */}
                            {rejectMode && (
                                <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-red-200 shadow-lg animate-slideInUp z-30">
                                    <textarea 
                                        autoFocus
                                        className="w-full border border-red-200 rounded-xl p-3 text-sm bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-500 mb-3"
                                        placeholder="请输入驳回原因..."
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setRejectMode(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">取消</button>
                                        <button onClick={handleAuditReject} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl text-sm shadow-md">确认驳回</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Installation Mode Actions */
                        !isApproved && !isRejected && (
                            <>
                                {/* Confirm Step Button */}
                                {!currentNode.completed ? (
                                    <button 
                                        onClick={handleConfirmStep}
                                        disabled={!canCompleteStep}
                                        className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1
                                            ${!canCompleteStep
                                                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                                                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
                                    >
                                        确认完成此环节 <CheckCircle size={16} />
                                    </button>
                                ) : (
                                    // If completed and it's the last step, show Submit
                                    currentStepIndex === activeStore.installation.nodes.length - 1 ? (
                                        <button 
                                            onClick={handleSubmit}
                                            className="w-full py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-1 animate-pulse"
                                        >
                                            提交审核 <Check size={16} />
                                        </button>
                                    ) : (
                                        <div className="w-full py-3 bg-green-50 text-green-600 border border-green-200 font-bold rounded-xl flex items-center justify-center gap-1">
                                            <CheckCircle size={16} /> 本环节已完成
                                        </div>
                                    )
                                )}
                            </>
                        )
                    )}

                    {/* Navigation Buttons - Always Visible (Outside Conditional) */}
                    <div className="flex gap-3 pt-1">
                        <button 
                            onClick={goPrevStep}
                            disabled={currentStepIndex === 0}
                            className={`flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-1 transition-colors
                                ${currentStepIndex === 0 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <ChevronLeft size={16} /> 上一步
                        </button>
                        
                        <button 
                            onClick={goNextStep}
                            disabled={currentStepIndex === activeStore.installation.nodes.length - 1}
                            className={`flex-1 py-3 font-bold rounded-xl flex items-center justify-center gap-1 transition-colors
                                ${currentStepIndex === activeStore.installation.nodes.length - 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            下一步 <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};