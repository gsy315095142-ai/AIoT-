import React, { useState, useMemo, ChangeEvent } from 'react';
import { useApp } from '../context/AppContext';
import { DeviceStatus, OpsStatus, DeviceImage, DeviceEvent, Device, AuditStatus, AuditType } from '../types';
import { CATEGORY_LIMITS } from '../components/DeviceComponents';

export const useDeviceLogic = () => {
  const { devices, regions, stores, deviceTypes, suppliers, updateDevice, auditRecords, submitOpsStatusChange, submitInspectionReport, deleteDeviceEvent, addFeedback, feedbacks } = useApp();
  
  // Filter States
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOpsStatus, setSelectedOpsStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // UI States
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  
  // Modal States
  const [editingImageDevice, setEditingImageDevice] = useState<Device | null>(null);
  const [isControlMenuOpen, setIsControlMenuOpen] = useState(false);
  const [isOpsStatusModalOpen, setIsOpsStatusModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [inspectingDeviceId, setInspectingDeviceId] = useState<string | null>(null);
  
  // Feedback Modal States
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackImages, setFeedbackImages] = useState<string[]>([]);

  // Detail Modal States
  const [viewingReportDevice, setViewingReportDevice] = useState<Device | null>(null);
  const [viewingEventData, setViewingEventData] = useState<{ event: DeviceEvent, deviceId: string } | null>(null);
  
  // Ops Status Change State
  const [opsChangeStatus, setOpsChangeStatus] = useState<OpsStatus>(OpsStatus.INSPECTED);
  const [opsChangeReason, setOpsChangeReason] = useState('');
  const [complaintType, setComplaintType] = useState('');
  const [opsChangeImages, setOpsChangeImages] = useState<string[]>([]);

  // Inspection Report State
  const [inspResult, setInspResult] = useState<'Qualified' | 'Unqualified'>('Qualified');
  const [inspRemark, setInspRemark] = useState('');
  const [inspImages, setInspImages] = useState<string[]>([]);

  // Computed Values
  const availableStores = useMemo(() => {
    return selectedRegion ? stores.filter(s => s.regionId === selectedRegion) : stores;
  }, [stores, selectedRegion]);

  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (selectedRegion && d.regionId !== selectedRegion) return false;
      if (selectedStore && d.storeId !== selectedStore) return false;
      if (selectedType && d.typeId !== selectedType) return false;
      
      if (selectedStatus && d.status !== selectedStatus) {
         if (selectedStatus === DeviceStatus.ONLINE) {
             if (d.status !== DeviceStatus.ONLINE && d.status !== DeviceStatus.IN_USE) return false;
         } else {
             return false;
         }
      }
      if (selectedOpsStatus && d.opsStatus !== selectedOpsStatus) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!d.name.toLowerCase().includes(query) && !d.sn.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [devices, selectedRegion, selectedStore, selectedType, selectedStatus, selectedOpsStatus, searchQuery]);

  const pendingAuditCount = auditRecords.filter(r => r.auditStatus === AuditStatus.PENDING).length;
  
  const pendingFeedbackCount = useMemo(() => {
      return feedbacks.filter(f => f.status === 'pending_receive').length;
  }, [feedbacks]);

  // Actions
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedDeviceIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDeviceIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedDeviceIds.size === filteredDevices.length && filteredDevices.length > 0) setSelectedDeviceIds(new Set());
    else setSelectedDeviceIds(new Set(filteredDevices.map(d => d.id)));
  };

  const toggleExpand = (id: string) => setExpandedDeviceId(expandedDeviceId === id ? null : id);

  const handleBatchRun = () => {
    if (selectedDeviceIds.size === 0) return;
    selectedDeviceIds.forEach(id => updateDevice(id, { status: DeviceStatus.ONLINE }));
    setIsControlMenuOpen(false); setSelectedDeviceIds(new Set()); 
  };

  const handleBatchSleep = () => {
    if (selectedDeviceIds.size === 0) return;
    selectedDeviceIds.forEach(id => updateDevice(id, { status: DeviceStatus.STANDBY }));
    setIsControlMenuOpen(false); setSelectedDeviceIds(new Set());
  };

  const handleBatchRestart = () => {
    if (selectedDeviceIds.size === 0) return;
    selectedDeviceIds.forEach(id => updateDevice(id, { status: DeviceStatus.OFFLINE }));
    setIsControlMenuOpen(false); setSelectedDeviceIds(new Set());
  };

  // Open feedback modal logic
  const handleBatchFeedback = () => {
    if (selectedDeviceIds.size === 0) return;
    setFeedbackContent('');
    setFeedbackImages([]);
    setIsFeedbackModalOpen(true);
    setIsControlMenuOpen(false);
  };

  // Submit feedback logic
  const handleSubmitFeedback = () => {
      if (!feedbackContent.trim()) { alert("请输入反馈内容"); return; }
      selectedDeviceIds.forEach(id => {
          addFeedback(id, feedbackContent, feedbackImages);
      });
      alert("已确认反馈，请前往【设备反馈管理】查看");
      setIsFeedbackModalOpen(false);
      setSelectedDeviceIds(new Set());
  };

  const handleFeedbackImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          setFeedbackImages(prev => [...prev, url]);
      }
      e.target.value = '';
  }

  const removeFeedbackImage = (idx: number) => setFeedbackImages(prev => prev.filter((_, i) => i !== idx));

  const openOpsStatusModal = () => {
    if (selectedDeviceIds.size === 0) return;
    setOpsChangeReason(''); setOpsChangeStatus(OpsStatus.INSPECTED); setComplaintType(''); setOpsChangeImages([]);
    setIsOpsStatusModalOpen(true); setIsControlMenuOpen(false);
  };

  const handleOpsImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          setOpsChangeImages(prev => [...prev, url]);
      }
      e.target.value = '';
  }

  const removeOpsImage = (idx: number) => setOpsChangeImages(prev => prev.filter((_, i) => i !== idx));

  const handleBatchOpsStatusSubmit = () => {
    if (!opsChangeReason.trim()) { alert("请输入变更说明"); return; }
    let finalMessage = opsChangeReason;
    if (opsChangeStatus === OpsStatus.HOTEL_COMPLAINT) {
        if (!complaintType) { alert("请选择客诉类型"); return; }
        finalMessage = `[${complaintType}] ${opsChangeReason}`;
    }
    selectedDeviceIds.forEach(id => submitOpsStatusChange(id, opsChangeStatus, finalMessage, opsChangeImages));
    setIsOpsStatusModalOpen(false); setSelectedDeviceIds(new Set());
  };

  const openInspectionModal = (deviceId: string) => {
      setInspectingDeviceId(deviceId);
      setInspResult('Qualified');
      setInspRemark('');
      setInspImages([]);
      setIsInspectionModalOpen(true);
  };

  const handleInspImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          setInspImages(prev => [...prev, url]);
      }
      e.target.value = '';
  }

  const removeInspImage = (idx: number) => setInspImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmitInspection = () => {
      if (!inspectingDeviceId) return;
      if (!inspRemark.trim()) { alert("请输入备注信息"); return; }
      submitInspectionReport(inspectingDeviceId, inspResult, inspRemark, inspImages);
      setIsInspectionModalOpen(false);
      setInspectingDeviceId(null);
  }

  const hasPendingAudit = (deviceId: string) => auditRecords.some(r => r.deviceId === deviceId && r.auditStatus === AuditStatus.PENDING && r.type === AuditType.OPS_STATUS);

  return {
    // Data
    devices, // Export raw devices list for stats calculation
    regions, stores, deviceTypes, suppliers, filteredDevices, availableStores, auditRecords, pendingAuditCount, pendingFeedbackCount, CATEGORY_LIMITS,
    
    // States
    selectedRegion, setSelectedRegion,
    selectedStore, setSelectedStore,
    selectedType, setSelectedType,
    selectedStatus, setSelectedStatus,
    selectedOpsStatus, setSelectedOpsStatus,
    searchQuery, setSearchQuery,
    
    expandedDeviceId, setExpandedDeviceId, // Exported setter
    selectedDeviceIds,
    
    editingImageDevice, setEditingImageDevice,
    isControlMenuOpen, setIsControlMenuOpen,
    isOpsStatusModalOpen, setIsOpsStatusModalOpen,
    isInspectionModalOpen, setIsInspectionModalOpen,
    isFeedbackModalOpen, setIsFeedbackModalOpen, // New State
    
    viewingReportDevice, setViewingReportDevice,
    viewingEventData, setViewingEventData,

    opsChangeStatus, setOpsChangeStatus,
    opsChangeReason, setOpsChangeReason,
    complaintType, setComplaintType,
    opsChangeImages, 
    
    inspResult, setInspResult,
    inspRemark, setInspRemark,
    inspImages,
    
    feedbackContent, setFeedbackContent, // New State
    feedbackImages, // New State
    
    // Actions
    toggleSelection, toggleSelectAll, toggleExpand, hasPendingAudit,
    handleBatchRun, handleBatchSleep, handleBatchRestart, handleBatchFeedback, handleSubmitFeedback, // New Action
    openOpsStatusModal, handleOpsImageUpload, removeOpsImage, handleBatchOpsStatusSubmit,
    openInspectionModal, handleInspImageUpload, removeInspImage, handleSubmitInspection,
    handleFeedbackImageUpload, removeFeedbackImage, // New Actions
  };
};