
import React, { useState, useMemo, ChangeEvent, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Device, OpsStatus, DeviceStatus, DeviceImage, AuditStatus, AuditRecord } from '../types';
import { ChevronDown, ChevronUp, Plus, Wifi, Image as ImageIcon, Search, CheckSquare, Square, X, FilePenLine, ClipboardList, Battery, Volume2, Check, X as XIcon, Upload, Settings2, Play, Moon, RotateCcw, ClipboardCheck, History, AlertCircle, Info, MapPin, Headphones, Activity, Wrench } from 'lucide-react';

const CATEGORY_LIMITS: Record<string, number> = {
  '设备外观': 2,
  '安装现场': 2,
  '其他': 1
};

const STATUS_MAP: Record<string, string> = {
    [DeviceStatus.ONLINE]: '运行中',
    [DeviceStatus.OFFLINE]: '未联网',
    [DeviceStatus.STANDBY]: '待机中',
    [DeviceStatus.IN_USE]: '使用中'
};

// --- Helper Components ---

interface EditableFieldProps {
  value: string;
  displayValue?: React.ReactNode;
  type: 'text' | 'select' | 'datetime-local';
  options?: { label: string; value: string }[];
  onSave: (newValue: string) => void;
  className?: string;
  label?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ value, displayValue, type, options, onSave, className, label }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  // Reset temp value when editing starts or value prop changes
  useEffect(() => {
    setTempValue(value);
  }, [value, isEditing]);

  const handleSave = () => {
    if (tempValue !== value) {
      onSave(tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempValue(value);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 flex-1 min-w-0 animate-fadeIn">
        {type === 'select' ? (
          <select
            autoFocus
            className="flex-1 text-[10px] border border-blue-400 rounded px-1 py-0.5 bg-white outline-none"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
          >
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            autoFocus
            type={type}
            className="flex-1 text-[10px] border border-blue-400 rounded px-1 py-0.5 bg-white outline-none min-w-0"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
          />
        )}
        <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-0.5 rounded">
          <Check size={12} />
        </button>
        <button onClick={handleCancel} className="text-red-500 hover:bg-red-100 p-0.5 rounded">
          <XIcon size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between group ${className}`}>
      <span className="truncate mr-1">{displayValue || value || '-'}</span>
      <FilePenLine 
        size={10} 
        className="text-blue-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" 
        onClick={() => setIsEditing(true)} 
      />
    </div>
  );
};

// --- Image Manager Modal ---

interface ImageManagerModalProps {
  device: Device;
  onClose: () => void;
}

const ImageManagerModal: React.FC<ImageManagerModalProps> = ({ device, onClose }) => {
  const { updateDevice } = useApp();
  const [images, setImages] = useState<DeviceImage[]>(device.images || (device.imageUrl ? [{ url: device.imageUrl, category: '设备外观' }] : []));
  const [activeTab, setActiveTab] = useState<string>('设备外观');

  const imageCounts = useMemo(() => {
    const counts: Record<string, number> = { '设备外观': 0, '安装现场': 0, '其他': 0 };
    images.forEach(img => {
      if (counts[img.category] !== undefined) {
        counts[img.category]++;
      }
    });
    return counts;
  }, [images]);

  const currentLimit = CATEGORY_LIMITS[activeTab];
  const currentCount = imageCounts[activeTab] || 0;
  const isCurrentTabFull = currentCount >= currentLimit;

  const handleAddImage = (e: ChangeEvent<HTMLInputElement>) => {
    if (isCurrentTabFull) return;

    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      // Add image directly to the active category
      const newImage: DeviceImage = { url, category: activeTab };
      setImages(prev => [newImage, ...prev]);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (originalIndex: number) => {
    setImages(prev => prev.filter((_, i) => i !== originalIndex));
  };

  const handleCategoryChange = (originalIndex: number, newCategory: string) => {
    setImages(prev => {
      const updated = [...prev];
      updated[originalIndex] = { ...updated[originalIndex], category: newCategory };
      return updated;
    });
  };

  const handleSave = () => {
    // Update device with new images list. Also update legacy imageUrl for list view compatibility
    const mainImageUrl = images.length > 0 ? images[0].url : undefined;
    updateDevice(device.id, { images, imageUrl: mainImageUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">管理设备图片</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
            {Object.keys(CATEGORY_LIMITS).map(cat => {
                const isActive = activeTab === cat;
                const count = imageCounts[cat] || 0;
                const limit = CATEGORY_LIMITS[cat];
                return (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`flex-1 py-3 text-xs font-medium text-center relative whitespace-nowrap px-2 transition-colors
                            ${isActive ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}
                        `}
                    >
                        {cat} <span className="opacity-80">({count}/{limit})</span>
                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
                    </button>
                )
            })}
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
             {/* Upload Button for Active Category */}
            <div className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors relative 
                ${isCurrentTabFull ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50' : 'border-blue-300 bg-blue-50 hover:bg-blue-100 cursor-pointer'}`}>
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAddImage} 
                    disabled={isCurrentTabFull}
                    className={`absolute inset-0 z-10 w-full h-full ${isCurrentTabFull ? 'cursor-not-allowed' : 'cursor-pointer'} opacity-0`} 
                />
                <Upload className={isCurrentTabFull ? 'text-slate-300' : 'text-blue-500 mb-1'} size={24} />
                <span className={`text-[10px] text-center px-1 ${isCurrentTabFull ? 'text-slate-300' : 'text-blue-600'}`}>
                    {isCurrentTabFull ? '已达上限' : '上传图片'}
                </span>
            </div>

            {images.map((img, index) => {
                // Filter by active tab
                if (img.category !== activeTab) return null;
                
                return (
                    <div key={index} className="relative group border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm animate-fadeIn">
                        <div className="aspect-square bg-slate-100 relative">
                            <img src={img.url} alt={`img-${index}`} className="w-full h-full object-cover" />
                            <button 
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                            <X size={10} />
                            </button>
                        </div>
                        <div className="p-1">
                        <select 
                            value={img.category} 
                            onChange={(e) => handleCategoryChange(index, e.target.value)}
                            className="w-full text-[10px] border border-slate-200 rounded py-1 px-1 bg-slate-50 focus:outline-none"
                        >
                            {Object.entries(CATEGORY_LIMITS).map(([cat, limit]) => {
                                const count = imageCounts[cat] || 0;
                                const isFull = count >= limit;
                                const isCurrent = img.category === cat;
                                const isDisabled = isFull && !isCurrent;
                                return (
                                    <option key={cat} value={cat} disabled={isDisabled}>
                                        {cat} ({count}/{limit})
                                    </option>
                                );
                            })}
                        </select>
                        </div>
                    </div>
                );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button 
            onClick={handleSave}
            className="w-full py-2 bg-primary text-white font-bold rounded-lg shadow-md active:scale-95 transition-transform text-sm"
          >
            保存更改
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Audit Management Modal ---

const AuditManagementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { auditRecords, approveAudit, rejectAudit } = useApp();
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const pendingRecords = auditRecords.filter(r => r.auditStatus === AuditStatus.PENDING);
    const historyRecords = auditRecords.filter(r => r.auditStatus !== AuditStatus.PENDING);
    
    const displayRecords = activeTab === 'pending' ? pendingRecords : historyRecords;

    const handleRejectClick = (id: string) => {
        setRejectingId(id);
        setRejectReason('');
    };

    const confirmReject = () => {
        if (rejectingId && rejectReason.trim()) {
            rejectAudit(rejectingId, rejectReason);
            setRejectingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
            <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-sm h-[80vh] flex flex-col overflow-hidden">
                <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <ClipboardCheck size={20} className="text-blue-600" />
                        设备审核
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <div className="flex bg-white border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                    >
                        待审核 ({pendingRecords.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                    >
                        历史记录
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {displayRecords.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <History size={32} className="mb-2 opacity-50" />
                            <p className="text-xs">暂无相关记录</p>
                        </div>
                    )}
                    {displayRecords.map(record => (
                        <div key={record.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">{record.deviceName}</span>
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">{record.deviceSn}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                       <span className="font-medium">{record.storeName || '未知门店'}</span>
                                       <span className="w-px h-2 bg-slate-300"></span>
                                       <span>{record.roomNumber ? `${record.roomNumber}房` : '无房号'}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">申请人: {record.requestUser} | {record.requestTime}</div>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold 
                                    ${record.auditStatus === AuditStatus.APPROVED ? 'bg-green-100 text-green-600' : 
                                      record.auditStatus === AuditStatus.REJECTED ? 'bg-red-100 text-red-600' : 
                                      record.auditStatus === AuditStatus.INVALID ? 'bg-slate-100 text-slate-400' : 'bg-orange-100 text-orange-600'}`}>
                                    {record.auditStatus}
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-2 rounded border border-slate-100 mb-2 flex items-center justify-between text-xs">
                                <div className="text-slate-500 font-medium">{record.prevOpsStatus}</div>
                                <div className="text-slate-300">→</div>
                                <div className="text-blue-600 font-bold">{record.targetOpsStatus}</div>
                            </div>

                            <div className="text-xs text-slate-600 bg-blue-50/50 p-2 rounded mb-2">
                                <span className="font-bold text-slate-500">备注:</span> {record.changeReason}
                            </div>
                            
                            {/* Evidence Images */}
                            {record.images && record.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                                    {record.images.map((img, idx) => (
                                        <div key={idx} className="w-12 h-12 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                                            <img src={img} alt="evidence" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {record.auditStatus !== AuditStatus.PENDING && record.rejectReason && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-1">
                                    <span className="font-bold">拒绝原因:</span> {record.rejectReason}
                                </div>
                            )}

                            {activeTab === 'pending' && (
                                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-50">
                                    {rejectingId === record.id ? (
                                        <div className="flex-1 flex gap-2 animate-fadeIn">
                                            <input 
                                                autoFocus
                                                placeholder="输入拒绝原因..."
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                className="flex-1 text-xs border border-red-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-300"
                                            />
                                            <button onClick={confirmReject} className="bg-red-500 text-white text-xs px-2 py-1 rounded">确认</button>
                                            <button onClick={() => setRejectingId(null)} className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded">取消</button>
                                        </div>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => handleRejectClick(record.id)}
                                                className="flex-1 py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 text-xs font-bold transition-colors"
                                            >
                                                拒绝
                                            </button>
                                            <button 
                                                onClick={() => approveAudit(record.id)}
                                                className="flex-1 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-bold transition-colors shadow-sm"
                                            >
                                                通过
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// --- Main Page Component ---

export const DeviceManagement: React.FC = () => {
  const { devices, regions, stores, deviceTypes, updateDevice, addDevice, auditRecords, submitOpsStatusChange } = useApp();
  
  // Filter States
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingImageDevice, setEditingImageDevice] = useState<Device | null>(null);
  const [isControlMenuOpen, setIsControlMenuOpen] = useState(false);
  const [isOpsStatusModalOpen, setIsOpsStatusModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  
  // Ops Status Change State
  const [opsChangeStatus, setOpsChangeStatus] = useState<OpsStatus>(OpsStatus.INSPECTED);
  const [opsChangeReason, setOpsChangeReason] = useState('');
  const [complaintType, setComplaintType] = useState('');
  const [opsChangeImages, setOpsChangeImages] = useState<string[]>([]);

  const pendingAuditCount = auditRecords.filter(r => r.auditStatus === AuditStatus.PENDING).length;

  // Form State for Add Device Only
  interface DeviceFormState {
    name: string;
    sn: string;
    mac: string;
    regionId: string;
    storeId: string;
    typeId: string;
    roomNumber: string;
    softwareName: string;
    firstStartTime: string; 
    images: DeviceImage[];
  }

  const initialFormState: DeviceFormState = {
    name: '', sn: '', mac: '', regionId: '', storeId: '', typeId: '', roomNumber: '', softwareName: '', firstStartTime: '', images: []
  };

  const [deviceForm, setDeviceForm] = useState<DeviceFormState>(initialFormState);

  // Helpers
  const getStoreName = (id: string) => stores.find(s => s.id === id)?.name || '-';
  const getTypeName = (id: string) => deviceTypes.find(t => t.id === id)?.name || '-';

  const calculateDuration = (dateStr: string) => {
    if (!dateStr) return '-';
    const start = new Date(dateStr).getTime();
    const now = new Date().getTime();
    if (isNaN(start)) return '-';
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d` : '1d';
  };

  const toInputDate = (dateStr: string) => dateStr.replace(' ', 'T');
  const fromInputDate = (dateStr: string) => dateStr.replace('T', ' ');

  const hasPendingAudit = (deviceId: string) => {
      return auditRecords.some(r => r.deviceId === deviceId && r.auditStatus === AuditStatus.PENDING);
  };

  // Filter Logic
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (selectedRegion && d.regionId !== selectedRegion) return false;
      if (selectedStore && d.storeId !== selectedStore) return false;
      if (selectedType && d.typeId !== selectedType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!d.name.toLowerCase().includes(query) && 
            !d.sn.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [devices, selectedRegion, selectedStore, selectedType, searchQuery]);

  // Stats Logic
  const stats = useMemo(() => {
    return {
      online: filteredDevices.filter(d => d.status === DeviceStatus.ONLINE && d.opsStatus === OpsStatus.INSPECTED).length,
      offline: filteredDevices.filter(d => d.status === DeviceStatus.OFFLINE && d.opsStatus === OpsStatus.INSPECTED).length,
      standby: filteredDevices.filter(d => d.status === DeviceStatus.STANDBY).length,
      pending: filteredDevices.filter(d => hasPendingAudit(d.id)).length, // Count based on Audit Records
      abnormal: filteredDevices.filter(d => d.opsStatus === OpsStatus.ABNORMAL).length,
      repairing: filteredDevices.filter(d => d.opsStatus === OpsStatus.REPAIRING).length,
      complaint: filteredDevices.filter(d => d.opsStatus === OpsStatus.HOTEL_COMPLAINT).length,
    };
  }, [filteredDevices, auditRecords]);

  // Selection Logic
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedDeviceIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDeviceIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedDeviceIds.size === filteredDevices.length && filteredDevices.length > 0) {
      setSelectedDeviceIds(new Set());
    } else {
      setSelectedDeviceIds(new Set(filteredDevices.map(d => d.id)));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedDeviceId(expandedDeviceId === id ? null : id);
  };

  // --- Device Control Handlers ---

  const handleBatchRun = () => {
    if (selectedDeviceIds.size === 0) return;
    selectedDeviceIds.forEach(id => {
      updateDevice(id, { status: DeviceStatus.ONLINE });
    });
    setIsControlMenuOpen(false);
    setSelectedDeviceIds(new Set()); 
  };

  const handleBatchSleep = () => {
    if (selectedDeviceIds.size === 0) return;
    selectedDeviceIds.forEach(id => {
      updateDevice(id, { status: DeviceStatus.STANDBY });
    });
    setIsControlMenuOpen(false);
    setSelectedDeviceIds(new Set());
  };

  const handleBatchRestart = () => {
    if (selectedDeviceIds.size === 0) return;
    selectedDeviceIds.forEach(id => {
      updateDevice(id, { status: DeviceStatus.OFFLINE });
    });
    setIsControlMenuOpen(false);
    setSelectedDeviceIds(new Set());
  };

  const openOpsStatusModal = () => {
    if (selectedDeviceIds.size === 0) return;
    setOpsChangeReason('');
    setOpsChangeStatus(OpsStatus.INSPECTED);
    setComplaintType('');
    setOpsChangeImages([]);
    setIsOpsStatusModalOpen(true);
    setIsControlMenuOpen(false);
  };

  const handleOpsImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          setOpsChangeImages(prev => [...prev, url]);
      }
      e.target.value = '';
  }

  const removeOpsImage = (idx: number) => {
      setOpsChangeImages(prev => prev.filter((_, i) => i !== idx));
  }

  const handleBatchOpsStatusSubmit = () => {
    if (!opsChangeReason.trim()) {
      alert("请输入变更说明");
      return;
    }
    
    let finalMessage = opsChangeReason;
    
    if (opsChangeStatus === OpsStatus.HOTEL_COMPLAINT) {
        if (!complaintType) {
            alert("请选择客诉类型");
            return;
        }
        finalMessage = `[${complaintType}] ${opsChangeReason}`;
    }

    selectedDeviceIds.forEach(id => {
      // Use the new Audit submission workflow with images
      submitOpsStatusChange(id, opsChangeStatus, finalMessage, opsChangeImages);
    });
    setIsOpsStatusModalOpen(false);
    setSelectedDeviceIds(new Set());
  };

  // Add Device Handlers
  const imageCounts = useMemo(() => {
    const counts: Record<string, number> = { '设备外观': 0, '安装现场': 0, '其他': 0 };
    deviceForm.images.forEach(img => {
      if (counts[img.category] !== undefined) {
        counts[img.category]++;
      }
    });
    return counts;
  }, [deviceForm.images]);

  const isTotalLimitReached = useMemo(() => {
     return Object.keys(CATEGORY_LIMITS).every(cat => (imageCounts[cat] || 0) >= CATEGORY_LIMITS[cat]);
  }, [imageCounts]);

  const openAddModal = () => {
    setDeviceForm({ ...initialFormState });
    setIsAddModalOpen(true);
  };

  const handleAddFormImage = (e: ChangeEvent<HTMLInputElement>) => {
    const availableCategory = Object.keys(CATEGORY_LIMITS).find(cat => (imageCounts[cat] || 0) < CATEGORY_LIMITS[cat]);

    if (!availableCategory) {
      alert("所有分类图片的数量已达上限，无法继续添加");
      e.target.value = '';
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      const newImage: DeviceImage = { url, category: availableCategory }; 
      setDeviceForm(prev => ({
        ...prev,
        images: [newImage, ...prev.images]
      }));
      e.target.value = '';
    }
  };

  const handleRemoveFormImage = (index: number) => {
    setDeviceForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleFormImageCategoryChange = (index: number, newCategory: string) => {
     setDeviceForm(prev => {
        const updatedImages = [...prev.images];
        updatedImages[index].category = newCategory;
        return { ...prev, images: updatedImages };
     });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceForm.typeId || !deviceForm.name || !deviceForm.sn) return; 
    
    const imageUrl = deviceForm.images.length > 0 ? deviceForm.images[0].url : undefined;
    const formattedDate = deviceForm.firstStartTime ? fromInputDate(deviceForm.firstStartTime) : new Date().toLocaleString();

    addDevice({
        ...deviceForm,
        firstStartTime: formattedDate,
        imageUrl
    });
    
    setIsAddModalOpen(false);
  };

  const getRowStyle = (d: Device) => {
    if (d.opsStatus === OpsStatus.HOTEL_COMPLAINT) return 'bg-pink-100 border-pink-300 text-pink-900';
    if (d.opsStatus === OpsStatus.ABNORMAL) return 'bg-red-200 border-red-300 text-red-900';
    if (d.opsStatus === OpsStatus.REPAIRING) return 'bg-purple-200 border-purple-300 text-purple-900';
    if (d.opsStatus === OpsStatus.PENDING) return 'bg-orange-200 border-orange-300 text-orange-900';
    if (d.status === DeviceStatus.OFFLINE) return 'bg-slate-200 border-slate-300 text-slate-700';
    if (d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.IN_USE) return 'bg-green-200 border-green-300 text-green-900';
    return 'bg-yellow-100 border-yellow-200 text-yellow-900'; 
  };

  // --- Device Detail Card with Modular Tabs ---
  const DeviceDetailCard: React.FC<{ device: Device }> = ({ device }) => {
    const { updateDevice } = useApp();
    const [activeModule, setActiveModule] = useState<'info' | 'install' | 'maintenance'>('info');

    const handleFieldUpdate = (field: keyof Device, value: string) => {
        let finalValue = value;
        if (field === 'firstStartTime' || field === 'lastTestTime') {
            finalValue = fromInputDate(value);
        }
        updateDevice(device.id, { [field]: finalValue });
    };

    const typeOptions = deviceTypes.map(t => ({ label: t.name, value: t.id }));
    const storeOptions = stores
        .filter(s => !device.regionId || s.regionId === device.regionId)
        .map(s => ({ label: s.name, value: s.id }));

    // Pending Audit Record for This Device
    const pendingRecord = auditRecords.find(r => r.deviceId === device.id && r.auditStatus === AuditStatus.PENDING);

    // Helper to categorize events
    const getFilteredEvents = () => {
        const keywords: Record<string, string[]> = {
            'info': ['添加', '名称', 'SN', 'MAC', '图片', '类型'],
            'install': ['门店', '房间', '软件', '启动'],
            'maintenance': [
                '运维', '维修', '客诉', '审核', '异常', '申请', '通过', '拒绝', // After-sales
                '测试', 'CPU', '内存', '网络', '状态', '合格', '运行', '待机', '未联网' // Inspection
            ]
        };

        const targetKeywords = keywords[activeModule] || [];
        
        return device.events.filter(evt => {
            const msg = evt.message;
            // Default 'Info' if matches keywords OR if it's the default catch-all for unknown
            if (activeModule === 'info') {
                 // Info captures its keywords AND anything that doesn't match other categories? 
                 // For simplicity, just strict matching + "device added" usually goes here
                 if (msg.includes('设备首次添加')) return true;
                 if (msg.includes('设备详情已修改')) return true; // Generic detail change
                 return targetKeywords.some(k => msg.includes(k));
            }
            return targetKeywords.some(k => msg.includes(k));
        });
    };

    const filteredEvents = getFilteredEvents();

    return (
      <div className="bg-white border-t border-slate-100 animate-fadeIn shadow-inner flex flex-col">
        
        {/* Module Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50">
            <button 
                onClick={() => setActiveModule('info')}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors ${activeModule === 'info' ? 'text-blue-600 bg-white border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                <Info size={14} /> 信息
            </button>
            <button 
                onClick={() => setActiveModule('install')}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors ${activeModule === 'install' ? 'text-blue-600 bg-white border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                <MapPin size={14} /> 安装
            </button>
            <button 
                onClick={() => setActiveModule('maintenance')}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors ${activeModule === 'maintenance' ? 'text-blue-600 bg-white border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                <Wrench size={14} /> 售后&巡检
            </button>
        </div>

        <div className="p-3 grid grid-cols-12 gap-2">
            
            {/* LEFT COLUMN: MODULE SPECIFIC CONTENT (7/12) */}
            <div className="col-span-7 space-y-3">
                
                {/* Info Module */}
                {activeModule === 'info' && (
                    <div className="space-y-3 animate-fadeIn">
                        {/* Header: Name (Editable) */}
                        <div className="flex items-center gap-1 font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                            <EditableField 
                                value={device.name} 
                                type="text" 
                                onSave={(val) => handleFieldUpdate('name', val)} 
                            />
                        </div>

                        {/* Image Section */}
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm group bg-slate-50">
                            {device.imageUrl ? (
                                <img src={device.imageUrl} alt={device.name} className="w-full h-24 object-contain bg-slate-100" />
                            ) : (
                                <div className="w-full h-24 bg-slate-100 flex items-center justify-center text-slate-300">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                            <div 
                                onClick={() => setEditingImageDevice(device)}
                                className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white text-[10px] text-center py-1 cursor-pointer hover:bg-blue-600 transition-colors"
                            >
                                点击管理图片
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-1">
                            <div className="flex text-[10px] items-center">
                                <span className="text-slate-500 w-12 flex-shrink-0">SN码</span>
                                <div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1 py-0.5 bg-slate-50 min-w-0">
                                    <EditableField 
                                        value={device.sn}
                                        type="text"
                                        onSave={(val) => handleFieldUpdate('sn', val)}
                                        className="flex-1 min-w-0"
                                    />
                                </div>
                            </div>
                            <div className="flex text-[10px] items-center">
                                <span className="text-slate-500 w-12 flex-shrink-0">MAC</span>
                                <div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1 py-0.5 bg-slate-50 min-w-0">
                                    <EditableField 
                                        value={device.mac || ''}
                                        type="text"
                                        onSave={(val) => handleFieldUpdate('mac', val)}
                                        className="flex-1 min-w-0"
                                    />
                                </div>
                            </div>
                            <div className="flex text-[10px] items-center">
                                <span className="text-slate-500 w-12 flex-shrink-0">类型</span>
                                <div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1 py-0.5 bg-slate-50 min-w-0">
                                    <EditableField 
                                        value={device.typeId}
                                        displayValue={getTypeName(device.typeId)}
                                        type="select"
                                        options={typeOptions}
                                        onSave={(val) => handleFieldUpdate('typeId', val)}
                                        className="flex-1 min-w-0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Installation Module */}
                {activeModule === 'install' && (
                    <div className="space-y-3 animate-fadeIn">
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                            <h4 className="text-[10px] font-bold text-blue-800 mb-2 flex items-center gap-1">
                                <MapPin size={10} /> 位置与软件
                            </h4>
                            <div className="space-y-1.5">
                                <div className="flex text-[10px] items-center">
                                    <span className="text-slate-500 w-12 flex-shrink-0">门店</span>
                                    <div className="flex-1 flex justify-between items-center border border-blue-200 rounded px-1 py-0.5 bg-white min-w-0">
                                        <EditableField 
                                            value={device.storeId}
                                            displayValue={getStoreName(device.storeId)}
                                            type="select"
                                            options={storeOptions}
                                            onSave={(val) => handleFieldUpdate('storeId', val)}
                                            className="flex-1 min-w-0"
                                        />
                                    </div>
                                </div>
                                <div className="flex text-[10px] items-center">
                                    <span className="text-slate-500 w-12 flex-shrink-0">房间</span>
                                    <div className="flex-1 flex justify-between items-center border border-blue-200 rounded px-1 py-0.5 bg-white min-w-0">
                                        <EditableField 
                                            value={device.roomNumber || ''}
                                            type="text"
                                            onSave={(val) => handleFieldUpdate('roomNumber', val)}
                                            className="flex-1 min-w-0"
                                        />
                                    </div>
                                </div>
                                <div className="flex text-[10px] items-center">
                                    <span className="text-slate-500 w-12 flex-shrink-0">软件</span>
                                    <div className="flex-1 flex justify-between items-center border border-blue-200 rounded px-1 py-0.5 bg-white min-w-0">
                                        <EditableField 
                                            value={device.softwareName || ''}
                                            type="text"
                                            onSave={(val) => handleFieldUpdate('softwareName', val)}
                                            className="flex-1 min-w-0"
                                        />
                                    </div>
                                </div>
                                <div className="flex text-[10px] items-center">
                                    <span className="text-slate-500 w-12 flex-shrink-0">启动</span>
                                    <div className="flex-1 flex justify-between items-center border border-blue-200 rounded px-1 py-0.5 bg-white min-w-0">
                                        <EditableField 
                                            value={device.firstStartTime ? toInputDate(device.firstStartTime) : ''}
                                            displayValue={device.firstStartTime ? `${device.firstStartTime}` : '-'}
                                            type="datetime-local"
                                            onSave={(val) => handleFieldUpdate('firstStartTime', val)}
                                            className="flex-1 min-w-0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Maintenance Module (Combined After-sales & Inspection) */}
                {activeModule === 'maintenance' && (
                    <div className="space-y-3 animate-fadeIn">
                        
                        {/* After-sales Content Block */}
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-2">
                            <div>
                                <p className="text-[10px] text-slate-500 mb-1">当前运维状态</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-sm font-bold px-2 py-1 rounded ${
                                        device.opsStatus === OpsStatus.HOTEL_COMPLAINT ? 'bg-pink-100 text-pink-700' :
                                        device.opsStatus === OpsStatus.ABNORMAL ? 'bg-red-100 text-red-700' :
                                        device.opsStatus === OpsStatus.REPAIRING ? 'bg-purple-100 text-purple-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                        {device.opsStatus}
                                    </span>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 pt-2">
                                <p className="text-[10px] text-slate-500 mb-1">该状态持续时长</p>
                                <p className="text-lg font-bold text-slate-700">{calculateDuration(device.lastTestTime)}</p>
                            </div>
                        </div>

                        {/* Pending Application Status Card */}
                        {pendingRecord && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 text-xs animate-fadeIn shadow-sm">
                                <div className="flex justify-between items-center mb-2 border-b border-orange-100 pb-1">
                                    <span className="font-bold text-orange-700 flex items-center gap-1">
                                        <ClipboardCheck size={12} /> 正在审核中
                                    </span>
                                    <span className="text-[10px] text-orange-400">{pendingRecord.requestTime.split(' ')[0]}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-orange-500">申请状态</span>
                                        <span className="font-bold text-slate-700">{pendingRecord.targetOpsStatus}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] text-orange-500">申请人</span>
                                        <span className="font-bold text-slate-700">{pendingRecord.requestUser}</span>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-2 rounded border border-orange-100 mb-2">
                                    <span className="text-[10px] text-orange-400 block mb-0.5">备注</span>
                                    <p className="text-slate-700 font-medium break-all">{pendingRecord.changeReason}</p>
                                </div>

                                {pendingRecord.images && pendingRecord.images.length > 0 && (
                                    <div>
                                         <span className="text-[10px] text-orange-400 block mb-1">凭证</span>
                                         <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                            {pendingRecord.images.map((img, idx) => (
                                                <div key={idx} className="w-8 h-8 rounded border border-orange-100 overflow-hidden flex-shrink-0">
                                                    <img src={img} alt="evidence" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                         </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Inspection Content Block */}
                        <div className="bg-white border border-slate-100 rounded-lg p-2 shadow-sm space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-50 pb-1 flex items-center gap-1">
                                <Activity size={10} /> 设备巡检数据
                            </h4>
                            
                            {/* Stats Row */}
                            <div className="bg-slate-800 text-white rounded-lg p-3 shadow-md grid grid-cols-3 gap-2 text-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-bold leading-none">{device.cpuUsage}%</span>
                                    <span className="text-[8px] text-slate-400 mt-1">CPU</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-slate-600">
                                    <span className="text-sm font-bold leading-none">{device.memoryUsage}%</span>
                                    <span className="text-[8px] text-slate-400 mt-1">内存</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-slate-600">
                                    <Wifi size={14} className={device.signalStrength > 50 ? 'text-green-400' : 'text-yellow-400'} />
                                    <span className="text-[8px] text-slate-400 mt-1">网络</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-lg p-2">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-500">最近测试</span>
                                    <span className="text-[10px] font-bold text-slate-700">{device.lastTestTime}</span>
                                </div>
                                <span className="bg-green-100 text-green-600 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                    <ClipboardCheck size={10} /> 合格
                                </span>
                            </div>

                            <div className="text-center pt-1">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                    device.status === DeviceStatus.ONLINE ? 'bg-green-100 text-green-700' : 
                                    device.status === DeviceStatus.OFFLINE ? 'bg-slate-200 text-slate-600' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {STATUS_MAP[device.status]}
                                </span>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: TIMELINE (5/12) */}
            <div className="col-span-5 border-l border-slate-100 pl-2">
                <h5 className="text-[9px] font-bold text-slate-400 mb-2 uppercase flex items-center gap-1 sticky top-0 bg-white z-10 py-1">
                     <History size={10} /> 历史记录
                </h5>
                <div className="space-y-3 relative pl-1">
                     <div className="absolute left-[5px] top-1 bottom-0 w-0.5 bg-slate-100"></div>
                     {filteredEvents.length > 0 ? (
                         filteredEvents.slice(0, 10).map(evt => (
                             <div key={evt.id} className="relative pl-3 animate-fadeIn">
                                <div className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full border-2 border-white box-content z-10 ${evt.type === 'error' ? 'bg-red-500' : evt.type === 'warning' ? 'bg-orange-400' : 'bg-blue-300'}`}></div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-400 leading-tight mb-0.5 scale-90 origin-left">{evt.timestamp.split(' ')[0]}</span>
                                    <span className="text-[9px] text-slate-700 leading-tight font-medium line-clamp-2" title={evt.message}>{evt.message}</span>
                                    <span className="text-[8px] text-slate-400 mt-0.5 scale-90 origin-left">@{evt.operator || 'Sys'}</span>
                                </div>
                             </div>
                         ))
                     ) : (
                         <div className="text-[9px] text-slate-300 pl-2 py-2 italic">
                             无记录
                         </div>
                     )}
                </div>
            </div>
            
        </div>

      </div>
    );
  };

  const availableStores = selectedRegion 
    ? stores.filter(s => s.regionId === selectedRegion)
    : stores;

  return (
    <div className="min-h-full bg-slate-50 relative pb-32">
      
      {/* 1. Header & Filters Background Container */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 p-4 pb-16 rounded-b-[2rem] shadow-xl relative z-0">
         
         {/* Top Controls */}
         <div className="flex justify-between items-center mb-4">
             <button 
                onClick={openAddModal}
                className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors flex items-center gap-1"
             >
                 <Plus size={24} />
                 <span className="text-xs font-bold">新增设备</span>
             </button>
             <h2 className="text-lg font-bold text-white tracking-wide">设备管理</h2>
             
             {/* Audit Entry Button */}
             <button 
                onClick={() => setIsAuditModalOpen(true)}
                className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors relative"
             >
                 <ClipboardCheck size={24} />
                 {pendingAuditCount > 0 && (
                     <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-blue-900 animate-pulse"></span>
                 )}
             </button>
         </div>

         {/* Filter Row */}
         <div className="grid grid-cols-3 gap-2 mb-3">
            <select 
                value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}
                className="bg-white text-slate-800 text-xs rounded py-1.5 px-2 focus:outline-none shadow-sm"
            >
                <option value="">全部大区</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select 
                value={selectedStore} onChange={e => setSelectedStore(e.target.value)}
                className="bg-white text-slate-800 text-xs rounded py-1.5 px-2 focus:outline-none shadow-sm"
            >
                <option value="">全部门店</option>
                {availableStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select 
                value={selectedType} onChange={e => setSelectedType(e.target.value)}
                className="bg-white text-slate-800 text-xs rounded py-1.5 px-2 focus:outline-none shadow-sm"
            >
                <option value="">所有类型</option>
                {deviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
         </div>

         {/* Search Row */}
         <div className="flex gap-2">
             <div className="flex-1 bg-white rounded-lg flex items-center px-3 py-1.5 shadow-sm">
                 <Search size={16} className="text-slate-400 mr-2" />
                 <input 
                    type="text" 
                    placeholder="请输入设备SN号、MAC地址或者名称"
                    className="flex-1 text-xs outline-none text-slate-700"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                 />
             </div>
             <button className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 rounded-lg shadow-sm">
                 搜索
             </button>
         </div>

         {/* Stats Dashboard */}
         <div className="mt-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-[10px] font-medium text-white shadow-lg grid grid-cols-2 gap-y-2 gap-x-4">
             <div className="flex items-center gap-1">
                 <span className="w-2 h-2 bg-green-400 rounded-sm"></span>
                 <span className="text-green-300">合格&联网:</span>
                 <span className="text-green-300 font-bold text-xs">{stats.online}台</span>
             </div>
             <div className="flex items-center gap-1">
                 <span className="w-2 h-2 bg-slate-400 rounded-sm"></span>
                 <span className="text-slate-300">合格&断网:</span>
                 <span className="text-slate-300 font-bold text-xs">{stats.offline}台</span>
             </div>
             <div className="flex items-center gap-1">
                 <span className="w-2 h-2 bg-yellow-400 rounded-sm"></span>
                 <span className="text-yellow-300">待检:</span>
                 <span className="text-yellow-300 font-bold text-xs">{stats.standby}台</span>
             </div>
              <div className="flex items-center gap-1">
                 <span className="w-2 h-2 bg-orange-400 rounded-sm"></span>
                 <span className="text-orange-300">待审:</span>
                 <span className="text-orange-300 font-bold text-xs">{stats.pending}台</span>
             </div>
              <div className="flex items-center gap-1">
                 <span className="w-2 h-2 bg-red-400 rounded-sm"></span>
                 <span className="text-red-300">异常:</span>
                 <span className="text-red-300 font-bold text-xs">{stats.abnormal}台</span>
             </div>
              <div className="flex items-center gap-1">
                 <span className="w-2 h-2 bg-purple-400 rounded-sm"></span>
                 <span className="text-purple-300">维修:</span>
                 <span className="text-purple-300 font-bold text-xs">{stats.repairing}台</span>
             </div>
             <div className="flex items-center gap-1">
                 <span className="w-2 h-2 bg-pink-500 rounded-sm"></span>
                 <span className="text-pink-300">客诉:</span>
                 <span className="text-pink-300 font-bold text-xs">{stats.complaint}台</span>
             </div>
         </div>
      </div>

      {/* 2. Device List Header */}
      <div className="px-3 -mt-4 relative z-10">
          <div className="bg-blue-600/90 text-white text-[10px] font-bold p-2 rounded-t-lg flex items-center shadow-md backdrop-blur-sm">
              <div className="w-8 flex justify-center"></div>
              <div className="flex-1 px-1">设备名称</div>
              <div className="w-24 px-1">门店</div>
              <div className="w-16 text-center">设备状态</div>
              <div className="w-20 text-right pr-2">运维状态</div>
              <div className="w-6"></div>
          </div>

          {/* 3. Device List Rows */}
          <div className="space-y-1">
             {filteredDevices.map(device => {
                 const isSelected = selectedDeviceIds.has(device.id);
                 const styleClass = getRowStyle(device);
                 const isExpanded = expandedDeviceId === device.id;
                 const isPending = hasPendingAudit(device.id);

                 return (
                     <div key={device.id} className="relative rounded-md overflow-hidden shadow-sm">
                         <div 
                             className={`flex items-center p-2 text-xs cursor-pointer transition-colors border-l-4 ${styleClass}`}
                             onClick={() => toggleExpand(device.id)}
                         >
                             <div className="w-8 flex justify-center" onClick={(e) => { e.stopPropagation(); toggleSelection(device.id); }}>
                                 {isSelected ? <CheckSquare size={16} className="opacity-80" /> : <Square size={16} className="opacity-40" />}
                             </div>
                             
                             <div className="flex-1 px-1 font-bold truncate">
                                 {device.name}
                             </div>
                             
                             <div className="w-24 px-1 truncate opacity-80 text-[10px]">
                                 {getStoreName(device.storeId)}
                             </div>

                             <div className="w-16 text-center font-medium">
                                 {device.status === DeviceStatus.ONLINE ? '运行中' : 
                                  device.status === DeviceStatus.OFFLINE ? '未联网' : 
                                  device.status === DeviceStatus.IN_USE ? '使用中' : '待机中'}
                             </div>

                             <div className="w-20 text-right pr-2 flex flex-col items-end">
                                 <div className="flex items-center gap-1">
                                     <span className="font-bold">{device.opsStatus}</span>
                                 </div>
                                 <span className="opacity-60 ml-1 text-[10px]">({calculateDuration(device.lastTestTime)})</span>
                             </div>

                             <div className="w-6 flex justify-center opacity-50">
                                 {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                             </div>
                         </div>
                         
                         {isPending && (
                            <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-bl-lg font-bold border-b border-l border-orange-200 z-10 whitespace-nowrap">
                                待审核
                            </div>
                         )}

                         {isExpanded && <DeviceDetailCard device={device} />}
                     </div>
                 );
             })}
          </div>
          
          {/* Select All Footer */}
          <div className="mt-2 flex items-center gap-2 px-2 pb-4">
              <div className="cursor-pointer text-slate-500 flex items-center gap-1" onClick={toggleSelectAll}>
                {selectedDeviceIds.size > 0 && selectedDeviceIds.size === filteredDevices.length 
                    ? <CheckSquare size={16} className="text-blue-500" /> 
                    : <Square size={16} />
                }
                <span className="text-xs font-bold">全部选择</span>
              </div>
          </div>
      </div>

        {/* 4. Bottom Control Bar (Sticky) */}
        <div className="sticky bottom-[85px] left-0 right-0 flex justify-center z-30 pointer-events-none w-full">
            <button
                onClick={() => setIsControlMenuOpen(true)}
                disabled={selectedDeviceIds.size === 0}
                className={`bg-slate-800 text-white shadow-xl shadow-slate-900/20 rounded-full px-6 py-3 flex items-center gap-2 font-bold text-sm pointer-events-auto transition-all active:scale-95 ${selectedDeviceIds.size === 0 ? 'opacity-50 cursor-not-allowed scale-90' : 'hover:bg-slate-700 hover:-translate-y-1'}`}
            >
                <Settings2 size={18} />
                <span>设备管控 {selectedDeviceIds.size > 0 && `(${selectedDeviceIds.size})`}</span>
            </button>
        </div>

        {/* 5. Device Control Menu Popup (Fixed) */}
        {isControlMenuOpen && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsControlMenuOpen(false)}></div>
                <div className="bg-white rounded-t-2xl p-6 relative z-10 animate-slideUp">
                    <div className="flex justify-between items-center mb-6">
                         <h3 className="font-bold text-slate-800 text-lg">设备批量管控</h3>
                         <button onClick={() => setIsControlMenuOpen(false)} className="bg-slate-100 p-1 rounded-full"><X size={20} className="text-slate-500" /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                         <button onClick={handleBatchRun} className="flex flex-col items-center gap-2 group">
                             <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                 <Play size={24} fill="currentColor" />
                             </div>
                             <span className="text-xs font-bold text-slate-700">运行设备</span>
                         </button>
                         <button onClick={handleBatchSleep} className="flex flex-col items-center gap-2 group">
                             <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                                 <Moon size={24} fill="currentColor" />
                             </div>
                             <span className="text-xs font-bold text-slate-700">休眠设备</span>
                         </button>
                         <button onClick={handleBatchRestart} className="flex flex-col items-center gap-2 group">
                             <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                 <RotateCcw size={24} />
                             </div>
                             <span className="text-xs font-bold text-slate-700">重启设备</span>
                         </button>
                         <button onClick={openOpsStatusModal} className="flex flex-col items-center gap-2 group">
                             <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                 <ClipboardCheck size={24} />
                             </div>
                             <span className="text-xs font-bold text-slate-700">运维状态</span>
                         </button>
                    </div>
                    <div className="h-6"></div>
                </div>
            </div>
        )}

        {/* 6. Ops Status Change Modal (Fixed) */}
        {isOpsStatusModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-scaleIn">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">设备运维状态修改申请</h3>
                    
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">新的状态</label>
                            <select 
                                value={opsChangeStatus} 
                                onChange={(e) => setOpsChangeStatus(e.target.value as OpsStatus)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100"
                            >
                                {Object.values(OpsStatus)
                                    .filter(status => status !== OpsStatus.PENDING) // Remove Pending option
                                    .map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Conditional Dropdown for Hotel Complaint */}
                        {opsChangeStatus === OpsStatus.HOTEL_COMPLAINT && (
                            <div className="animate-fadeIn">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">客诉类型 (必选)</label>
                                <select 
                                    value={complaintType} 
                                    onChange={(e) => setComplaintType(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">请选择类型</option>
                                    <option value="设备质量故障">设备质量故障</option>
                                    <option value="其他客诉情况">其他客诉情况</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">变更说明 (必填)</label>
                            <textarea 
                                value={opsChangeReason}
                                onChange={(e) => setOpsChangeReason(e.target.value)}
                                placeholder="请输入状态变更的原因..."
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100 min-h-[80px]"
                            ></textarea>
                        </div>

                        {/* Image Upload for Change Reason */}
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">上传凭证 (选填)</label>
                             <div className="flex gap-2 flex-wrap">
                                 {opsChangeImages.map((url, idx) => (
                                     <div key={idx} className="w-16 h-16 relative rounded border border-slate-200 overflow-hidden group">
                                         <img src={url} alt="upload" className="w-full h-full object-cover" />
                                         <button onClick={() => removeOpsImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl">
                                             <X size={10} />
                                         </button>
                                     </div>
                                 ))}
                                 <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer relative bg-slate-50">
                                     <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleOpsImageUpload} />
                                     <Plus size={20} />
                                 </div>
                             </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button 
                            onClick={() => setIsOpsStatusModalOpen(false)}
                            className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg text-sm hover:bg-slate-200"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleBatchOpsStatusSubmit}
                            className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 shadow-lg shadow-blue-200"
                        >
                            提交审核
                        </button>
                    </div>
                </div>
            </div>
        )}

       {/* Add Device Modal Only (Fixed) */}
       {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fadeIn">
            {/* Added md:pt-8 to accommodate notch */}
            <div className="p-4 md:pt-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-lg font-bold text-slate-800">添加新设备</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                  <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    
                    {/* Image Upload Section */}
                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase">设备缩略图</label>
                                <span className={`text-[10px] ${isTotalLimitReached ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                    {deviceForm.images.length}/5 (总限)
                                </span>
                            </div>
                            
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                                {deviceForm.images.map((img, index) => (
                                    <div key={index} className="flex-shrink-0 relative group w-24">
                                        <div className="h-24 w-24 rounded-lg overflow-hidden border border-slate-200">
                                            <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <button type="button" onClick={() => handleRemoveFormImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md">
                                            <X size={12} />
                                        </button>
                                        <select 
                                            value={img.category} 
                                            onChange={(e) => handleFormImageCategoryChange(index, e.target.value)}
                                            className="w-full text-[10px] mt-1 border border-slate-200 rounded px-1 py-0.5 bg-slate-50"
                                        >
                                            {Object.entries(CATEGORY_LIMITS).map(([cat, limit]) => {
                                                const count = imageCounts[cat] || 0;
                                                const isFull = count >= limit;
                                                const isCurrent = img.category === cat;
                                                const isDisabled = isFull && !isCurrent;
                                                return (
                                                    <option key={cat} value={cat} disabled={isDisabled}>
                                                        {cat} ({count}/{limit})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                ))}
                                
                                <div 
                                    className={`flex-shrink-0 h-24 w-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors relative 
                                        ${isTotalLimitReached ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer'}`}
                                >
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleAddFormImage} 
                                        disabled={isTotalLimitReached}
                                        className={`absolute inset-0 z-10 w-full h-full ${isTotalLimitReached ? 'cursor-not-allowed' : 'cursor-pointer'} opacity-0`} 
                                    />
                                    <Plus className={isTotalLimitReached ? 'text-slate-300' : 'text-slate-400 mb-1'} size={24} />
                                    <span className={`text-[10px] text-center px-1 ${isTotalLimitReached ? 'text-slate-300' : 'text-slate-500'}`}>
                                        {isTotalLimitReached ? '已达上限' : '点击上传'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备名称 *</label>
                            <input required type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={deviceForm.name} onChange={e => setDeviceForm({...deviceForm, name: e.target.value})} placeholder="例如: VR-009" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SN号 *</label>
                            <input required type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={deviceForm.sn} onChange={e => setDeviceForm({...deviceForm, sn: e.target.value})} placeholder="例如: SN-2024-XXXX" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">MAC地址</label>
                            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={deviceForm.mac} onChange={e => setDeviceForm({...deviceForm, mac: e.target.value})} placeholder="例如: 00:1A:2B:..." />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属大区 (选填)</label>
                            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                                value={deviceForm.regionId} onChange={e => setDeviceForm({...deviceForm, regionId: e.target.value, storeId: ''})}
                            >
                                <option value="">请选择大区</option>
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属门店 (选填)</label>
                            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                                value={deviceForm.storeId} onChange={e => setDeviceForm({...deviceForm, storeId: e.target.value})}
                                disabled={!deviceForm.regionId}
                            >
                                <option value="">请选择门店</option>
                                {stores.filter(s => s.regionId === deviceForm.regionId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备类型 *</label>
                            <select required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                                value={deviceForm.typeId} onChange={e => setDeviceForm({...deviceForm, typeId: e.target.value})}
                            >
                                <option value="">请选择类型</option>
                                {deviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">房间号码</label>
                            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={deviceForm.roomNumber} onChange={e => setDeviceForm({...deviceForm, roomNumber: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">体验软件名称</label>
                            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={deviceForm.softwareName} onChange={e => setDeviceForm({...deviceForm, softwareName: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">首次启动时间</label>
                            <input type="datetime-local" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={deviceForm.firstStartTime} onChange={e => setDeviceForm({...deviceForm, firstStartTime: e.target.value})} />
                        </div>
                    </div>

                    <div className="h-10"></div>
                </form>
            </div>
            
            <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0">
                 <button 
                    onClick={handleAddSubmit}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 active:scale-98 transition-transform"
                 >
                    确认添加设备
                 </button>
            </div>
        </div>
      )}

      {/* Image Manager Modal */}
      {editingImageDevice && (
        <ImageManagerModal 
            device={editingImageDevice} 
            onClose={() => setEditingImageDevice(null)} 
        />
      )}

      {/* Audit Management Modal */}
      {isAuditModalOpen && (
          <AuditManagementModal onClose={() => setIsAuditModalOpen(false)} />
      )}

    </div>
  );
};
