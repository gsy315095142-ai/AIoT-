
import React, { useState, useMemo, ChangeEvent, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Device, OpsStatus, DeviceStatus, DeviceImage } from '../types';
import { ChevronDown, ChevronUp, Plus, Wifi, Image as ImageIcon, Search, CheckSquare, Square, X, FilePenLine, ClipboardList, Battery, Volume2, Check, X as XIcon, Upload } from 'lucide-react';

const CATEGORY_LIMITS: Record<string, number> = {
  '设备外观': 2,
  '安装现场': 2,
  '其他': 1
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fadeIn">
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

// --- Main Page Component ---

export const DeviceManagement: React.FC = () => {
  const { devices, regions, stores, deviceTypes, updateDevice, addDevice } = useApp();
  
  // Filter States
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  
  // Add Device Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Image Manager Modal State
  const [editingImageDevice, setEditingImageDevice] = useState<Device | null>(null);

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
      pending: filteredDevices.filter(d => d.opsStatus === OpsStatus.PENDING).length,
      abnormal: filteredDevices.filter(d => d.opsStatus === OpsStatus.ABNORMAL).length,
      repairing: filteredDevices.filter(d => d.opsStatus === OpsStatus.REPAIRING).length,
    };
  }, [filteredDevices]);

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
    if (d.opsStatus === OpsStatus.ABNORMAL) return 'bg-red-200 border-red-300 text-red-900';
    if (d.opsStatus === OpsStatus.REPAIRING) return 'bg-purple-200 border-purple-300 text-purple-900';
    if (d.opsStatus === OpsStatus.PENDING) return 'bg-orange-200 border-orange-300 text-orange-900';
    if (d.status === DeviceStatus.OFFLINE) return 'bg-slate-200 border-slate-300 text-slate-700';
    if (d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.IN_USE) return 'bg-green-200 border-green-300 text-green-900';
    return 'bg-yellow-100 border-yellow-200 text-yellow-900'; 
  };

  // --- Device Detail Card with Inline Editing ---
  const DeviceDetailCard: React.FC<{ device: Device }> = ({ device }) => {
    const { updateDevice } = useApp();

    const handleFieldUpdate = (field: keyof Device, value: string) => {
        let finalValue = value;
        if (field === 'firstStartTime' || field === 'lastTestTime') {
            finalValue = fromInputDate(value);
        }
        updateDevice(device.id, { [field]: finalValue });
    };

    const typeOptions = deviceTypes.map(t => ({ label: t.name, value: t.id }));
    const storeOptions = stores
        .filter(s => !device.regionId || s.regionId === device.regionId) // Filter stores by current region if region is set
        .map(s => ({ label: s.name, value: s.id }));

    return (
      <div className="bg-white p-3 border-t border-slate-100 animate-fadeIn shadow-inner grid grid-cols-2 gap-3">
        {/* Left Column: Info & Image */}
        <div className="flex flex-col space-y-2">
            
            {/* Header: Name (Editable) */}
            <div className="flex items-center gap-1 font-bold text-sm text-slate-900 min-h-[24px]">
                <EditableField 
                    value={device.name} 
                    type="text" 
                    onSave={(val) => handleFieldUpdate('name', val)} 
                />
            </div>

            {/* Info Table Style */}
            <div className="space-y-1">
                <div className="flex text-[10px]">
                    <span className="text-slate-500 w-16 flex-shrink-0">设备SN码</span>
                    <span className="text-slate-700 font-medium truncate">{device.sn}</span>
                </div>
                <div className="flex text-[10px]">
                    <span className="text-slate-500 w-16 flex-shrink-0">MAC地址</span>
                    <span className="text-slate-700 font-medium truncate">{device.mac || '-'}</span>
                </div>
                <div className="flex text-[10px] items-center">
                    <span className="text-slate-500 w-16 flex-shrink-0">设备类型</span>
                    <div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 min-w-0">
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
                <div className="flex text-[10px] items-center">
                    <span className="text-slate-500 w-16 flex-shrink-0">所属门店</span>
                    <div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 min-w-0">
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
                    <span className="text-slate-500 w-16 flex-shrink-0">房间号码</span>
                    <div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 min-w-0">
                        <EditableField 
                             value={device.roomNumber || ''}
                             type="text"
                             onSave={(val) => handleFieldUpdate('roomNumber', val)}
                             className="flex-1 min-w-0"
                        />
                    </div>
                </div>
                 <div className="flex text-[10px] items-center">
                    <span className="text-slate-500 w-16 flex-shrink-0">体验软件</span>
                    <div className="flex-1 flex justify-between items-center border-b border-slate-100 py-0.5 min-w-0">
                        <EditableField 
                             value={device.softwareName || ''}
                             type="text"
                             onSave={(val) => handleFieldUpdate('softwareName', val)}
                             className="flex-1 min-w-0"
                        />
                    </div>
                </div>
                <div className="flex text-[10px] items-center">
                    <span className="text-slate-500 w-16 flex-shrink-0">首次启动</span>
                    <div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 min-w-0">
                        <EditableField 
                             value={device.firstStartTime ? toInputDate(device.firstStartTime) : ''}
                             displayValue={device.firstStartTime ? `${device.firstStartTime.split(' ')[0]}` : '-'}
                             type="datetime-local"
                             onSave={(val) => handleFieldUpdate('firstStartTime', val)}
                             className="flex-1 min-w-0"
                        />
                    </div>
                </div>
                <div className="flex text-[10px] items-center">
                    <span className="text-slate-500 w-16 flex-shrink-0">最近测试</span>
                    <div className="flex-1 flex items-center gap-1 min-w-0">
                        <span className="text-slate-700 truncate">{device.lastTestTime.split(' ')[0] || '-'} {device.lastTestTime.split(' ')[1]?.slice(0,5) || ''}</span>
                        <span className="bg-green-100 text-green-600 px-1 rounded text-[9px] font-bold flex-shrink-0">合格</span>
                        <ClipboardList size={12} className="text-blue-500 flex-shrink-0" />
                    </div>
                </div>
            </div>

            {/* Image Section (Triggers specific image modal) */}
            <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm mt-1 group">
                 {device.imageUrl ? (
                    <img src={device.imageUrl} alt={device.name} className="w-full h-24 object-cover" />
                ) : (
                    <div className="w-full h-24 bg-slate-100 flex items-center justify-center text-slate-300">
                        <ImageIcon size={24} />
                    </div>
                )}
                <div 
                    onClick={() => setEditingImageDevice(device)}
                    className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white text-[10px] text-center py-1 cursor-pointer hover:bg-blue-600 transition-colors"
                >
                    点击进行查看/修改
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex justify-between items-center bg-white border border-slate-200 rounded px-2 py-1">
                 <div className="flex flex-col items-center">
                     <span className="text-blue-600 text-[10px] font-bold leading-none">{device.cpuUsage}%</span>
                     <span className="text-[8px] text-slate-400 leading-none scale-75">cpu</span>
                 </div>
                 <div className="w-px h-3 bg-slate-200"></div>
                 <div className="flex flex-col items-center">
                     <span className="text-blue-600 text-[10px] font-bold leading-none">{device.memoryUsage}%</span>
                     <span className="text-[8px] text-slate-400 leading-none scale-75">内存</span>
                 </div>
                 <div className="w-px h-3 bg-slate-200"></div>
                 <Wifi size={12} className="text-slate-400" />
                 <div className="w-px h-3 bg-slate-200"></div>
                 <Volume2 size={12} className="text-slate-400" />
                 <div className="w-px h-3 bg-slate-200"></div>
                 <Battery size={12} className="text-blue-400" />
            </div>

             {/* Status Badge */}
             <div className="text-center">
                 <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-[10px] inline-block font-medium">
                    设备运行中
                 </span>
             </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="relative pl-1">
            <div className="absolute left-[5px] top-1 bottom-0 w-0.5 bg-slate-200"></div>
            
            <div className="space-y-4">
                 {device.events.slice(0, 5).map(evt => (
                     <div key={evt.id} className="relative pl-4">
                        <div className="absolute left-0 top-1.5 w-2.5 h-2.5 bg-slate-300 rounded-full border-2 border-white box-content"></div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 leading-tight mb-0.5">{evt.timestamp}</span>
                            <span className="text-[10px] font-bold text-slate-700 leading-tight">事件</span>
                            <span className="text-[10px] text-slate-600 leading-tight">{evt.message}</span>
                            <span className="text-[9px] text-slate-400 text-right mt-0.5">操作人: {evt.operator || 'System'}</span>
                        </div>
                     </div>
                 ))}
                 {device.events.length === 0 && (
                     <div className="text-[10px] text-slate-400 pl-4 py-4 italic">
                         暂无事件记录
                     </div>
                 )}
            </div>
        </div>

      </div>
    );
  };

  const availableStores = selectedRegion 
    ? stores.filter(s => s.regionId === selectedRegion)
    : stores;

  return (
    <div className="min-h-full bg-slate-50 relative">
      
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
             <div className="w-8"></div>
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
         </div>
      </div>

      {/* 2. Device List Header */}
      <div className="px-3 -mt-4 relative z-10 pb-20">
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

                 return (
                     <div key={device.id} className="rounded-md overflow-hidden shadow-sm">
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

                             <div className="w-20 text-right pr-2">
                                 <span className="font-bold">{device.opsStatus}</span>
                                 <span className="opacity-60 ml-1 text-[10px]">({calculateDuration(device.lastTestTime)})</span>
                             </div>

                             <div className="w-6 flex justify-center opacity-50">
                                 {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                             </div>
                         </div>
                         
                         {isExpanded && <DeviceDetailCard device={device} />}
                     </div>
                 );
             })}
          </div>
          
          {/* Select All Footer */}
          <div className="mt-2 flex items-center gap-2 px-2">
              <div className="cursor-pointer text-slate-500 flex items-center gap-1" onClick={toggleSelectAll}>
                {selectedDeviceIds.size > 0 && selectedDeviceIds.size === filteredDevices.length 
                    ? <CheckSquare size={16} className="text-blue-500" /> 
                    : <Square size={16} />
                }
                <span className="text-xs font-bold">全部选择</span>
              </div>
          </div>
      </div>

       {/* Add Device Modal Only */}
       {isAddModalOpen && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-fadeIn">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
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

    </div>
  );
};
