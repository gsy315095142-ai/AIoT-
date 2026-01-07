import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceLogic } from '../hooks/useDeviceLogic';
import { DeviceStatus, OpsStatus, Device, Store as StoreModel, Region } from '../types';
import { STATUS_MAP, ImageManagerModal, ReportDetailModal, EventDetailModal, DeviceDetailCard, AuditGate } from '../components/DeviceComponents';
import { ChevronDown, ChevronUp, Plus, Search, CheckSquare, Square, X, Settings2, Play, Moon, RotateCcw, Wrench, ClipboardCheck, Check, X as XIcon, ImageIcon, ClipboardList, Monitor, Store, ArrowLeft, ArrowRight, MessageSquareWarning, ScanLine, QrCode } from 'lucide-react';
import { ScanModal } from '../components/ScanModal';

// --- Types ---
type ViewLevel = 'stores' | 'rooms' | 'deviceTypes' | 'devices';

interface ViewState {
    level: ViewLevel;
    storeId?: string;
    roomNumber?: string;
    deviceTypeId?: string;
}

interface BreakdownStats {
    count: number;
    statusCounts: Record<string, number>;
}

interface RoomData {
    number: string;
    type: string;
    devices: Device[];
    onlineCount: number;
    breakdown: Record<string, BreakdownStats>;
}

interface TypeGroup {
    typeId: string;
    typeName: string;
    count: number;
    statusCounts: Record<string, number>;
}

