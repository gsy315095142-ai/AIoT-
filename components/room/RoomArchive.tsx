import React, { useState, ChangeEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { Store as StoreIcon, Plus, Edit2, Trash2, X, Store, BedDouble, Star, Table } from 'lucide-react';
import { Store as StoreType, Room, RoomImageCategory, RoomImage } from '../../types';

const ROOM_MODULES: RoomImageCategory[] = ['玄关', '桌面', '床'];

export const RoomArchive: React.FC = () => {
  const { regions, stores, addStore, updateStore, removeStore } = useApp();

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
              // Strategy 1: Pure Numeric
              if (/^\d+$/.test(lastRoom.number)) {
                  const val = parseInt(lastRoom.number, 10);
                  if (!isNaN(val)) {
                       const len = lastRoom.number.length;
                       nextNumber = (val + 1).toString().padStart(len, '0');
                  }
              } else {
                  // Strategy 2: Suffix Numeric
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
      const uniqueNumbers = Array.from(new Set(inputRoomNumbers)); // Remove duplicates
      
      // Helper to merge existing rooms with new list of numbers
      const mergeRooms = (currentRooms: Room[] = []): Room[] => {
          return uniqueNumbers.map(num => {
              const existing = currentRooms.find(r => r.number === num);
              if (existing) return existing;
              return { number: num, type: '普通房', images: [] }; // Default new room
          });
      };

      if (editingStoreId) {
          // Update
          const existingStore = stores.find(s => s.id === editingStoreId);
          if (!existingStore) return;
          
          updateStore(editingStoreId, {
              name: storeForm.name,
              regionId: storeForm.regionId,
              rooms: mergeRooms(existingStore.rooms)
          });
      } else {
          // Add - Check for duplicate ID
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

  return (
    <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
            <h3 className="text-sm font-bold text-blue-800 mb-1">客房数据归档</h3>
            <p className="text-xs text-blue-600 opacity-80">管理门店及其下属客房的基础信息，点击客房图标可编辑详细信息。</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                        <StoreIcon size={18} />
                    </div>
                    <h2 className="text-sm font-bold text-slate-800">门店列表</h2>
                </div>
                <button 
                    onClick={openAddStoreModal}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={14} /> 新增门店
                </button>
            </div>

            <div className="space-y-4">
                {stores.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs">暂无门店数据，请点击上方按钮添加</div>
                )}
                {stores.map(s => {
                    const regionName = regions.find(r => r.id === s.regionId)?.name || '未知大区';
                    const roomCount = s.rooms?.length || 0;
                    return (
                        <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-3 transition-shadow hover:shadow-md">
                            {/* Store Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-slate-800">{s.name}</h4>
                                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 rounded font-mono">{s.id}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{regionName}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openEditStoreModal(s)}
                                        className="p-1.5 text-blue-500 hover:bg-blue-100 rounded transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteStore(s.id, s.name)}
                                        className="p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Room Grid */}
                            <div className="border-t border-slate-200 pt-3">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">客房列表 ({roomCount})</span>
                                </div>
                                {roomCount > 0 ? (
                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                        {s.rooms.map(room => (
                                            <button 
                                                key={room.number}
                                                onClick={() => openRoomDetail(s.id, room)}
                                                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all hover:shadow-sm active:scale-95 group
                                                    ${room.type === '样板房' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}
                                                `}
                                            >
                                                <div className="relative">
                                                    <BedDouble size={20} className="mb-1 opacity-80 group-hover:opacity-100" />
                                                    {room.type === '样板房' && (
                                                        <Star size={8} className="absolute -top-1 -right-1 text-amber-500 fill-amber-500" />
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold">{room.number}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-xs text-slate-400 italic bg-slate-100/50 rounded-lg border border-dashed border-slate-200">
                                        暂无客房信息，请编辑门店添加房号
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Store Add/Edit Modal */}
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
                                {storeForm.rooms.length > 0 && (
                                    <div className="bg-slate-50 p-2 border-t border-slate-100 text-center">
                                         <p className="text-[10px] text-slate-400">
                                            提示: 点击右上角“添加行”，系统将自动递增上一行的房号
                                        </p>
                                    </div>
                                )}
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

        {/* Room Detail/Edit Modal */}
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
                        {/* Room Number (Read-only for safety/consistency with store list) */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">房间号码</span>
                            <span className="text-sm font-bold text-slate-800">{editingRoom.room.number}</span>
                        </div>

                        {/* Room Type */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">房型选择</label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    editingRoom.room.type === '普通房' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200'
                                }`}>
                                    <input 
                                        type="radio" 
                                        className="hidden" 
                                        checked={editingRoom.room.type === '普通房'} 
                                        onChange={() => setEditingRoom({...editingRoom, room: {...editingRoom.room, type: '普通房'}})} 
                                    />
                                    <BedDouble size={24} className="mb-1" />
                                    <span className="text-xs font-bold">普通房</span>
                                </label>

                                <label className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    editingRoom.room.type === '样板房' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500 hover:border-amber-200'
                                }`}>
                                    <input 
                                        type="radio" 
                                        className="hidden" 
                                        checked={editingRoom.room.type === '样板房'} 
                                        onChange={() => setEditingRoom({...editingRoom, room: {...editingRoom.room, type: '样板房'}})} 
                                    />
                                    <Star size={24} className="mb-1 fill-current" />
                                    <span className="text-xs font-bold">样板房</span>
                                </label>
                            </div>
                        </div>

                        {/* Images Categorized */}
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
                                                {catImages.length === 0 && (
                                                    <div className="col-span-2 flex items-center text-[10px] text-slate-300 italic pl-1">
                                                        暂无图片
                                                    </div>
                                                )}
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
};