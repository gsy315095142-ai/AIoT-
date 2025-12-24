import React, { useState, ChangeEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { Store as StoreIcon, Plus, Edit2, Trash2, X, Store, BedDouble, Star, Table, Ruler, ArrowLeft, Search, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Store as StoreType, Room, RoomImageCategory, RoomImage } from '../../types';

const ROOM_MODULES: RoomImageCategory[] = ['玄关', '桌面', '床'];

export const RoomArchive: React.FC = () => {
  const { regions, stores, roomTypes, addStore, updateStore, removeStore } = useApp();

  // Navigation & Filter State
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState(''); // New filter for room detail view

  // Store Management Modal State
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [storeForm, setStoreForm] = useState<{
      id: string;
      name: string;
      regionId: string;
      rooms: { key: string; number: string }[];
  }>({
      id: '',
      name: '',
      regionId: '',
      rooms: []
  });

  // Room Detail Modal State
  const [editingRoom, setEditingRoom] = useState<{ storeId: string; room: Room } | null>(null);

  // Derived State
  const activeStore = stores.find(s => s.id === viewingStoreId);
  
  const filteredStores = stores.filter(s => {
      if (regionFilter && s.regionId !== regionFilter) return false;
      return true;
  });

  // --- Store Management Logic ---

  const openAddStoreModal = () => {
      setEditingStoreId(null);
      setStoreForm({ id: '', name: '', regionId: '', rooms: [{ key: 'init', number: '' }] });
      setIsStoreModalOpen(true);
  };

  const openEditStoreModal = (store: StoreType) => {
      setEditingStoreId(store.id);
      setStoreForm({
          id: store.id,
          name: store.name,
          regionId: store.regionId,
          rooms: store.rooms.length > 0 
            ? store.rooms.map((r, i) => ({ key: `room-${i}-${Date.now()}`, number: r.number }))
            : [{ key: 'init', number: '' }]
      });
      setIsStoreModalOpen(true);
  };

  const addRoomRow = () => {
      setStoreForm(prev => {
          const lastRoom = prev.rooms[prev.rooms.length - 1];
          let nextNumber = '';
          if (lastRoom && lastRoom.number) {
              if (/^\d+$/.test(lastRoom.number)) {
                  const val = parseInt(lastRoom.number, 10);
                  if (!isNaN(val)) {
                       const len = lastRoom.number.length;
                       nextNumber = (val + 1).toString().padStart(len, '0');
                  }
              } else {
                   const match = lastRoom.number.match(/^(.*?)(\d+)$/);
                   if (match) {
                       const prefix = match[1];
                       const numStr = match[2];
                       const val = parseInt(numStr, 10);
                       const nextVal = val + 1;
                       nextNumber = prefix + nextVal.toString().padStart(numStr.length, '0');
                   }
              }
          }
          return {
              ...prev,
              rooms: [...prev.rooms, { key: `new-${Date.now()}`, number: nextNumber }]
          };
      });
  };

  const removeRoomRow = (index: number) => {
      setStoreForm(prev => ({
          ...prev,
          rooms: prev.rooms.filter((_, i) => i !== index)
      }));
  };

  const updateRoomRow = (index: number, value: string) => {
       setStoreForm(prev => {
          const newRooms = [...prev.rooms];
          newRooms[index].number = value;
          return { ...prev, rooms: newRooms };
       });
  };

  const handleStoreSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const inputRoomNumbers = storeForm.rooms.map(r => r.number.trim()).filter(Boolean);
      const uniqueNumbers = Array.from(new Set(inputRoomNumbers)); 
      
      const defaultRoomType = roomTypes.length > 0 ? roomTypes[0].name : '普通房';

      const mergeRooms = (currentRooms: Room[] = []): Room[] => {
          return uniqueNumbers.map(num => {
              const existing = currentRooms.find(r => r.number === num);
              if (existing) return existing;
              return { number: num, type: defaultRoomType, images: [] }; 
          });
      };

      if (editingStoreId) {
          const existingStore = stores.find(s => s.id === editingStoreId);
          if (!existingStore) return;
          
          updateStore(editingStoreId, {
              name: storeForm.name,
              regionId: storeForm.regionId,
              rooms: mergeRooms(existingStore.rooms)
          });
      } else {
          if (stores.some(s => s.id === storeForm.id)) {
              alert("门店ID已存在，请使用唯一的ID");
              return;
          }
          addStore({
              id: storeForm.id,
              name: storeForm.name,
              regionId: storeForm.regionId,
              rooms: mergeRooms([])
          });
      }
      setIsStoreModalOpen(false);
  };

  const handleDeleteStore = (id: string, name: string) => {
      if (window.confirm(`确定要删除门店 "${name}" 吗？此操作不可恢复。`)) {
          removeStore(id);
      }
  };

  // --- Room Detail Logic ---

  const openRoomDetail = (storeId: string, room: Room) => {
      setEditingRoom({ storeId, room });
  };

  const handleRoomSave = () => {
      if (!editingRoom) return;
      
      const { storeId, room } = editingRoom;
      const store = stores.find(s => s.id === storeId);
      if (!store) return;

      const updatedRooms = store.rooms.map(r => r.number === room.number ? room : r);
      updateStore(storeId, { rooms: updatedRooms });
      setEditingRoom(null);
  };

  const handleRoomImageUpload = (e: ChangeEvent<HTMLInputElement>, category: RoomImageCategory) => {
      if (!editingRoom) return;
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const newImage: RoomImage = { url, category };
          setEditingRoom({
              ...editingRoom,
              room: {
                  ...editingRoom.room,
                  images: [...(editingRoom.room.images || []), newImage]
              }
          });
          e.target.value = '';
      }
  };

  const removeRoomImage = (imageToRemove: RoomImage) => {
      if (!editingRoom) return;
      setEditingRoom({
          ...editingRoom,
          room: {
              ...editingRoom.room,
              images: editingRoom.room.images?.filter(img => img !== imageToRemove) || []
          }
      });
  };

  // --- View Switching ---

  if (viewingStoreId && activeStore) {
      // --- Detail View: Store Rooms ---
      const roomCount = activeStore.rooms.length;
      
      // Filter Logic
      const filteredRooms = activeStore.rooms.filter(room => {
          if (roomTypeFilter && room.type !== roomTypeFilter) return false;
          return true;
      });

      return (
          <div className="h-full flex flex-col bg-white">
              {/* Sticky Header with Title and Filter */}
              <div className="sticky top-0 bg-white z-10 shadow-sm">
                  <div className="flex items-center gap-3 p-4 pb-2">
                      <button 
                          onClick={() => setViewingStoreId(null)}
                          className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                      >
                          <ArrowLeft size={20} />
                      </button>
                      <div>
                          <h2 className="text-base font-bold text-slate-800">{activeStore.name}</h2>
                          <p className="text-xs text-slate-500">共 {filteredRooms.length}/{roomCount} 间客房</p>
                      </div>
                  </div>

                  {/* Room Filter Bar */}
                  <div className="px-4 pb-3">
                      <div className="relative">
                          <select 
                              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 pl-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={roomTypeFilter}
                              onChange={(e) => setRoomTypeFilter(e.target.value)}
                          >
                              <option value="">全部房型</option>
                              {roomTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}
                          </select>
                          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                      </div>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                  {filteredRooms.length > 0 ? (
                      // Grid layout: Larger tiles
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {filteredRooms.map(room => (
                              <button 
                                  key={room.number}
                                  onClick={() => openRoomDetail(activeStore.id, room)}
                                  className={`aspect-square flex flex-col items-center justify-center p-2 rounded-xl border-2 shadow-sm transition-all hover:shadow-md active:scale-95 group relative overflow-hidden
                                      ${room.type === '样板房' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'}
                                  `}
                              >
                                  {/* Background decoration for Sample Room */}
                                  {room.type === '样板房' && (
                                      <div className="absolute top-0 right-0 p-1">
                                           <Star size={16} className="text-amber-400 fill-amber-400" />
                                      </div>
                                  )}

                                  <div className="flex-1 flex flex-col items-center justify-center w-full pt-4">
                                      <div className="text-4xl font-bold leading-none tracking-tight">{room.number}</div>
                                  </div>
                                  
                                  <div className={`text-xs font-bold px-3 py-1.5 rounded-full mb-2 ${
                                      room.type === '样板房' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                                  }`}>
                                      {room.type}
                                  </div>
                              </button>
                          ))}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-60 text-slate-400">
                          <BedDouble size={40} className="mb-2 opacity-20" />
                          <p className="text-sm">没有找到相关客房</p>
                      </div>
                  )}
              </div>

              {/* Render Room Detail Modal Logic inside detail view scope or globally below */}
              {editingRoom && (
                  <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-scaleIn max-h-[85vh]">
                          <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                  <BedDouble size={20} className="text-blue-600" />
                                  客房详情 - {editingRoom.room.number}
                              </h3>
                              <button onClick={() => setEditingRoom(null)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                          </div>
                          
                          <div className="p-5 space-y-4 overflow-y-auto flex-1">
                              {/* Room Type */}
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">房型选择</label>
                                  <div className="grid grid-cols-2 gap-3">
                                      {roomTypes.map(rt => {
                                          const isSelected = editingRoom.room.type === rt.name;
                                          const isSample = rt.name === '样板房'; // Keep legacy visual check if name matches
                                          
                                          return (
                                            <label key={rt.id} className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                                isSelected 
                                                    ? (isSample ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-blue-500 bg-blue-50 text-blue-700')
                                                    : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200'
                                            }`}>
                                                <input 
                                                    type="radio" 
                                                    className="hidden" 
                                                    checked={isSelected} 
                                                    onChange={() => setEditingRoom({...editingRoom, room: {...editingRoom.room, type: rt.name}})} 
                                                />
                                                {isSample ? <Star size={24} className="mb-1 fill-current" /> : <BedDouble size={24} className="mb-1" />}
                                                <span className="text-xs font-bold">{rt.name}</span>
                                            </label>
                                          )
                                      })}
                                  </div>
                              </div>
                              {/* ... Room Images Logic (Same as before) ... */}
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">客房照片</label>
                                  <div className="space-y-4">
                                      {ROOM_MODULES.map(category => {
                                          const catImages = editingRoom.room.images?.filter(img => img.category === category) || [];
                                          return (
                                              <div key={category} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                  <div className="flex items-center gap-2 mb-2">
                                                      <div className="w-1.5 h-3 bg-blue-500 rounded-full"></div>
                                                      <span className="text-xs font-bold text-slate-700">{category}</span>
                                                  </div>
                                                  <div className="grid grid-cols-3 gap-2">
                                                      <div className="aspect-square border-2 border-dashed border-blue-200 bg-white rounded-lg flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group">
                                                          <input type="file" accept="image/*" onChange={(e) => handleRoomImageUpload(e, category)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                          <Plus className="text-blue-400 mb-1 group-hover:scale-110 transition-transform" size={16} />
                                                          <span className="text-[8px] text-blue-500 font-bold">上传</span>
                                                      </div>
                                                      {catImages.map((img, idx) => (
                                                          <div key={idx} className="aspect-square rounded-lg border border-slate-200 relative group overflow-hidden bg-white">
                                                              <img src={img.url} alt={`room-${category}-${idx}`} className="w-full h-full object-cover" />
                                                              <button 
                                                                  onClick={() => removeRoomImage(img)} 
                                                                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                              >
                                                                  <X size={10} />
                                                              </button>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                              <button 
                                  onClick={handleRoomSave}
                                  className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                              >
                                  保存客房信息
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

  // --- List View: Store List ---
  return (
    <div className="h-full flex flex-col relative">
         {/* Sticky Header Section */}
        <div className="sticky top-0 z-10 bg-slate-50 pb-2 -mt-4 pt-4 px-4">
             {/* 1.1 Add Button Top Left */}
            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={openAddStoreModal}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors shadow-md"
                >
                    <Plus size={16} /> 新增门店
                </button>
            </div>

            {/* 1.2 Filter Bar */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 mb-2">
                <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                    >
                        <option value="">全部大区</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>
        </div>

        {/* 1.3 Store List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
             {filteredStores.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">没有找到符合条件的门店</div>
            )}
            {filteredStores.map(s => {
                const regionName = regions.find(r => r.id === s.regionId)?.name || '未知大区';
                const roomCount = s.rooms?.length || 0;
                
                return (
                    // 1.4 Store Item Layout (Click to Open Detail)
                    <div 
                        key={s.id} 
                        onClick={() => { setViewingStoreId(s.id); setRoomTypeFilter(''); }}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer group hover:shadow-md transition-all active:scale-[0.99]"
                    >
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-600 transition-colors">{s.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="bg-slate-100 px-1.5 rounded">{regionName}</span>
                                <span className="text-slate-300">|</span>
                                <span className="flex items-center gap-1"><BedDouble size={12}/> {roomCount} 间客房</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 pl-3 border-l border-slate-50">
                            {/* 1.5 Edit & Delete Buttons */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); openEditStoreModal(s); }}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteStore(s.id, s.name); }}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                            <ChevronRight size={16} className="text-slate-300 ml-1" />
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Store Add/Edit Modal (Reused) */}
        {isStoreModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-scaleIn max-h-[90vh]">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Store size={20} className="text-blue-600" />
                            {editingStoreId ? '编辑门店' : '新增门店'}
                        </h3>
                        <button onClick={() => setIsStoreModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    <form onSubmit={handleStoreSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">门店ID *</label>
                            <input 
                                required
                                type="text" 
                                className={`w-full border rounded p-2 text-sm focus:outline-none ${editingStoreId ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500'}`}
                                value={storeForm.id}
                                onChange={e => setStoreForm({...storeForm, id: e.target.value})}
                                disabled={!!editingStoreId}
                                placeholder="输入唯一ID (例如: S001)"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">门店名称 *</label>
                            <input 
                                required
                                type="text" 
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={storeForm.name}
                                onChange={e => setStoreForm({...storeForm, name: e.target.value})}
                                placeholder="输入门店名称"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属大区 *</label>
                            <select 
                                required
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                value={storeForm.regionId}
                                onChange={e => setStoreForm({...storeForm, regionId: e.target.value})}
                            >
                                <option value="">请选择大区</option>
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">客房列表 (动态添加)</label>
                            <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                        <Table size={12} /> 房间号列表
                                    </span>
                                    <button 
                                        type="button" 
                                        onClick={addRoomRow} 
                                        className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition-colors flex items-center gap-1 text-[10px] font-bold"
                                    >
                                        <Plus size={12} /> 添加行
                                    </button>
                                </div>
                                <div className="max-h-48 overflow-y-auto p-0 bg-white">
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-slate-50">
                                            {storeForm.rooms.map((room, index) => (
                                                <tr key={room.key} className="group hover:bg-slate-50/80">
                                                    <td className="p-0">
                                                        <input 
                                                            type="text"
                                                            className="w-full px-3 py-2.5 bg-transparent focus:outline-none focus:bg-blue-50/30 transition-colors text-sm text-slate-700"
                                                            value={room.number}
                                                            onChange={(e) => updateRoomRow(index, e.target.value)}
                                                            placeholder="输入房号 (如: 101)"
                                                            autoFocus={index === storeForm.rooms.length - 1 && room.key.startsWith('new-')}
                                                        />
                                                    </td>
                                                    <td className="w-10 text-center p-0">
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeRoomRow(index)}
                                                            className="text-slate-300 hover:text-red-500 p-2 transition-colors flex items-center justify-center w-full h-full"
                                                            title="删除此行"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {storeForm.rooms.length === 0 && (
                                                <tr>
                                                    <td colSpan={2} className="p-6 text-center text-xs text-slate-400 cursor-pointer hover:text-blue-500 hover:bg-slate-50 border-b border-transparent transition-all" onClick={addRoomRow}>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Plus size={20} className="opacity-50" />
                                                            <span>点击此处添加第一个客房</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-2 flex-shrink-0">
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                                {editingStoreId ? '保存更改' : '确认添加'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};