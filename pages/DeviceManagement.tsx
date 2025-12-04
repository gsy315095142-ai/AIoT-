import React, { useState, useMemo, ChangeEvent } from 'react';
import { useApp } from '../context/AppContext';
import { Device, OpsStatus, DeviceStatus, DeviceImage } from '../types';
import { ChevronDown, ChevronUp, Plus, Wifi, Cpu, HardDrive, Image as ImageIcon, Search, CheckSquare, Square, X } from 'lucide-react';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form State
  interface NewDeviceFormState {
    name: string;
    sn: string;
    mac: string;
    regionId: string;
    storeId: string;
    typeId: string;
    roomNumber: string;
    softwareName: string;
    images: DeviceImage[];
  }

  const [newDeviceForm, setNewDeviceForm] = useState<NewDeviceFormState>({
    name: '', sn: '', mac: '', regionId: '', storeId: '', typeId: '', roomNumber: '', softwareName: '', images: []
  });

  // Helpers
  const getStoreName = (id: string) => stores.find(s => s.id === id)?.name || '-';

  const calculateDuration = (dateStr: string) => {
    const start = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d` : '1d';
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
  const handleAddImage = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      const newImage: DeviceImage = { url, category: '设备外观' }; // Default category
      setNewDeviceForm(prev => ({
        ...prev,
        images: [newImage, ...prev.images] // Add to top
      }));
      // Reset input value to allow re-uploading same file if needed (though tricky with objectURL)
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setNewDeviceForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleImageCategoryChange = (index: number, newCategory: string) => {
     setNewDeviceForm(prev => {
        const updatedImages = [...prev.images];
        updatedImages[index].category = newCategory;
        return { ...prev, images: updatedImages };
     });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceForm.typeId || !newDeviceForm.name || !newDeviceForm.sn) return; // Basic validation
    
    addDevice({
        ...newDeviceForm,
        // Use the first image as the main thumbnail, if any
        imageUrl: newDeviceForm.images.length > 0 ? newDeviceForm.images[0].url : undefined
    });
    
    setIsAddModalOpen(false);
    setNewDeviceForm({
        name: '', sn: '', mac: '', regionId: '', storeId: '', typeId: '', roomNumber: '', softwareName: '', images: []
    });
  };

  const getRowStyle = (d: Device) => {
    if (d.opsStatus === OpsStatus.ABNORMAL) return 'bg-red-200 border-red-300 text-red-900';
    if (d.opsStatus === OpsStatus.REPAIRING) return 'bg-purple-200 border-purple-300 text-purple-900';
    if (d.opsStatus === OpsStatus.PENDING) return 'bg-orange-200 border-orange-300 text-orange-900';
    if (d.status === DeviceStatus.OFFLINE) return 'bg-slate-200 border-slate-300 text-slate-700';
    if (d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.IN_USE) return 'bg-green-200 border-green-300 text-green-900';
    return 'bg-yellow-100 border-yellow-200 text-yellow-900'; // Default/Standby
  };

  const DeviceDetailCard: React.FC<{ device: Device }> = ({ device }) => {
     const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: device.name,
        sn: device.sn,
        mac: device.mac || '',
        roomNumber: device.roomNumber,
        softwareName: device.softwareName
    });

    const saveEdit = () => {
        updateDevice(device.id, editForm);
        setIsEditing(false);
    };

    return (
      <div className="bg-white p-4 border-t border-slate-100 text-sm animate-fadeIn shadow-inner">
        {/* Detail Content */}
        <div className="flex gap-4">
             {/* Image */}
            <div className="w-24 h-24 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 relative group">
                {device.imageUrl ? (
                    <img src={device.imageUrl} alt={device.name} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="text-slate-300" size={24} />
                )}
                {/* Visual indicator if there are multiple images */}
                {device.images && device.images.length > 1 && (
                    <div className="absolute bottom-0 right-0 bg-black/50 text-white text-[10px] px-1 rounded-tl-md">
                        +{device.images.length - 1}
                    </div>
                )}
            </div>
            
            <div className="flex-1 space-y-1">
                 {isEditing ? (
                    <div className="grid grid-cols-2 gap-2">
                        <input className="border rounded px-2 py-1 text-xs" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="名称" />
                        <input className="border rounded px-2 py-1 text-xs" value={editForm.sn} onChange={e => setEditForm({...editForm, sn: e.target.value})} placeholder="SN" />
                        <input className="border rounded px-2 py-1 text-xs col-span-2" value={editForm.mac} onChange={e => setEditForm({...editForm, mac: e.target.value})} placeholder="MAC地址" />
                        <input className="border rounded px-2 py-1 text-xs" value={editForm.roomNumber} onChange={e => setEditForm({...editForm, roomNumber: e.target.value})} placeholder="房间" />
                        <input className="border rounded px-2 py-1 text-xs" value={editForm.softwareName} onChange={e => setEditForm({...editForm, softwareName: e.target.value})} placeholder="软件" />
                        <div className="col-span-2 flex gap-2 mt-1">
                            <button onClick={saveEdit} className="bg-blue-500 text-white px-3 py-1 rounded text-xs">保存</button>
                            <button onClick={() => setIsEditing(false)} className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs">取消</button>
                        </div>
                    </div>
                 ) : (
                    <>
                        <div className="flex justify-between">
                             <span className="font-bold">{device.name}</span>
                             <span className="text-xs opacity-70">{device.sn}</span>
                        </div>
                        <div className="text-xs opacity-80">MAC: {device.mac || '-'}</div>
                        <div className="text-xs opacity-80">房间: {device.roomNumber || '-'}</div>
                        <div className="text-xs opacity-80">软件: {device.softwareName || '-'}</div>
                        <div className="flex gap-2 mt-2">
                             <div className="flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded text-xs">
                                <Cpu size={10} /> {device.cpuUsage}%
                             </div>
                             <div className="flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded text-xs">
                                <HardDrive size={10} /> {device.memoryUsage}%
                             </div>
                             <div className="flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded text-xs">
                                <Wifi size={10} /> {device.signalStrength}
                             </div>
                        </div>
                        <button onClick={() => setIsEditing(true)} className="text-blue-600 text-xs mt-1 hover:underline">编辑详情</button>
                    </>
                 )}
            </div>
        </div>
        
         {/* Events */}
        <div className="mt-3 border-t border-slate-100 pt-2">
             <div className="text-xs font-bold opacity-60 mb-1">最近事件</div>
             {device.events.slice(0, 3).map(e => (
                 <div key={e.id} className="text-[10px] flex gap-2 opacity-80">
                     <span>{new Date(e.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                     <span>{e.message}</span>
                 </div>
             ))}
        </div>
      </div>
    );
  };

  // Available stores based on region selection
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
                onClick={() => setIsAddModalOpen(true)}
                className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors flex items-center gap-1"
             >
                 <Plus size={24} />
                 <span className="text-xs font-bold">新增设备</span>
             </button>
             <h2 className="text-lg font-bold text-white tracking-wide">设备管理</h2>
             <div className="w-8"></div> {/* Spacer for centering */}
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

       {/* Add Device Mobile Modal (Full Screen Overlay) */}
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
                    
                    {/* Image Upload Section - Moved to Top */}
                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">设备缩略图</label>
                            
                            <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                                {newDeviceForm.images.map((img, index) => (
                                    <div key={index} className="flex-shrink-0 relative group w-24">
                                        <div className="h-24 w-24 rounded-lg overflow-hidden border border-slate-200">
                                            <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md">
                                            <X size={12} />
                                        </button>
                                        <select 
                                            value={img.category} 
                                            onChange={(e) => handleImageCategoryChange(index, e.target.value)}
                                            className="w-full text-[10px] mt-1 border border-slate-200 rounded px-1 py-0.5 bg-slate-50"
                                        >
                                            <option value="设备外观">设备外观</option>
                                            <option value="安装现场">安装现场</option>
                                            <option value="其他">其他</option>
                                        </select>
                                    </div>
                                ))}
                                
                                <div className="flex-shrink-0 h-24 w-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer">
                                    <input type="file" accept="image/*" onChange={handleAddImage} className="absolute inset-0 opacity-0 z-10 w-full h-full cursor-pointer" />
                                    <Plus className="text-slate-400 mb-1" size={24} />
                                    <span className="text-[10px] text-slate-500 text-center px-1">点击上传</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400">支持上传多张图片，请为每张图片选择分类</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备名称 *</label>
                            <input required type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={newDeviceForm.name} onChange={e => setNewDeviceForm({...newDeviceForm, name: e.target.value})} placeholder="例如: VR-009" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SN号 *</label>
                            <input required type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={newDeviceForm.sn} onChange={e => setNewDeviceForm({...newDeviceForm, sn: e.target.value})} placeholder="例如: SN-2024-XXXX" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">MAC地址</label>
                            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={newDeviceForm.mac} onChange={e => setNewDeviceForm({...newDeviceForm, mac: e.target.value})} placeholder="例如: 00:1A:2B:..." />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属大区 (选填)</label>
                            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                                value={newDeviceForm.regionId} onChange={e => setNewDeviceForm({...newDeviceForm, regionId: e.target.value, storeId: ''})}
                            >
                                <option value="">请选择大区</option>
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属门店 (选填)</label>
                            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                                value={newDeviceForm.storeId} onChange={e => setNewDeviceForm({...newDeviceForm, storeId: e.target.value})}
                                disabled={!newDeviceForm.regionId}
                            >
                                <option value="">请选择门店</option>
                                {stores.filter(s => s.regionId === newDeviceForm.regionId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备类型 *</label>
                            <select required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                                value={newDeviceForm.typeId} onChange={e => setNewDeviceForm({...newDeviceForm, typeId: e.target.value})}
                            >
                                <option value="">请选择类型</option>
                                {deviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">房间号码</label>
                            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={newDeviceForm.roomNumber} onChange={e => setNewDeviceForm({...newDeviceForm, roomNumber: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">体验软件名称</label>
                            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={newDeviceForm.softwareName} onChange={e => setNewDeviceForm({...newDeviceForm, softwareName: e.target.value})} />
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
    </div>
  );
};