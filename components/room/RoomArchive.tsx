import React, { useState, ChangeEvent, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Store as StoreIcon, Plus, Edit2, Trash2, X, Store, BedDouble, Star, Table, Ruler, ArrowLeft, Search, ChevronDown, ChevronRight, Filter, Settings, Check, HelpCircle, Image as ImageIcon, ClipboardList } from 'lucide-react';
import { Store as StoreType, Room, RoomImageCategory, RoomImage, RoomTypeConfig } from '../../types';

const ROOM_MODULES: RoomImageCategory[] = ['玄关', '桌面', '床'];

const EXAMPLE_IMAGES: Record<string, string> = {
    '玄关': 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=600&auto=format&fit=crop',
    '桌面': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=600&auto=format&fit=crop',
    '床': 'https://images.unsplash.com/photo-1505693416388-b0346ef4174d?q=80&w=600&auto=format&fit=crop'
};

export const RoomArchive: React.FC = () => {
  const { regions, stores, addStore, updateStore, removeStore } = useApp();

  // Navigation & Filter State
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // New Search State
  
  // Detail View State
  const [activeRoomTypeName, setActiveRoomTypeName] = useState('');
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  
  // Example Image Modal State
  const [viewingExample, setViewingExample] = useState<{ title: string; url: string } | null>(null);

  // Store Management Modal State
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [storeForm, setStoreForm] = useState<{
      id: string;
      name: string;
      regionId: string;
      rooms: { key: string; number: string }[];
      roomTypes: RoomTypeConfig[];
  }>({
      id: '',
      name: '',
      regionId: '',
      rooms: [],
      roomTypes: []
  });
  const [newRoomTypeName, setNewRoomTypeName] = useState('');

  // Store Room Type Config Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Room Detail Modal State
  const [editingRoom, setEditingRoom] = useState<{ storeId: string; room: Room } | null>(null);

  // Derived State
  const activeStore = stores.find(s => s.id === viewingStoreId);
  
  const filteredStores = stores.filter(s => {
      if (regionFilter && s.regionId !== regionFilter) return false;
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false; // Fuzzy Search Logic
      return true;
  });

  // Sync Active Room Type
  useEffect(() => {
      if (activeStore) {
          const types = activeStore.roomTypeConfigs || [];
          const typeNames = types.map(t => t.name);
          
          if (activeRoomTypeName && !typeNames.includes(activeRoomTypeName)) {
               // Current active type was deleted or invalid, reset to first
               setActiveRoomTypeName(typeNames[0] || '');
          } else if (!activeRoomTypeName && typeNames.length > 0) {
               // Initial load
               setActiveRoomTypeName(typeNames[0]);
          }
      }
  }, [activeStore, activeRoomTypeName]);

  // --- Store Management Logic ---

  const openAddStoreModal = () => {
      setEditingStoreId(null);
      setStoreForm({ 
          id: '', 
          name: '', 
          regionId: '', 
          rooms: [{ key: 'init', number: '' }],
          roomTypes: [{ id: 'rt1', name: '普通房' }, { id: 'rt2', name: '样板房' }] // Defaults
      });
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
            : [{ key: 'init', number: '' }],
          roomTypes: store.roomTypeConfigs ? [...store.roomTypeConfigs] : []
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

  // -- Room Type Config Logic in Modal --
  const addFormRoomType = () => {
      if (!newRoomTypeName.trim()) return;
      setStoreForm(prev => ({
          ...prev,
          roomTypes: [...prev.roomTypes, { id: `rt-${Date.now()}`, name: newRoomTypeName.trim() }]
      }));
      setNewRoomTypeName('');
  };

  const removeFormRoomType = (id: string) => {
      setStoreForm(prev => ({
          ...prev,
          roomTypes: prev.roomTypes.filter(rt => rt.id !== id)
      }));
  };

  const handleStoreSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (storeForm.roomTypes.length === 0) {
          alert('请至少配置一种房型');
          return;
      }

      const inputRoomNumbers = storeForm.rooms.map(r => r.number.trim()).filter(Boolean);
      const uniqueNumbers = Array.from(new Set(inputRoomNumbers)); 
      
      const defaultRoomType = storeForm.roomTypes[0].name;

      const mergeRooms = (currentRooms: Room[] = []): Room[] => {
          return uniqueNumbers.map((num: string) => {
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
              roomTypeConfigs: storeForm.roomTypes,
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
              roomTypeConfigs: storeForm.roomTypes,
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

  // --- Independent Config Modal for Existing Store ---
  const handleOpenConfigModal = () => {
      if (!activeStore) return;
      // Initialize form with current store data just for the room types part
      setStoreForm({
          id: activeStore.id,
          name: activeStore.name,
          regionId: activeStore.regionId,
          rooms: [], // Not needed for this modal
          roomTypes: activeStore.roomTypeConfigs ? [...activeStore.roomTypeConfigs] : []
      });
      setIsConfigModalOpen(true);
  };

  const handleConfigSave = () => {
      if (!activeStore) return;
      if (storeForm.roomTypes.length === 0) {
          alert('请至少保留一种房型');
          return;
      }
      updateStore(activeStore.id, { roomTypeConfigs: storeForm.roomTypes });
      setIsConfigModalOpen(false);
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

  const handleAssignRoom = (roomNumber: string) => {
      if (!activeStore) return;
      const updatedRooms = activeStore.rooms.map(r => 
          r.number === roomNumber ? { ...r, type: activeRoomTypeName } : r
      );
      updateStore(activeStore.id, { rooms: updatedRooms });
      setIsAssignOpen(false);
  };

  // --- Example Image Config Logic ---
  const handleConfigImageUpload = (category: string, e: ChangeEvent<HTMLInputElement>) => {
      if (!activeStore || !activeRoomTypeName) return;
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          
          const updatedTypeConfigs = activeStore.roomTypeConfigs.map(rt => {
              if (rt.name === activeRoomTypeName) {
                  return {
                      ...rt,
                      exampleImages: {
                          ...(rt.exampleImages || {}),
                          [category]: url
                      }
                  };
              }
              return rt;
          });
          
          updateStore(activeStore.id, { roomTypeConfigs: updatedTypeConfigs });
          e.target.value = '';
      }
  };

  const removeConfigImage = (category: string) => {
      if (!activeStore || !activeRoomTypeName) return;
      
      const updatedTypeConfigs = activeStore.roomTypeConfigs.map(rt => {
          if (rt.name === activeRoomTypeName) {
              const newImages = { ...(rt.exampleImages || {}) };
              delete newImages[category];
              return { ...rt, exampleImages: newImages };
          }
          return rt;
      });
      
      updateStore(activeStore.id, { roomTypeConfigs: updatedTypeConfigs });
  };

  const openExample = (moduleName: string) => {
      // 1. Try to get from store config first
      let exampleUrl = null;
      if (activeStore && editingRoom) {
          const roomType = editingRoom.room.type;
          const config = activeStore.roomTypeConfigs.find(rt => rt.name === roomType);
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

  // --- View Switching ---

  if (viewingStoreId && activeStore) {
      // --- Detail View: Store Rooms ---
      const roomCount = activeStore.rooms.length;
      const availableRoomTypes = activeStore.roomTypeConfigs || [];
      const currentRoomTypeConfig = availableRoomTypes.find(rt => rt.name === activeRoomTypeName);
      
      // Filter Logic
      const filteredRooms = activeStore.rooms.filter(room => {
          if (activeRoomTypeName && room.type !== activeRoomTypeName) return false;
          return true;
      });

      // Rooms available to be assigned to the current type (all rooms NOT of current type)
      const assignableRooms = activeStore.rooms.filter(r => r.type !== activeRoomTypeName);

      return (
          <div className="h-full flex flex-col bg-white">
              {/* Sticky Header with Title and Tabs */}
              <div className="sticky top-0 bg-white z-10 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between p-4 pb-2">
                      <div className="flex items-center gap-3">
                          <button 
                              onClick={() => setViewingStoreId(null)}
                              className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                          >
                              <ArrowLeft size={20} />
                          </button>
                          <div>
                              <h2 className="text-base font-bold text-slate-800">{activeStore.name}</h2>
                              <p className="text-xs text-slate-500">共 {roomCount} 间客房</p>
                          </div>
                      </div>
                      <button 
                          onClick={handleOpenConfigModal}
                          className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-1.5 rounded-lg font-bold hover:bg-slate-200"
                      >
                          <Settings size={12} /> 房型配置
                      </button>
                  </div>

                  {/* Room Type Tabs */}
                  <div className="flex px-4 border-b border-slate-100 overflow-x-auto no-scrollbar gap-6">
                      {availableRoomTypes.map(rt => (
                          <button
                              key={rt.id}
                              onClick={() => setActiveRoomTypeName(rt.name)}
                              className={`py-3 text-sm font-bold whitespace-nowrap relative transition-colors ${
                                  activeRoomTypeName === rt.name ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                              }`}
                          >
                              {rt.name}
                              {activeRoomTypeName === rt.name && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                          </button>
                      ))}
                  </div>

                  {/* Action Bar (Assign Room) */}
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center relative z-20">
                      <span className="text-xs text-slate-500 font-bold">本房型: {filteredRooms.length} 间</span>
                      
                      <div className="relative">
                          <button 
                              onClick={() => setIsAssignOpen(!isAssignOpen)}
                              className="flex items-center gap-1 bg-white border border-blue-200 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
                          >
                              <Plus size={12} /> 选择客房进行分配
                          </button>
                          
                          {/* Assignment Dropdown */}
                          {isAssignOpen && (
                              <>
                                  <div className="fixed inset-0 z-10" onClick={() => setIsAssignOpen(false)}></div>
                                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-20 max-h-60 overflow-y-auto animate-scaleIn origin-top-right">
                                      <div className="p-2.5 text-[10px] text-slate-400 font-bold bg-slate-50 border-b border-slate-100 sticky top-0 uppercase">
                                          选择客房移动至「{activeRoomTypeName}」
                                      </div>
                                      {assignableRooms.length > 0 ? (
                                          <div className="divide-y divide-slate-50">
                                              {assignableRooms.map(r => (
                                                  <button
                                                      key={r.number}
                                                      onClick={() => handleAssignRoom(r.number)}
                                                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-blue-50 flex justify-between items-center transition-colors"
                                                  >
                                                      <span className="font-bold">{r.number}</span>
                                                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{r.type}</span>
                                                  </button>
                                              ))}
                                          </div>
                                      ) : (
                                          <div className="p-4 text-center text-xs text-slate-400">无可分配客房</div>
                                      )}
                                  </div>
                              </>
                          )}
                      </div>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 pb-20">
                  <div className="p-4">
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
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <BedDouble size={40} className="mb-2 opacity-20" />
                            <p className="text-sm">该房型下暂无客房</p>
                        </div>
                    )}
                  </div>

                  {/* Config Section for Schematic Diagrams */}
                  <div className="px-4 pb-4">
                      <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1 uppercase">
                          <ImageIcon size={12} /> 
                          「{activeRoomTypeName}」标准示意图配置
                      </h3>
                      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                          <div className="grid grid-cols-3 gap-3">
                              {ROOM_MODULES.map(moduleName => {
                                  const existingImage = currentRoomTypeConfig?.exampleImages?.[moduleName];
                                  
                                  return (
                                      <div key={moduleName} className="flex flex-col gap-2">
                                          <div className="text-[10px] font-bold text-slate-600 text-center">{moduleName}</div>
                                          {existingImage ? (
                                              <div className="aspect-square rounded-lg border border-slate-200 relative group overflow-hidden bg-slate-50">
                                                  <img src={existingImage} alt={`${moduleName} example`} className="w-full h-full object-cover" />
                                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                      <div className="relative cursor-pointer">
                                                          <Edit2 size={16} className="text-white" />
                                                          <input type="file" accept="image/*" onChange={(e) => handleConfigImageUpload(moduleName, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                      </div>
                                                      <button onClick={() => removeConfigImage(moduleName)} className="text-white hover:text-red-400">
                                                          <Trash2 size={16} />
                                                      </button>
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group">
                                                  <input type="file" accept="image/*" onChange={(e) => handleConfigImageUpload(moduleName, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                  <Plus size={20} className="text-slate-300 group-hover:text-blue-400 mb-1" />
                                                  <span className="text-[9px] text-slate-400 font-bold group-hover:text-blue-500">上传</span>
                                              </div>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Room Detail Page (Full Screen) */}
              {editingRoom && (
                  <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slideInRight">
                      {/* Header */}
                      <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center flex-shrink-0 shadow-sm">
                          <h3 className="font-bold text-slate-800 flex items-center gap-2">
                              <BedDouble size={20} className="text-blue-600" />
                              客房详情 - {editingRoom.room.number}
                          </h3>
                          <button onClick={() => setEditingRoom(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20} className="text-slate-500" /></button>
                      </div>
                      
                      <div className="p-5 space-y-6 overflow-y-auto flex-1 bg-slate-50">
                          {/* Room Type */}
                          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><Store size={12} /> 房型选择</label>
                              <div className="grid grid-cols-2 gap-3">
                                  {availableRoomTypes.map(rt => {
                                      const isSelected = editingRoom.room.type === rt.name;
                                      const isSample = rt.name === '样板房'; 
                                      
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

                          {/* Room Modules - Images & Measurements */}
                          <div className="space-y-4">
                              <label className="block text-xs font-bold text-slate-500 uppercase px-1">模块详情</label>
                              {ROOM_MODULES.map(category => {
                                  const measurement = editingRoom.room.measurements?.find(m => m.category === category);
                                  
                                  // ONLY Show modules if measurement is approved.
                                  // BUT the user wants to see images if approved.
                                  // If there is no measurement, or not approved, we should check if we should hide it.
                                  // However, RoomArchive is primarily for viewing existing data.
                                  // If a measurement is in progress (pending/rejected), it shouldn't be "Filed" yet.
                                  // So we only show if status === 'approved'.
                                  
                                  if (!measurement || measurement.status !== 'approved') return null;

                                  const catImages = editingRoom.room.images?.filter(img => img.category === category) || [];
                                  
                                  return (
                                      <div key={category} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50">
                                              <div className="flex items-center gap-2">
                                                  <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                                                  <span className="text-sm font-bold text-slate-800">{category}</span>
                                              </div>
                                              <button 
                                                onClick={() => openExample(category)}
                                                className="flex items-center gap-1 text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 font-bold"
                                              >
                                                  <HelpCircle size={10} /> 示例
                                              </button>
                                          </div>

                                          {/* Measurement Evaluation Info */}
                                          <div className="mb-4">
                                               <div className={`p-3 rounded-lg border flex flex-col gap-1 ${
                                                   measurement.type === '特殊安装' ? 'bg-orange-50 border-orange-100 text-orange-800' : 'bg-green-50 border-green-100 text-green-800'
                                               }`}>
                                                   <div className="flex items-center gap-2">
                                                       <ClipboardList size={14} />
                                                       <span className="text-xs font-bold">复尺评估: {measurement.type}</span>
                                                   </div>
                                                   {measurement.remark && (
                                                       <p className="text-[10px] opacity-80 pl-5">{measurement.remark}</p>
                                                   )}
                                               </div>
                                          </div>

                                          {/* Images (Read-only in Archive view mostly, but here allow edit since it's "Room Detail") 
                                              Actually, prompt says "If agreed... update to Store Filing page". 
                                              It implies this page is the destination. 
                                              Let's show images here.
                                          */}
                                          <div>
                                              <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase">现场照片</p>
                                              <div className="grid grid-cols-4 gap-2">
                                                  {catImages.map((img, idx) => (
                                                      <div key={idx} className="aspect-square rounded-lg border border-slate-200 relative group overflow-hidden bg-slate-100">
                                                          <img src={img.url} alt={`room-${category}-${idx}`} className="w-full h-full object-cover" />
                                                      </div>
                                                  ))}
                                                  {catImages.length === 0 && <span className="text-xs text-slate-400 col-span-4 italic">暂无照片</span>}
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                              {(!editingRoom.room.measurements || !editingRoom.room.measurements.some(m => m.status === 'approved')) && (
                                  <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-xl border border-dashed">
                                      暂无已归档的复尺数据
                                  </div>
                              )}
                          </div>
                      </div>
                      
                      <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
                          <button 
                              onClick={handleRoomSave}
                              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                              保存信息
                          </button>
                      </div>
                  </div>
              )}

              {/* Independent Config Modal */}
              {isConfigModalOpen && (
                 <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-scaleIn">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Settings size={20} className="text-blue-600" />
                                房型配置 - {activeStore.name}
                            </h3>
                            <button onClick={() => setIsConfigModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="p-5 flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">房型列表</label>
                            <div className="flex gap-2 mb-3">
                                <input 
                                    type="text" 
                                    placeholder="输入房型名称"
                                    className="flex-1 border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newRoomTypeName}
                                    onChange={e => setNewRoomTypeName(e.target.value)}
                                />
                                <button onClick={addFormRoomType} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"><Plus size={16}/></button>
                            </div>
                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-60 overflow-y-auto">
                                <ul className="divide-y divide-slate-100">
                                    {storeForm.roomTypes.map(rt => (
                                        <li key={rt.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                                            <span className="text-sm font-medium text-slate-700">{rt.name}</span>
                                            <button onClick={() => removeFormRoomType(rt.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                        </li>
                                    ))}
                                    {storeForm.roomTypes.length === 0 && (
                                        <li className="p-4 text-center text-xs text-slate-400">请至少添加一种房型</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button onClick={handleConfigSave} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                                保存配置
                            </button>
                        </div>
                    </div>
                 </div>
              )}

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

            {/* 1.2 Search & Filter Bar */}
            <div className="space-y-2">
                {/* Search Bar */}
                <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="搜索门店名称..."
                            className="w-full bg-slate-50 border-none rounded-lg py-2 pl-9 pr-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
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
                        onClick={() => { 
                            setViewingStoreId(s.id); 
                            const initialType = s.roomTypeConfigs?.[0]?.name || '';
                            setActiveRoomTypeName(initialType);
                        }}
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
                        
                        {/* Room Type Config Section */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">房型设置 *</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="text" 
                                    placeholder="输入房型名称"
                                    className="flex-1 border border-slate-200 rounded p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newRoomTypeName}
                                    onChange={e => setNewRoomTypeName(e.target.value)}
                                />
                                <button type="button" onClick={addFormRoomType} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 text-xs font-bold">添加</button>
                            </div>
                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 max-h-32 overflow-y-auto">
                                <ul className="divide-y divide-slate-100">
                                    {storeForm.roomTypes.map(rt => (
                                        <li key={rt.id} className="p-2 flex justify-between items-center hover:bg-white text-xs">
                                            <span className="font-bold text-slate-700">{rt.name}</span>
                                            <button type="button" onClick={() => removeFormRoomType(rt.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                        </li>
                                    ))}
                                    {storeForm.roomTypes.length === 0 && (
                                        <li className="p-3 text-center text-xs text-red-400">请添加至少一种房型</li>
                                    )}
                                </ul>
                            </div>
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