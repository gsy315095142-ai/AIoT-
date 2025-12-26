import React, { useState, ChangeEvent } from 'react';
import { Ruler, Store, ChevronDown, Plus, X, Upload, ClipboardList, Edit3, Check, Save, Filter, BedDouble, HelpCircle, Image as ImageIcon, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoomImageCategory, RoomImage, RoomMeasurement, MeasurementType, RoomMeasurementStatus } from '../../types';
import { AuditGate } from '../DeviceComponents';

const MODULES: RoomImageCategory[] = ['玄关', '桌面', '床'];

type RoomStatusFilter = 'all' | 'no_image' | 'pending' | 'completed';

// Static example images fallback
const EXAMPLE_IMAGES: Record<string, string> = {
    '玄关': 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=600&auto=format&fit=crop',
    '桌面': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=600&auto=format&fit=crop',
    '床': 'https://images.unsplash.com/photo-1505693416388-b0346ef4174d?q=80&w=600&auto=format&fit=crop'
};

export const RoomMeasure: React.FC = () => {
  const { regions, stores, updateStore } = useApp();
  
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [statusFilter, setStatusFilter] = useState<RoomStatusFilter>('all');

  // Editing state for measurements: map category to form data or null (not editing)
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ type: MeasurementType; remark: string }>({
    type: '正常安装',
    remark: ''
  });

  // Rejection State
  const [rejectingCategory, setRejectingCategory] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Example Image Modal State
  const [viewingExample, setViewingExample] = useState<{ title: string; url: string } | null>(null);

  // Computed
  const filteredStores = selectedRegion 
    ? stores.filter(s => s.regionId === selectedRegion) 
    : stores;

  const currentStore = stores.find(s => s.id === selectedStoreId);

  // Filter Rooms based on Status
  const filteredRooms = currentStore?.rooms.filter(room => {
      const hasImages = room.images && room.images.length > 0;
      // We assume there are 3 required modules for completion
      const measurementCount = room.measurements ? room.measurements.filter(m => m.status === 'approved').length : 0;
      const isCompleted = measurementCount >= 3; // Simple rule: 3 approved measurements implies done
      
      if (statusFilter === 'all') return true;
      if (statusFilter === 'no_image') return !hasImages;
      if (statusFilter === 'pending') return hasImages && !isCompleted;
      if (statusFilter === 'completed') return isCompleted;
      return true;
  }) || [];

  const currentRoom = currentStore?.rooms.find(r => r.number === selectedRoomNumber);

  // Handlers
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, category: RoomImageCategory) => {
      if (!currentStore || !currentRoom) return;
      
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const newImage: RoomImage = { url, category };
          
          const updatedRooms = currentStore.rooms.map(r => {
              if (r.number === currentRoom.number) {
                  return { ...r, images: [...r.images, newImage] };
              }
              return r;
          });

          updateStore(currentStore.id, { rooms: updatedRooms });
          e.target.value = '';
      }
  };

  const handleRemoveImage = (imageToRemove: RoomImage) => {
      if (!currentStore || !currentRoom) return;

      const updatedRooms = currentStore.rooms.map(r => {
          if (r.number === currentRoom.number) {
              return { ...r, images: r.images.filter(img => img !== imageToRemove) };
          }
          return r;
      });

      updateStore(currentStore.id, { rooms: updatedRooms });
  };

  // Measurement Evaluation Handlers
  const startEditing = (category: RoomImageCategory, existing?: RoomMeasurement) => {
    setEditingCategory(category);
    if (existing) {
        setEditForm({ type: existing.type, remark: existing.remark });
    } else {
        setEditForm({ type: '正常安装', remark: '' });
    }
  };

  const cancelEditing = () => {
    setEditingCategory(null);
  };

  const saveMeasurement = (category: RoomImageCategory, currentStatus?: RoomMeasurementStatus) => {
      if (!currentStore || !currentRoom) return;

      // When saving content changes, keep current status if it exists, but usually edits mean re-submission might be needed if it was rejected
      // For simplicity, keep status as is. If rejected, it stays rejected until re-submitted.
      const status = currentStatus; 

      const newMeasurement: RoomMeasurement = {
          category,
          type: editForm.type,
          remark: editForm.remark,
          status: status,
          rejectReason: status === 'rejected' ? currentRoom.measurements?.find(m => m.category === category)?.rejectReason : undefined
      };

      const existingMeasurements = currentRoom.measurements || [];
      const otherMeasurements = existingMeasurements.filter(m => m.category !== category);
      const updatedMeasurements = [...otherMeasurements, newMeasurement];

      const updatedRooms = currentStore.rooms.map(r => {
          if (r.number === currentRoom.number) {
              return { ...r, measurements: updatedMeasurements };
          }
          return r;
      });

      updateStore(currentStore.id, { rooms: updatedRooms });
      setEditingCategory(null);
  };

  const submitAudit = (category: RoomImageCategory) => {
      if (!currentStore || !currentRoom) return;
      const measurement = currentRoom.measurements?.find(m => m.category === category);
      if (!measurement) return;

      // Reset to Stage 1
      const newMeasurement: RoomMeasurement = { ...measurement, status: 'pending_stage_1', rejectReason: undefined };
      
      const existingMeasurements = currentRoom.measurements || [];
      const otherMeasurements = existingMeasurements.filter(m => m.category !== category);
      const updatedMeasurements = [...otherMeasurements, newMeasurement];

      const updatedRooms = currentStore.rooms.map(r => {
          if (r.number === currentRoom.number) {
              return { ...r, measurements: updatedMeasurements };
          }
          return r;
      });

      updateStore(currentStore.id, { rooms: updatedRooms });
  };

  const handleApprove = (category: RoomImageCategory, currentStatus: RoomMeasurementStatus) => {
      if (!currentStore || !currentRoom) return;
      const measurement = currentRoom.measurements?.find(m => m.category === category);
      if (!measurement) return;

      // Logic: pending_stage_1 -> pending_stage_2 -> approved
      let nextStatus: RoomMeasurementStatus = 'approved';
      if (currentStatus === 'pending_stage_1') nextStatus = 'pending_stage_2';
      else if (currentStatus === 'pending_stage_2') nextStatus = 'approved';

      const newMeasurement: RoomMeasurement = { ...measurement, status: nextStatus };
      
      const existingMeasurements = currentRoom.measurements || [];
      const otherMeasurements = existingMeasurements.filter(m => m.category !== category);
      const updatedMeasurements = [...otherMeasurements, newMeasurement];

      const updatedRooms = currentStore.rooms.map(r => {
          if (r.number === currentRoom.number) {
              return { ...r, measurements: updatedMeasurements };
          }
          return r;
      });

      updateStore(currentStore.id, { rooms: updatedRooms });
  };

  const handleReject = (category: RoomImageCategory) => {
      if (!currentStore || !currentRoom || !rejectReason.trim()) return;
      const measurement = currentRoom.measurements?.find(m => m.category === category);
      if (!measurement) return;

      const newMeasurement: RoomMeasurement = { ...measurement, status: 'rejected', rejectReason };
      
      const existingMeasurements = currentRoom.measurements || [];
      const otherMeasurements = existingMeasurements.filter(m => m.category !== category);
      const updatedMeasurements = [...otherMeasurements, newMeasurement];

      const updatedRooms = currentStore.rooms.map(r => {
          if (r.number === currentRoom.number) {
              return { ...r, measurements: updatedMeasurements };
          }
          return r;
      });

      updateStore(currentStore.id, { rooms: updatedRooms });
      setRejectingCategory(null);
      setRejectReason('');
  };

  const openExample = (moduleName: string) => {
      // 1. Try to get from store config first (if viewing a room with a type)
      let exampleUrl = null;
      if (currentStore && currentRoom) {
          const roomType = currentRoom.type;
          const config = currentStore.roomTypeConfigs.find(rt => rt.name === roomType);
          if (config?.exampleImages?.[moduleName]) {
              exampleUrl = config.exampleImages[moduleName];
          }
      }
      
      // 2. Fallback to global static
      if (!exampleUrl && EXAMPLE_IMAGES[moduleName]) {
          exampleUrl = EXAMPLE_IMAGES[moduleName];
      }

      if (exampleUrl) {
          setViewingExample({ title: `${moduleName}示例`, url: exampleUrl });
      }
  };

  return (
    <div className="h-full flex flex-col">
        {/* Filters - Fixed */}
        <div className="bg-white p-4 shrink-0 shadow-sm border-b border-slate-100 z-10">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                <Store size={12} /> 门店与状态筛选
            </h3>
            
            <div className="flex flex-col gap-3">
                {/* Row 1: Region & Store */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedRegion}
                            onChange={(e) => { setSelectedRegion(e.target.value); setSelectedStoreId(''); setSelectedRoomNumber(''); }}
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
                            onChange={(e) => { setSelectedStoreId(e.target.value); setSelectedRoomNumber(''); }}
                        >
                            <option value="">请选择门店</option>
                            {filteredStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>

                {/* Row 2: Room & Status */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 pl-8"
                            value={selectedRoomNumber}
                            onChange={(e) => setSelectedRoomNumber(e.target.value)}
                            disabled={!selectedStoreId}
                        >
                            <option value="">请选择客房</option>
                            {filteredRooms.map(r => <option key={r.number} value={r.number}>{r.number} ({r.type})</option>)}
                        </select>
                        <BedDouble className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                    <div className="relative">
                         <select 
                            className="w-full appearance-none bg-blue-50/50 border border-blue-200 text-blue-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value as RoomStatusFilter); setSelectedRoomNumber(''); }}
                            disabled={!selectedStoreId}
                        >
                            <option value="all">全部状态</option>
                            <option value="no_image">未上传图片</option>
                            <option value="pending">待复尺评估</option>
                            <option value="completed">评估完成</option>
                        </select>
                         <Filter className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={12} />
                    </div>
                </div>
            </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentRoom ? (
                 <div className="flex flex-col gap-4">
                    {MODULES.map(moduleName => {
                        const images = currentRoom.images.filter(img => img.category === moduleName);
                        const measurement = currentRoom.measurements?.find(m => m.category === moduleName);
                        const isEditing = editingCategory === moduleName;
                        const hasImages = images.length > 0;
                        const status = measurement?.status;

                        return (
                            <div key={moduleName} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all ${
                                status === 'rejected' ? 'border-red-200 ring-2 ring-red-50' : 
                                status === 'approved' ? 'border-green-200' : 
                                'border-slate-100'
                            }`}>
                                {/* Module Header */}
                                <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        <div className={`w-2 h-4 rounded-full ${
                                            status === 'approved' ? 'bg-green-500' : 
                                            status === 'rejected' ? 'bg-red-500' : 
                                            (status === 'pending_stage_1' || status === 'pending_stage_2') ? 'bg-orange-500' : 'bg-blue-500'
                                        }`}></div>
                                        {moduleName}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        {status && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                                {status === 'pending_stage_1' ? '待初审' : 
                                                 status === 'pending_stage_2' ? '待终审' :
                                                 status === 'approved' ? '已通过' : '已驳回'}
                                            </span>
                                        )}
                                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono">共 {images.length} 张图</span>
                                        <button 
                                            onClick={() => openExample(moduleName)}
                                            className="flex items-center gap-1 text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 font-bold transition-colors"
                                        >
                                            <HelpCircle size={10} /> 示例
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Part 1: Images */}
                                <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 content-start">
                                    {/* Upload Button */}
                                    <div className="aspect-square border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => handleImageUpload(e, moduleName)} 
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" 
                                        />
                                        <Upload className="text-blue-400 mb-1 group-hover:scale-110 transition-transform" size={20} />
                                        <span className="text-[10px] text-blue-500 font-bold">上传</span>
                                    </div>

                                    {/* Image List */}
                                    {images.map((img, idx) => (
                                        <div key={idx} className="aspect-square rounded-xl border border-slate-200 relative group overflow-hidden bg-white shadow-sm">
                                            <img src={img.url} alt={`${moduleName}-${idx}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                    onClick={() => handleRemoveImage(img)}
                                                    className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transform scale-90 hover:scale-100 transition-all"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Divider */}
                                <div className="h-px bg-slate-100 mx-4"></div>

                                {/* Part 2: Evaluation & Audit */}
                                <div className="p-4">
                                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                                        <ClipboardList size={12} /> 复尺评估
                                    </h5>

                                    {!hasImages ? (
                                        <div className="py-2 px-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400 italic">
                                            请先上传图片，再进行复尺评估
                                        </div>
                                    ) : isEditing ? (
                                        <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 animate-fadeIn space-y-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-slate-500">安装类型</label>
                                                <select 
                                                    className="border border-slate-300 rounded p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={editForm.type}
                                                    onChange={(e) => setEditForm({...editForm, type: e.target.value as MeasurementType})}
                                                >
                                                    <option value="正常安装">正常安装</option>
                                                    <option value="特殊安装">特殊安装</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-slate-500">备注说明</label>
                                                <textarea 
                                                    className="border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none h-16"
                                                    value={editForm.remark}
                                                    onChange={(e) => setEditForm({...editForm, remark: e.target.value})}
                                                    placeholder="请输入复尺相关的详细说明..."
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-end pt-1">
                                                <button 
                                                    onClick={cancelEditing}
                                                    className="px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-200 transition-colors"
                                                >
                                                    取消
                                                </button>
                                                <button 
                                                    onClick={() => saveMeasurement(moduleName, measurement?.status)}
                                                    className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"
                                                >
                                                    <Save size={12} /> 保存
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        measurement ? (
                                            <div className="space-y-3">
                                                <div className={`rounded-lg p-3 border flex items-start justify-between group ${
                                                    measurement.type === '特殊安装' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'
                                                }`}>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                                                measurement.type === '特殊安装' 
                                                                    ? 'bg-orange-100 text-orange-700 border-orange-200' 
                                                                    : 'bg-green-100 text-green-700 border-green-200'
                                                            }`}>
                                                                {measurement.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                            {measurement.remark || '无备注说明'}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => startEditing(moduleName, measurement)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                </div>

                                                {/* Rejection Reason Display */}
                                                {status === 'rejected' && measurement.rejectReason && (
                                                    <div className="bg-red-50 border border-red-100 rounded-lg p-2 text-xs text-red-700 flex items-start gap-2">
                                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="font-bold">驳回原因:</span> {measurement.rejectReason}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Audit Actions */}
                                                <div className="flex gap-2">
                                                    {!status || status === 'rejected' ? (
                                                        <button 
                                                            onClick={() => submitAudit(moduleName)}
                                                            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 shadow-sm"
                                                        >
                                                            <Send size={12} /> {status === 'rejected' ? '重新提交初审' : '提交初审'}
                                                        </button>
                                                    ) : (status === 'pending_stage_1' || status === 'pending_stage_2') ? (
                                                        rejectingCategory === moduleName ? (
                                                            <div className="flex-1 flex gap-2 animate-fadeIn">
                                                                <input 
                                                                    autoFocus
                                                                    placeholder="驳回原因..." 
                                                                    className="flex-1 border border-red-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-red-300 outline-none"
                                                                    value={rejectReason}
                                                                    onChange={e => setRejectReason(e.target.value)}
                                                                />
                                                                <button onClick={() => handleReject(moduleName)} className="bg-red-500 text-white px-3 rounded text-xs">确认</button>
                                                                <button onClick={() => setRejectingCategory(null)} className="bg-slate-200 text-slate-600 px-3 rounded text-xs">取消</button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Reject Button: Available to anyone with audit rights at this stage */}
                                                                <AuditGate type="measurement" stage={status === 'pending_stage_1' ? 1 : 2} className="flex-1">
                                                                    <button 
                                                                        onClick={() => setRejectingCategory(moduleName)}
                                                                        className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                                                                    >
                                                                        驳回
                                                                    </button>
                                                                </AuditGate>
                                                                
                                                                {/* Approve Button */}
                                                                <AuditGate type="measurement" stage={status === 'pending_stage_1' ? 1 : 2} className="flex-1">
                                                                    <button 
                                                                        onClick={() => handleApprove(moduleName, status)}
                                                                        className="w-full py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm"
                                                                    >
                                                                        {status === 'pending_stage_1' ? '初审通过' : '终审通过'}
                                                                    </button>
                                                                </AuditGate>
                                                            </>
                                                        )
                                                    ) : (
                                                        <div className="flex-1 py-2 bg-slate-50 border border-slate-100 text-green-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-default">
                                                            <CheckCircle size={14} /> 已通过审核并归档
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => startEditing(moduleName)}
                                                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={16} />
                                                添加复尺评估
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                 </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
                    <Ruler size={48} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold">请选择门店和客房</p>
                    <p className="text-xs opacity-60 mt-1">选择后可上传各模块复尺照片及填写评估</p>
                </div>
            )}
        </div>

        {/* Example Image Modal */}
        {viewingExample && (
            <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setViewingExample(null)}>
                <div className="bg-transparent w-full max-w-lg flex flex-col items-center animate-scaleIn" onClick={e => e.stopPropagation()}>
                    <div className="bg-white rounded-t-lg px-4 py-2 w-full flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <ImageIcon size={16} className="text-blue-500"/> {viewingExample.title}
                        </span>
                        <button onClick={() => setViewingExample(null)} className="p-1 hover:bg-slate-100 rounded-full">
                            <X size={16} className="text-slate-500"/>
                        </button>
                    </div>
                    <div className="bg-black rounded-b-lg overflow-hidden w-full border-t border-slate-100">
                        <img src={viewingExample.url} alt="Example" className="w-full max-h-[70vh] object-contain" />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};