// DeviceList Component containing the hierarchical navigation and list logic
export const DeviceControl: React.FC = () => {
  const navigate = useNavigate();
  const {
    // Data
    regions, stores, deviceTypes, filteredDevices, availableStores, pendingAuditCount, pendingFeedbackCount,
    devices,
    // States
    selectedRegion, setSelectedRegion, searchQuery, setSearchQuery,
    expandedDeviceId, setExpandedDeviceId, selectedDeviceIds,
    editingImageDevice, setEditingImageDevice,
    isControlMenuOpen, setIsControlMenuOpen, isOpsStatusModalOpen, setIsOpsStatusModalOpen,
    isInspectionModalOpen, setIsInspectionModalOpen, isFeedbackModalOpen, setIsFeedbackModalOpen,
    viewingReportDevice, setViewingReportDevice, viewingEventData, setViewingEventData,
    opsChangeStatus, setOpsChangeStatus, opsChangeReason, setOpsChangeReason, complaintType, setComplaintType, opsChangeImages,
    inspResult, setInspResult, inspRemark, setInspRemark, inspImages,
    feedbackContent, setFeedbackContent, feedbackImages,
    // Actions
    toggleSelection, toggleSelectAll, toggleExpand, hasPendingAudit,
    handleBatchRun, handleBatchSleep, handleBatchRestart, handleBatchFeedback, handleSubmitFeedback,
    openOpsStatusModal, handleOpsImageUpload, removeOpsImage, handleBatchOpsStatusSubmit,
    openInspectionModal, handleInspImageUpload, removeInspImage, handleSubmitInspection,
    handleFeedbackImageUpload, removeFeedbackImage,
  }
  = useDeviceLogic();

  // Navigation State
  const [viewState, setViewState] = useState<ViewState>({ level: 'stores' });
  
  // Scan Modal State
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // --- Helper for Region Stats ---
  const getRegionLabel = (region?: Region) => {
      const regionDevices = region 
          ? devices.filter(d => d.regionId === region.id)
          : devices;
      
      const total = regionDevices.length;
      
      const normal = regionDevices.filter(d => d.opsStatus === OpsStatus.INSPECTED).length;
      const repairing = regionDevices.filter(d => d.opsStatus === OpsStatus.REPAIRING).length;
      const complaint = regionDevices.filter(d => d.opsStatus === OpsStatus.HOTEL_COMPLAINT).length;
      
      const baseName = region ? region.name : '全部大区';
      return `${baseName} (总:${total} 正常:${normal} 维修:${repairing} 客诉:${complaint})`;
  };

  // --- Derived Data for Hierarchy ---
  const storesWithCounts = useMemo(() => {
      return availableStores.map(store => {
          const devicesInStore = filteredDevices.filter(d => d.storeId === store.id);
          
          const normalCount = devicesInStore.filter(d => d.opsStatus === OpsStatus.INSPECTED).length;
          const repairCount = devicesInStore.filter(d => d.opsStatus === OpsStatus.REPAIRING).length;
          const complaintCount = devicesInStore.filter(d => d.opsStatus === OpsStatus.HOTEL_COMPLAINT).length;
          const pendingCount = devicesInStore.filter(d => d.opsStatus === OpsStatus.PENDING).length;
          
          const breakdown: Record<string, BreakdownStats> = {};
          devicesInStore.forEach(d => {
              const typeName = deviceTypes.find(t => t.id === d.typeId)?.name || '其他';
              if (!breakdown[typeName]) breakdown[typeName] = { count: 0, statusCounts: {} };
              breakdown[typeName].count++;
              
              const st = d.opsStatus;
              if (!breakdown[typeName].statusCounts[st]) breakdown[typeName].statusCounts[st] = 0;
              breakdown[typeName].statusCounts[st]++;
          });

          return {
              ...store,
              deviceCount: devicesInStore.length,
              normalCount,
              repairCount,
              complaintCount,
              pendingCount,
              breakdown
          };
      });
  }, [availableStores, filteredDevices, deviceTypes]);

  const activeStoreData = useMemo<{ store: StoreModel; roomsData: RoomData[] } | null>(() => {
      if (!viewState.storeId) return null;
      const store = stores.find(s => s.id === viewState.storeId);
      if (!store) return null;

      const definedRooms = store.rooms || [];
      const devicesInStore = filteredDevices.filter(d => d.storeId === store.id);
      const deviceRoomNumbers = new Set(devicesInStore.map(d => d.roomNumber));
      
      const allRoomNumbers = Array.from(new Set([
          ...definedRooms.map(r => r.number),
          ...Array.from(deviceRoomNumbers)
      ])).sort();

      const roomsData = allRoomNumbers.map(num => {
          const devicesInRoom = devicesInStore.filter(d => d.roomNumber === num);
          const definedType = definedRooms.find(r => r.number === num)?.type || '未知房型';
          
          const breakdown: Record<string, BreakdownStats> = {};
          devicesInRoom.forEach(d => {
              const typeName = deviceTypes.find(t => t.id === d.typeId)?.name || '其他';
              if (!breakdown[typeName]) breakdown[typeName] = { count: 0, statusCounts: {} };
              breakdown[typeName].count++;
              
              const st = d.opsStatus;
              if (!breakdown[typeName].statusCounts[st]) breakdown[typeName].statusCounts[st] = 0;
              breakdown[typeName].statusCounts[st]++;
          });

          return {
              number: num,
              type: definedType,
              devices: devicesInRoom,
              onlineCount: devicesInRoom.filter(d => d.status === DeviceStatus.ONLINE).length,
              breakdown
          };
      });

      return { store, roomsData };
  }, [viewState.storeId, stores, filteredDevices, deviceTypes]);

  const activeRoomDeviceTypes = useMemo<TypeGroup[]>(() => {
      if (!viewState.storeId || !viewState.roomNumber) return [];
      const devicesInRoom = filteredDevices.filter(d => d.storeId === viewState.storeId && d.roomNumber === viewState.roomNumber);
      
      const typeGroups: Record<string, TypeGroup> = {};
      
      devicesInRoom.forEach(d => {
          const typeId = d.typeId;
          if (!typeGroups[typeId]) {
              typeGroups[typeId] = { 
                  typeId, 
                  typeName: deviceTypes.find(t => t.id === typeId)?.name || '未知类型',
                  count: 0,
                  statusCounts: {}
              };
          }
          typeGroups[typeId].count++;
          
          const st = d.opsStatus;
          if (!typeGroups[typeId].statusCounts[st]) typeGroups[typeId].statusCounts[st] = 0;
          typeGroups[typeId].statusCounts[st]++;
      });
      
      return Object.values(typeGroups);
  }, [viewState.storeId, viewState.roomNumber, filteredDevices, deviceTypes]);

  const activeRoomDevices = useMemo(() => {
      if (!viewState.storeId || !viewState.roomNumber || !viewState.deviceTypeId) return [];
      return filteredDevices.filter(d => 
          d.storeId === viewState.storeId && 
          d.roomNumber === viewState.roomNumber &&
          d.typeId === viewState.deviceTypeId
      );
  }, [viewState, filteredDevices]);


  const goBack = () => {
      if (viewState.level === 'devices') {
          setViewState({ level: 'deviceTypes', storeId: viewState.storeId, roomNumber: viewState.roomNumber });
          if (selectedDeviceIds.size > 0) toggleSelectAll(); 
      } else if (viewState.level === 'deviceTypes') {
          setViewState({ level: 'rooms', storeId: viewState.storeId });
      } else if (viewState.level === 'rooms') {
          setViewState({ level: 'stores' });
      }
  };

  const handleStoreClick = (storeId: string) => setViewState({ level: 'rooms', storeId });
  const handleRoomClick = (roomNumber: string) => setViewState({ level: 'deviceTypes', storeId: viewState.storeId, roomNumber });
  const handleDeviceTypeClick = (typeId: string) => setViewState({ level: 'devices', storeId: viewState.storeId, roomNumber: viewState.roomNumber, deviceTypeId: typeId });

  const handleAddDeviceClick = () => {
      const initialData: any = {};
      if (viewState.storeId) {
          const store = stores.find(s => s.id === viewState.storeId);
          if (store) {
              initialData.storeId = store.id;
              initialData.regionId = store.regionId;
          }
      }
      if (viewState.roomNumber) initialData.roomNumber = viewState.roomNumber;
      if (viewState.deviceTypeId) initialData.typeId = viewState.deviceTypeId;
      
      navigate('/devices/add', { state: initialData });
  };

  const getRowStyle = (d: any) => {
    if (d.opsStatus === OpsStatus.HOTEL_COMPLAINT) return 'bg-pink-100 border-pink-300 text-pink-900';
    if (d.opsStatus === OpsStatus.REPAIRING) return 'bg-purple-200 border-purple-300 text-purple-900';
    if (d.opsStatus === OpsStatus.PENDING) return 'bg-orange-200 border-orange-300 text-orange-900';
    if (d.status === DeviceStatus.OFFLINE) return 'bg-slate-200 border-slate-300 text-slate-700';
    if (d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.IN_USE) return 'bg-green-200 border-green-300 text-green-900';
    return 'bg-yellow-100 border-yellow-200 text-yellow-900'; 
  };

  const getHeaderTitle = () => {
      if (viewState.level === 'stores') return '门店列表';
      const storeName = activeStoreData?.store.name || '';
      if (viewState.level === 'rooms') return storeName;
      if (viewState.level === 'deviceTypes') return `${storeName} - ${viewState.roomNumber}`;
      const typeName = deviceTypes.find(t => t.id === viewState.deviceTypeId)?.name || '设备';
      return `${storeName} - ${viewState.roomNumber} - ${typeName}`;
  };

  // --- Scan Handlers ---
  const handleScanOld = () => {
      if (devices.length > 0) {
          const target = devices[0];
          setViewState({
              level: 'devices',
              storeId: target.storeId,
              roomNumber: target.roomNumber,
              deviceTypeId: target.typeId
          });
          setExpandedDeviceId(target.id);
          setIsScanModalOpen(false);
      } else {
          alert("暂无设备");
      }
  };

  return (
    <div className="p-4 pb-20 h-full flex flex-col"> 
        {/* Header Controls */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-xl shadow-lg mb-4 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            
            <div className="relative z-10">
                <div className={`flex justify-between items-center ${viewState.level === 'stores' ? 'mb-4' : ''}`}>
                    <div className="flex items-center gap-2">
                        {viewState.level !== 'stores' && (
                            <button onClick={goBack} className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-all border border-white/10">
                                <ArrowLeft size={18} />
                            </button>
                        )}
                        <h2 className="text-white font-bold text-lg leading-tight line-clamp-1">
                            {getHeaderTitle()}
                        </h2>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                        {/* Scan Button - New */}
                        <button 
                            onClick={() => setIsScanModalOpen(true)}
                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm transition-all border border-white/10"
                            title="扫一扫"
                        >
                            <ScanLine size={20} />
                        </button>

                        <button 
                            onClick={() => navigate('/device-feedback')}
                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm transition-all border border-white/10 relative"
                            title="设备反馈"
                        >
                            <MessageSquareWarning size={20} />
                            {pendingFeedbackCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold border-2 border-blue-600">
                                    {pendingFeedbackCount}
                                </span>
                            )}
                        </button>

                        <button 
                            onClick={handleAddDeviceClick}
                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm transition-all border border-white/10"
                        >
                            <Plus size={20} />
                        </button>
                        
                        <AuditGate type="device">
                            <button 
                                onClick={() => navigate('/audit')}
                                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm transition-all border border-white/10 relative"
                            >
                                <ClipboardCheck size={20} />
                                {pendingAuditCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold border-2 border-blue-600">
                                        {pendingAuditCount}
                                    </span>
                                )}
                            </button>
                        </AuditGate>
                    </div>
                </div>

                {/* Show Filters ONLY at Stores Level */}
                {viewState.level === 'stores' && (
                    <>
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

                        {/* Simplified Filters: Only Region */}
                        <div className="relative">
                            <select 
                                className="w-full appearance-none bg-white text-blue-900 text-[10px] font-bold py-2 px-3 rounded-lg focus:outline-none"
                                value={selectedRegion}
                                onChange={(e) => { setSelectedRegion(e.target.value); setViewState({ level: 'stores' }); }}
                            >
                                <option value="">{getRegionLabel()}</option>
                                {regions.map(r => <option key={r.id} value={r.id}>{getRegionLabel(r)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-900 pointer-events-none" size={14} />
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 relative">
            {/* LEVEL 1: Stores List */}
            {viewState.level === 'stores' && (
                <div className="space-y-3 animate-fadeIn">
                    {storesWithCounts.map(store => (
                        <div 
                            key={store.id} 
                            onClick={() => handleStoreClick(store.id)}
                            className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
                                        <Store size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{store.name}</h4>
                                        <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-2 items-center">
                                            <span>共 {store.deviceCount} 台</span>
                                            {store.normalCount > 0 && <span className="text-green-600 font-bold bg-green-50 px-1.5 rounded border border-green-100">正常 {store.normalCount}</span>}
                                            {store.repairCount > 0 && <span className="text-purple-600 font-bold bg-purple-50 px-1.5 rounded border border-purple-100">维修 {store.repairCount}</span>}
                                            {store.complaintCount > 0 && <span className="text-pink-600 font-bold bg-pink-50 px-1.5 rounded border border-pink-100">客诉 {store.complaintCount}</span>}
                                            {store.pendingCount > 0 && <span className="text-orange-600 font-bold bg-orange-50 px-1.5 rounded border border-orange-100">待审 {store.pendingCount}</span>}
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-slate-300 mt-2" />
                            </div>
                            
                            {/* Breakdown */}
                            {Object.keys(store.breakdown).length > 0 && (
                                <div className="bg-slate-50 rounded-lg p-2 space-y-1.5 mt-2 border border-slate-100">
                                    {Object.entries(store.breakdown).map(([type, val]) => {
                                        const stats = val as BreakdownStats;
                                        return (
                                        <div key={type} className="flex justify-between items-center text-[10px]">
                                            <span className="font-bold text-slate-700">{type} <span className="text-slate-400 font-normal">x{stats.count}</span></span>
                                            <div className="flex gap-2">
                                                {Object.entries(stats.statusCounts).map(([status, count]) => {
                                                    let colorClass = 'text-slate-500';
                                                    if (status === '正常') colorClass = 'text-green-600';
                                                    else if (status === '维修') colorClass = 'text-purple-600';
                                                    else if (status === '客诉') colorClass = 'text-pink-600';
                                                    
                                                    return (
                                                        <span key={status} className={`${colorClass} font-medium flex items-center gap-0.5`}>
                                                            {status} {count}
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    ))}
                    {storesWithCounts.length === 0 && (
                        <div className="text-center py-20 text-slate-400 text-xs">
                            未找到符合条件的门店
                        </div>
                    )}
                </div>
            )}

            {/* LEVEL 2: Room Grid */}
            {viewState.level === 'rooms' && activeStoreData && (
                <div className="animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                        {activeStoreData.roomsData.map(room => (
                            <div 
                                key={room.number}
                                onClick={() => handleRoomClick(room.number)}
                                className={`rounded-xl border flex flex-col p-3 cursor-pointer transition-all hover:shadow-md active:scale-95 bg-white min-h-[100px] justify-between
                                    ${room.devices.length > 0 ? 'border-blue-200' : 'border-slate-200 border-dashed'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-lg font-bold text-slate-800 leading-none">{room.number}</div>
                                        <div className="text-[9px] text-slate-400 mt-1">{room.type}</div>
                                    </div>
                                    {room.devices.length > 0 && (
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded-full">{room.devices.length}</span>
                                    )}
                                </div>

                                {/* Device Breakdown */}
                                {room.devices.length > 0 ? (
                                    <div className="space-y-1">
                                        {Object.entries(room.breakdown).map(([type, val]) => {
                                            const stats = val as BreakdownStats;
                                            return (
                                            <div key={type} className="text-[9px] bg-slate-50 px-1.5 py-1 rounded flex flex-col gap-0.5">
                                                <div className="font-bold text-slate-700 flex justify-between">
                                                    <span>{type}</span>
                                                    <span>x{stats.count}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-2 gap-y-0.5 opacity-90">
                                                    {Object.entries(stats.statusCounts).map(([st, c]) => (
                                                        <span key={st} className={
                                                            st === '正常' ? 'text-green-600' : 
                                                            st === '客诉' ? 'text-pink-600' : 
                                                            st === '维修' ? 'text-purple-600' : 'text-slate-500'
                                                        }>
                                                            {st}{c}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )})}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <span className="text-[10px] text-slate-300">暂无设备</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {activeStoreData.roomsData.length === 0 && (
                        <div className="text-center py-20 text-slate-400 text-xs">
                            该门店暂无客房数据
                        </div>
                    )}
                </div>
            )}

            {/* LEVEL 3: Device Types Grid */}
            {viewState.level === 'deviceTypes' && (
                <div className="animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3">
                        {activeRoomDeviceTypes.map(group => (
                            <div 
                                key={group.typeId}
                                onClick={() => handleDeviceTypeClick(group.typeId)}
                                className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                        <Monitor size={18} />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm">{group.typeName}</h4>
                                </div>
                                
                                <div className="text-[10px] space-y-1.5">
                                    <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded">
                                        <span className="text-slate-500">总设备数</span>
                                        <span className="font-bold text-slate-800">{group.count} 台</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {Object.entries(group.statusCounts).map(([st, c]) => (
                                            <span key={st} className={`font-medium flex items-center gap-0.5 ${
                                                st === '正常' ? 'text-green-600' : 
                                                st === '客诉' ? 'text-pink-600' : 
                                                st === '维修' ? 'text-purple-600' : 'text-slate-500'
                                            }`}>
                                                {st} {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {activeRoomDeviceTypes.length === 0 && (
                        <div className="text-center py-20 text-slate-400 text-xs">
                            该房间暂无设备
                        </div>
                    )}
                </div>
            )}

            {/* LEVEL 4: Device List */}
            {viewState.level === 'devices' && (
                <div className="animate-fadeIn pb-16">
                    {activeRoomDevices.map(device => {
                        const rowStyle = getRowStyle(device);
                        const isDetailExpanded = expandedDeviceId === device.id;
                        const isSelected = selectedDeviceIds.has(device.id);
                        const isPending = hasPendingAudit(device.id);

                        return (
                            <div key={device.id} className="mb-2 rounded-lg overflow-hidden shadow-sm border border-slate-100 relative">
                                <div 
                                    className={`flex items-center px-3 py-3 transition-colors cursor-pointer ${rowStyle}`}
                                    onClick={() => toggleExpand(device.id)}
                                >
                                    <div onClick={(e) => { e.stopPropagation(); toggleSelection(device.id); }} className="mr-2 cursor-pointer opacity-60 hover:opacity-100">
                                        {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                    </div>
                                    <div className="w-20 truncate font-bold text-xs">{device.name}</div>
                                    <div className="flex-1 text-center truncate text-[10px] px-1 opacity-80">{device.subType || deviceTypes.find(t=>t.id===device.typeId)?.name}</div>
                                    <div className="w-12 text-center text-[10px] font-bold opacity-90">{STATUS_MAP[device.status]}</div>
                                    <div className="w-16 text-right text-[10px] font-bold flex flex-col items-end justify-center leading-tight">
                                        <span className="truncate">{device.opsStatus}</span>
                                        {isPending && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded mt-0.5 border border-red-200 animate-pulse">待审核</span>}
                                    </div>
                                    <div className="ml-1 opacity-50 flex-shrink-0">
                                        {isDetailExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </div>
                                </div>
                                
                                {/* Expanded Device Detail */}
                                {isDetailExpanded && (
                                    <div className="p-2 bg-white border-t border-slate-100">
                                        <DeviceDetailCard 
                                            device={device} 
                                            onEditImage={setEditingImageDevice}
                                            onViewReport={setViewingReportDevice}
                                            onViewEvent={(event, deviceId) => setViewingEventData({ event, deviceId })}
                                            onOpenInspection={openInspectionModal}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {activeRoomDevices.length === 0 && (
                        <div className="text-center py-20 text-slate-400 text-xs">
                            该类型下暂无匹配的设备
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Scan Modal */}
        {isScanModalOpen && (
            <ScanModal onClose={() => setIsScanModalOpen(false)} onScanOld={handleScanOld} />
        )}

        {/* Device Control Button (Fixed at bottom) - ONLY VISIBLE ON DEVICES LEVEL */}
        {viewState.level === 'devices' && (
            <div className="fixed bottom-[80px] left-1/2 transform -translate-x-1/2 z-40 animate-slideInUp">
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
        )}

        {/* Control Menu Popup */}
        {isControlMenuOpen && selectedDeviceIds.size > 0 && (
            <>
                <div className="fixed inset-0 z-40" onClick={() => setIsControlMenuOpen(false)}></div>
                <div className="fixed bottom-[130px] left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 w-80 animate-scaleIn origin-bottom">
                    <div className="grid grid-cols-5 gap-2">
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
                        <button onClick={handleBatchFeedback} className="flex flex-col items-center gap-1 p-2 hover:bg-orange-50 rounded-lg text-orange-600 transition-colors">
                            <MessageSquareWarning size={20} />
                            <span className="text-[10px] font-bold">设备反馈</span>
                        </button>
                    </div>
                </div>
            </>
        )}

        {/* Modals */}
        
        {/* Feedback Submission Modal - New */}
        {isFeedbackModalOpen && (
            <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 animate-scaleIn">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                        <MessageSquareWarning size={20} className="text-orange-600" />
                        提交设备反馈
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">反馈内容 *</label>
                            <textarea 
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none h-24 resize-none"
                                placeholder="请描述设备遇到的问题..."
                                value={feedbackContent}
                                onChange={e => setFeedbackContent(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">上传图片/视频 (可选)</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded bg-slate-50 flex items-center justify-center flex-shrink-0 cursor-pointer relative hover:bg-blue-50 hover:border-blue-200 transition-colors">
                                    <input type="file" accept="image/*,video/*" onChange={handleFeedbackImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <ImageIcon size={20} className="text-slate-400" />
                                </div>
                                {feedbackImages.map((url, idx) => (
                                    <div key={idx} className="w-16 h-16 rounded border border-slate-200 overflow-hidden flex-shrink-0 relative group bg-black">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button onClick={() => removeFeedbackImage(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 opacity-80 hover:opacity-100"><X size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                             <button onClick={() => setIsFeedbackModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded text-slate-600 font-bold hover:bg-slate-50">取消</button>
                             <button onClick={handleSubmitFeedback} className="flex-1 py-2 bg-orange-600 text-white rounded font-bold hover:bg-orange-700 shadow-md">确认反馈</button>
                        </div>
                    </div>
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
                                <option value={OpsStatus.HOTEL_COMPLAINT}>客诉</option>
                                <option value={OpsStatus.REPAIRING}>维修</option>
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
