import React from 'react';
import { useDeviceLogic } from '../hooks/useDeviceLogic';
import { DeviceStatus, OpsStatus, AuditStatus, AuditType } from '../types';
import { STATUS_MAP, SUB_TYPE_MAPPING, ImageManagerModal, ReportDetailModal, EventDetailModal, AuditManagementModal, DeviceDetailCard } from '../components/DeviceComponents';
import { ChevronDown, ChevronUp, Plus, Search, CheckSquare, Square, X, Settings2, Play, Moon, RotateCcw, Wrench, ClipboardCheck, Check, X as XIcon, ImageIcon, ClipboardList } from 'lucide-react';

export const DeviceManagement: React.FC = () => {
  const {
    // Data
    regions, stores, deviceTypes, filteredDevices, availableStores, pendingAuditCount, imageCounts, CATEGORY_LIMITS,
    // States
    selectedRegion, setSelectedRegion, selectedStore, setSelectedStore, selectedType, setSelectedType,
    selectedStatus, setSelectedStatus, selectedOpsStatus, setSelectedOpsStatus, searchQuery, setSearchQuery,
    expandedDeviceId, selectedDeviceIds,
    isAddModalOpen, setIsAddModalOpen, editingImageDevice, setEditingImageDevice,
    isControlMenuOpen, setIsControlMenuOpen, isOpsStatusModalOpen, setIsOpsStatusModalOpen,
    isAuditModalOpen, setIsAuditModalOpen, isInspectionModalOpen, setIsInspectionModalOpen,
    viewingReportDevice, setViewingReportDevice, viewingEventData, setViewingEventData,
    opsChangeStatus, setOpsChangeStatus, opsChangeReason, setOpsChangeReason, complaintType, setComplaintType, opsChangeImages,
    inspResult, setInspResult, inspRemark, setInspRemark, inspImages,
    deviceForm, setDeviceForm,
    // Actions
    toggleSelection, toggleSelectAll, toggleExpand, hasPendingAudit,
    handleBatchRun, handleBatchSleep, handleBatchRestart,
    openOpsStatusModal, handleOpsImageUpload, removeOpsImage, handleBatchOpsStatusSubmit,
    openInspectionModal, handleInspImageUpload, removeInspImage, handleSubmitInspection,
    openAddModal, handleAddFormImage, handleRemoveFormImage, handleFormImageCategoryChange, handleAddSubmit
  } = useDeviceLogic();

  const getStoreName = (id: string) => stores.find(s => s.id === id)?.name || '-';
  const calculateDuration = (dateStr: string) => {
    if (!dateStr) return '-';
    const start = new Date(dateStr).getTime();
    const now = new Date().getTime();
    if (isNaN(start)) return '-';
    const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d` : '1d';
  };

  const getRowStyle = (d: any) => {
    if (d.opsStatus === OpsStatus.HOTEL_COMPLAINT) return 'bg-pink-100 border-pink-300 text-pink-900';
    if (d.opsStatus === OpsStatus.REPAIRING) return 'bg-purple-200 border-purple-300 text-purple-900';
    if (d.opsStatus === OpsStatus.PENDING) return 'bg-orange-200 border-orange-300 text-orange-900';
    if (d.status === DeviceStatus.OFFLINE) return 'bg-slate-200 border-slate-300 text-slate-700';
    if (d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.IN_USE) return 'bg-green-200 border-green-300 text-green-900';
    return 'bg-yellow-100 border-yellow-200 text-yellow-900'; 
  };

  return (
    <div className="p-4 pb-20"> 
        {/* Header Controls */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-t-xl shadow-lg mb-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <button 
                        onClick={openAddModal}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm transition-all border border-white/10"
                    >
                        <Plus size={20} />
                    </button>
                    
                    <button 
                        onClick={() => setIsAuditModalOpen(true)}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm transition-all border border-white/10 relative"
                    >
                        <ClipboardCheck size={20} />
                        {pendingAuditCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold border-2 border-blue-600">
                                {pendingAuditCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-lg p-1 flex items-center mb-3 border border-white/20">
                    <Search className="text-blue-100 ml-2" size={16} />
                    <input 
                        type="text" 
                        placeholder="请输入设备SN号、MAC地址或者名称" 
                        className="bg-transparent border-none text-white placeholder-blue-200 text-xs w-full focus:ring-0 px-2"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="bg-blue-800/50 text-white text-xs px-3 py-1.5 rounded-md hover:bg-blue-800/70 transition-colors font-bold">
                        搜索
                    </button>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-white text-blue-900 text-[10px] font-bold py-1.5 px-2 rounded focus:outline-none"
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                        >
                            <option value="">全部大区</option>
                            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-900 pointer-events-none" size={12} />
                    </div>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-white text-blue-900 text-[10px] font-bold py-1.5 px-2 rounded focus:outline-none"
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                        >
                            <option value="">全部门店</option>
                            {availableStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-900 pointer-events-none" size={12} />
                    </div>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-white text-blue-900 text-[10px] font-bold py-1.5 px-2 rounded focus:outline-none"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="">所有类型</option>
                            {deviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-900 pointer-events-none" size={12} />
                    </div>
                    
                    {/* New Filter Row */}
                     <div className="relative">
                        <select 
                            className="w-full appearance-none bg-blue-800/40 text-white text-[10px] font-bold py-1.5 px-2 rounded focus:outline-none border border-blue-400/30"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">全部状态</option>
                            <option value={DeviceStatus.ONLINE}>运行中</option>
                            <option value={DeviceStatus.STANDBY}>待机中</option>
                            <option value={DeviceStatus.OFFLINE}>未联网</option>
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-200 pointer-events-none" size={12} />
                    </div>
                     <div className="relative col-span-2">
                        <select 
                            className="w-full appearance-none bg-blue-800/40 text-white text-[10px] font-bold py-1.5 px-2 rounded focus:outline-none border border-blue-400/30"
                            value={selectedOpsStatus}
                            onChange={(e) => setSelectedOpsStatus(e.target.value)}
                        >
                            <option value="">全部运维状态</option>
                            <option value={OpsStatus.INSPECTED}>正常</option>
                            <option value={OpsStatus.HOTEL_COMPLAINT}>酒店客诉</option>
                            <option value={OpsStatus.REPAIRING}>维修中</option>
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-200 pointer-events-none" size={12} />
                    </div>
                </div>
            </div>
        </div>

        {/* Device List Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 flex items-center text-white text-[10px] font-bold rounded-b-xl shadow-md mb-2">
            <div onClick={toggleSelectAll} className="mr-2 cursor-pointer">
                {selectedDeviceIds.size > 0 && selectedDeviceIds.size === filteredDevices.length ? <CheckSquare size={14} /> : <Square size={14} />}
            </div>
            <div className="w-16">设备名称</div>
            <div className="flex-1 text-center">门店</div>
            <div className="w-12 text-center">状态</div>
            <div className="w-20 text-right">运维状态</div>
        </div>

        {/* Device List */}
        <div className="space-y-2">
          {filteredDevices.map(device => {
             const rowStyle = getRowStyle(device);
             const isExpanded = expandedDeviceId === device.id;
             const isSelected = selectedDeviceIds.has(device.id);
             const isPending = hasPendingAudit(device.id);

             return (
                 <div key={device.id} className="rounded-lg overflow-hidden shadow-sm border border-slate-100 relative">
                     {/* List Row */}
                     <div 
                        className={`flex items-center px-3 py-3 transition-colors cursor-pointer ${rowStyle} ${isExpanded ? 'rounded-t-lg' : 'rounded-lg'}`}
                        onClick={() => toggleExpand(device.id)}
                     >
                         <div onClick={(e) => { e.stopPropagation(); toggleSelection(device.id); }} className="mr-2 cursor-pointer opacity-60 hover:opacity-100">
                             {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                         </div>
                         <div className="w-16 truncate font-bold text-xs">{device.name}</div>
                         <div className="flex-1 text-center truncate text-[10px] px-1 opacity-80">{getStoreName(device.storeId)}</div>
                         <div className="w-12 text-center text-[10px] font-bold opacity-90">{STATUS_MAP[device.status]}</div>
                         <div className="w-20 text-right text-[10px] font-bold flex flex-col items-end justify-center leading-tight">
                            <span className="truncate">{device.opsStatus}</span>
                            <span className="text-[8px] opacity-70 scale-90 origin-right">({calculateDuration(device.lastTestTime)})</span>
                         </div>
                         <div className="ml-1 opacity-50 flex-shrink-0">
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                         </div>
                     </div>
                     
                     {isPending && (
                         <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-bl-lg font-bold shadow-sm z-10 pointer-events-none">
                             待审核
                         </div>
                     )}

                     {/* Expanded Detail */}
                     {isExpanded && <DeviceDetailCard 
                        device={device} 
                        onEditImage={setEditingImageDevice}
                        onViewReport={setViewingReportDevice}
                        onViewEvent={(event, deviceId) => setViewingEventData({ event, deviceId })}
                        onOpenInspection={openInspectionModal}
                     />}
                 </div>
             );
          })}
          {filteredDevices.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs">未找到符合条件的设备</div>
          )}
        </div>

        {/* Device Control Button (Fixed at bottom) */}
        <div className="fixed bottom-[80px] left-1/2 transform -translate-x-1/2 z-40">
             <button 
                onClick={() => setIsControlMenuOpen(!isControlMenuOpen)}
                disabled={selectedDeviceIds.size === 0}
                className={`px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-bold text-sm transition-all border 
                    ${selectedDeviceIds.size > 0 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 border-blue-400' 
                        : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                    }`}
             >
                 <Settings2 size={16} />
                 设备管控 {selectedDeviceIds.size > 0 ? `(${selectedDeviceIds.size})` : ''}
             </button>
        </div>

        {/* Control Menu Popup */}
        {isControlMenuOpen && selectedDeviceIds.size > 0 && (
            <>
                <div className="fixed inset-0 z-40" onClick={() => setIsControlMenuOpen(false)}></div>
                <div className="fixed bottom-[130px] left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 w-64 animate-scaleIn origin-bottom">
                    <div className="grid grid-cols-4 gap-2">
                        <button onClick={handleBatchRun} className="flex flex-col items-center gap-1 p-2 hover:bg-green-50 rounded-lg text-green-700 transition-colors">
                            <Play size={20} />
                            <span className="text-[10px] font-bold">运行设备</span>
                        </button>
                        <button onClick={handleBatchSleep} className="flex flex-col items-center gap-1 p-2 hover:bg-yellow-50 rounded-lg text-yellow-600 transition-colors">
                            <Moon size={20} />
                            <span className="text-[10px] font-bold">休眠设备</span>
                        </button>
                        <button onClick={handleBatchRestart} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                            <RotateCcw size={20} />
                            <span className="text-[10px] font-bold">重启设备</span>
                        </button>
                         <button onClick={openOpsStatusModal} className="flex flex-col items-center gap-1 p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                            <Wrench size={20} />
                            <span className="text-[10px] font-bold">运维状态</span>
                        </button>
                    </div>
                </div>
            </>
        )}

        {/* Modals */}
        {isAddModalOpen && (
            <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="bg-blue-600 p-4 pt-8 flex justify-between items-center text-white">
                        <h3 className="font-bold text-lg">添加新设备</h3>
                        <button onClick={() => setIsAddModalOpen(false)}><X size={24} /></button>
                    </div>
                    <form onSubmit={handleAddSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 bg-slate-50">
                        {/* Image Upload Section at Top */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">设备缩略图</label>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="aspect-square border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg flex flex-col items-center justify-center relative hover:bg-blue-100 transition-colors cursor-pointer">
                                    <input type="file" accept="image/*" onChange={handleAddFormImage} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <Plus className="text-blue-500 mb-1" size={20} />
                                    <span className="text-[9px] text-blue-600 font-bold">添加图片</span>
                                </div>
                                {deviceForm.images.map((img, index) => (
                                    <div key={index} className="aspect-square rounded-lg border border-slate-200 relative group overflow-hidden bg-slate-100">
                                        <img src={img.url} alt={`preview-${index}`} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => handleRemoveFormImage(index)} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-80 hover:opacity-100"><X size={10} /></button>
                                        <div className="absolute bottom-0 left-0 right-0 p-0.5 bg-white/90">
                                            <select 
                                                value={img.category} 
                                                onChange={(e) => handleFormImageCategoryChange(index, e.target.value)}
                                                className="w-full text-[8px] bg-transparent border-none p-0 focus:ring-0 text-center font-bold text-slate-700"
                                            >
                                                {Object.entries(CATEGORY_LIMITS).map(([cat, limit]) => {
                                                    const count = imageCounts[cat] || 0;
                                                    const isFull = count >= limit;
                                                    const isCurrent = img.category === cat;
                                                    return <option key={cat} value={cat} disabled={isFull && !isCurrent}>{cat} ({count}/{limit})</option>;
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备名称 *</label><input required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.name} onChange={e => setDeviceForm({...deviceForm, name: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">SN号码 *</label><input required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.sn} onChange={e => setDeviceForm({...deviceForm, sn: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">MAC地址</label><input className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.mac} onChange={e => setDeviceForm({...deviceForm, mac: e.target.value})} placeholder="XX:XX:XX:XX:XX:XX" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属大区</label><select className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={deviceForm.regionId} onChange={e => setDeviceForm({...deviceForm, regionId: e.target.value})}><option value="">选择大区</option>{regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属门店</label><select className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={deviceForm.storeId} onChange={e => setDeviceForm({...deviceForm, storeId: e.target.value})}><option value="">选择门店</option>{stores.filter(s => !deviceForm.regionId || s.regionId === deviceForm.regionId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备类型 *</label>
                                 <select required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={deviceForm.typeId} onChange={e => setDeviceForm({...deviceForm, typeId: e.target.value, subType: ''})}>
                                     <option value="">选择类型</option>
                                     {deviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                 </select>
                             </div>
                             
                             {/* Sub Type Dropdown */}
                             {(() => {
                                 const selectedTypeName = deviceTypes.find(t => t.id === deviceForm.typeId)?.name;
                                 const subTypeOptions = selectedTypeName ? SUB_TYPE_MAPPING[selectedTypeName] : undefined;
                                 if (!subTypeOptions) return null;
                                 
                                 return (
                                     <div>
                                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备子类型</label>
                                         <select 
                                            className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" 
                                            value={deviceForm.subType} 
                                            onChange={e => setDeviceForm({...deviceForm, subType: e.target.value})}
                                        >
                                             <option value="">选择子类型</option>
                                             {subTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                         </select>
                                     </div>
                                 );
                             })()}

                             <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">房间号码</label><input className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.roomNumber} onChange={e => setDeviceForm({...deviceForm, roomNumber: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">首次启动</label><input type="datetime-local" className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.firstStartTime} onChange={e => setDeviceForm({...deviceForm, firstStartTime: e.target.value})} /></div>
                             </div>
                             <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">体验软件</label><input className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.softwareName} onChange={e => setDeviceForm({...deviceForm, softwareName: e.target.value})} /></div>
                        </div>

                        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors">确认添加</button>
                    </form>
                </div>
            </div>
        )}

        {editingImageDevice && (
            <ImageManagerModal device={editingImageDevice} onClose={() => setEditingImageDevice(null)} />
        )}

        {isOpsStatusModalOpen && (
             <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 animate-scaleIn">
                    <h3 className="font-bold text-lg mb-4 text-slate-800">设备运维状态修改申请</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">选择新状态</label>
                            <select 
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                value={opsChangeStatus}
                                onChange={(e) => setOpsChangeStatus(e.target.value as OpsStatus)}
                            >
                                <option value={OpsStatus.INSPECTED}>正常</option>
                                <option value={OpsStatus.HOTEL_COMPLAINT}>酒店客诉</option>
                                <option value={OpsStatus.REPAIRING}>维修中</option>
                            </select>
                        </div>

                        {opsChangeStatus === OpsStatus.HOTEL_COMPLAINT && (
                            <div className="animate-fadeIn">
                                <label className="block text-xs font-bold text-pink-500 uppercase mb-1">客诉类型 *</label>
                                <select 
                                    className="w-full border border-pink-200 rounded p-2 text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none bg-pink-50 text-pink-700"
                                    value={complaintType}
                                    onChange={(e) => setComplaintType(e.target.value)}
                                >
                                    <option value="">请选择类型...</option>
                                    <option value="设备质量故障">设备质量故障</option>
                                    <option value="其他客诉情况">其他客诉情况</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">变更说明 *</label>
                            <textarea 
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none"
                                placeholder="请输入详细的变更原因或备注..."
                                value={opsChangeReason}
                                onChange={e => setOpsChangeReason(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">上传凭证 (可选)</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                <div className="w-16 h-16 border-2 border-dashed border-blue-200 rounded bg-blue-50 flex items-center justify-center flex-shrink-0 cursor-pointer relative hover:bg-blue-100">
                                    <input type="file" accept="image/*" onChange={handleOpsImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <Plus size={20} className="text-blue-400" />
                                </div>
                                {opsChangeImages.map((url, idx) => (
                                    <div key={idx} className="w-16 h-16 rounded border border-slate-200 overflow-hidden flex-shrink-0 relative group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button onClick={() => removeOpsImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 opacity-80 hover:opacity-100"><X size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                             <button onClick={() => setIsOpsStatusModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded text-slate-600 font-bold hover:bg-slate-50">取消</button>
                             <button onClick={handleBatchOpsStatusSubmit} className="flex-1 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-md">提交审核</button>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {isInspectionModalOpen && (
             <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 animate-scaleIn">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                        <ClipboardList size={20} className="text-blue-600" />
                        提交巡检报告
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <label className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${inspResult === 'Qualified' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-green-200'}`}>
                                <input type="radio" name="inspResult" value="Qualified" checked={inspResult === 'Qualified'} onChange={() => setInspResult('Qualified')} className="hidden" />
                                <Check size={24} className="mb-1" />
                                <span className="text-xs font-bold">合格</span>
                            </label>
                            <label className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${inspResult === 'Unqualified' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500 hover:border-red-200'}`}>
                                <input type="radio" name="inspResult" value="Unqualified" checked={inspResult === 'Unqualified'} onChange={() => setInspResult('Unqualified')} className="hidden" />
                                <XIcon size={24} className="mb-1" />
                                <span className="text-xs font-bold">不合格</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">备注信息 *</label>
                            <textarea 
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none"
                                placeholder="请输入巡检详情或故障描述..."
                                value={inspRemark}
                                onChange={e => setInspRemark(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">现场照片</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                <div className="w-16 h-16 border-2 border-dashed border-blue-200 rounded bg-blue-50 flex items-center justify-center flex-shrink-0 cursor-pointer relative hover:bg-blue-100">
                                    <input type="file" accept="image/*" onChange={handleInspImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <ImageIcon size={20} className="text-blue-400" />
                                </div>
                                {inspImages.map((url, idx) => (
                                    <div key={idx} className="w-16 h-16 rounded border border-slate-200 overflow-hidden flex-shrink-0 relative group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button onClick={() => removeInspImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 opacity-80 hover:opacity-100"><X size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                             <button onClick={() => setIsInspectionModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded text-slate-600 font-bold hover:bg-slate-50">取消</button>
                             <button onClick={handleSubmitInspection} className="flex-1 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-md">提交审核</button>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {isAuditModalOpen && (
            <AuditManagementModal onClose={() => setIsAuditModalOpen(false)} />
        )}

        {viewingReportDevice && (
            <ReportDetailModal 
                record={null} 
                device={viewingReportDevice}
                onClose={() => setViewingReportDevice(null)} 
            />
        )}

        {viewingEventData && (
            <EventDetailModal 
                event={viewingEventData.event} 
                deviceId={viewingEventData.deviceId}
                onClose={() => setViewingEventData(null)} 
            />
        )}

    </div>
  );
};