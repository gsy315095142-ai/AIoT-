import React, { useState, ChangeEvent } from 'react';
import { Ruler, Store, ChevronDown, Plus, X, Upload, ClipboardList, Edit3, Check, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoomImageCategory, RoomImage, RoomMeasurement, MeasurementType } from '../../types';

const MODULES: RoomImageCategory[] = ['玄关', '桌面', '床'];

export const RoomMeasure: React.FC = () => {
  const { regions, stores, updateStore } = useApp();
  
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');

  // Editing state for measurements: map category to form data or null (not editing)
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ type: MeasurementType; remark: string }>({
    type: '正常安装',
    remark: ''
  });

  // Computed
  const filteredStores = selectedRegion 
    ? stores.filter(s => s.regionId === selectedRegion) 
    : stores;

  const currentStore = stores.find(s => s.id === selectedStoreId);
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

  const saveMeasurement = (category: RoomImageCategory) => {
      if (!currentStore || !currentRoom) return;

      const newMeasurement: RoomMeasurement = {
          category,
          type: editForm.type,
          remark: editForm.remark
      };

      const existingMeasurements = currentRoom.measurements || [];
      // Remove existing for this category if any, then add new
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

  return (
    <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-0 z-10">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                <Store size={12} /> 门店筛选
            </h3>
            <div className="grid grid-cols-3 gap-3">
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
                <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        value={selectedRoomNumber}
                        onChange={(e) => setSelectedRoomNumber(e.target.value)}
                        disabled={!selectedStoreId}
                    >
                        <option value="">请选择客房</option>
                        {currentStore?.rooms.map(r => <option key={r.number} value={r.number}>{r.number} ({r.type})</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>
        </div>

        {/* Content */}
        {currentRoom ? (
             <div className="flex flex-col gap-4">
                {MODULES.map(moduleName => {
                    const images = currentRoom.images.filter(img => img.category === moduleName);
                    const measurement = currentRoom.measurements?.find(m => m.category === moduleName);
                    const isEditing = editingCategory === moduleName;

                    return (
                        <div key={moduleName} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            {/* Module Header */}
                            <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <div className="w-2 h-4 bg-blue-500 rounded-full"></div>
                                    {moduleName}
                                </h4>
                                <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono">共 {images.length} 张图</span>
                            </div>
                            
                            {/* Part 1: Images */}
                            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 content-start">
                                {/* Upload Button */}
                                <div className="aspect-square border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={(e) => handleImageUpload(e, moduleName)} 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
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

                            {/* Part 2: Evaluation */}
                            <div className="p-4">
                                <h5 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                                    <ClipboardList size={12} /> 复尺评估
                                </h5>

                                {isEditing ? (
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
                                                onClick={() => saveMeasurement(moduleName)}
                                                className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1"
                                            >
                                                <Save size={12} /> 保存
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    measurement ? (
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
  );
};