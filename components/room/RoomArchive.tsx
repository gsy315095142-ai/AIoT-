import React, { useState, ChangeEvent, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Store as StoreIcon, Plus, Edit2, Trash2, X, Store, BedDouble, Table, Ruler, ArrowLeft, Search, ChevronDown, ChevronRight, Settings, Check, HelpCircle, Image as ImageIcon, ClipboardList, Hammer, ListChecks } from 'lucide-react';
import { Store as StoreType, Room, RoomImageCategory, RoomImage, RoomTypeConfig, ChecklistParam, ChecklistParamType, ModuleType } from '../../types';

const DEFAULT_MODULES: RoomImageCategory[] = [
    '地投环境',
    '桌显桌子形状尺寸',
    '床头背景墙尺寸',
    '桌显处墙面宽高',
    '浴室镜面形状和尺寸',
    '电视墙到床尾距离',
    '照片墙处墙面宽高',
    '玩乐活动区域长宽'
];

const EXAMPLE_IMAGES: Record<string, string> = {
    '地投环境': 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=600&auto=format&fit=crop',
    '桌显桌子形状尺寸': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=600&auto=format&fit=crop',
    '床头背景墙尺寸': 'https://images.unsplash.com/photo-1505693416388-b0346ef4174d?q=80&w=600&auto=format&fit=crop',
    '桌显处墙面宽高': 'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=600&auto=format&fit=crop',
    '浴室镜面形状和尺寸': 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=600&auto=format&fit=crop',
    '电视墙到床尾距离': 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=600&auto=format&fit=crop',
    '照片墙处墙面宽高': 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600&auto=format&fit=crop',
    '玩乐活动区域长宽': 'https://images.unsplash.com/photo-1596178065887-1198b6148b2e?q=80&w=600&auto=format&fit=crop'
};

export const RoomArchive: React.FC = () => {
  const { regions, stores, addStore, updateStore, removeStore } = useApp();

  // Navigation & Filter State
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detail View State
  const [activeRoomTypeName, setActiveRoomTypeName] = useState('');
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  
  // Example Image Modal State
  const [viewingExample, setViewingExample] = useState<{ title: string; url: string } | null>(null);

  // Checklist Config State
  const [addingChecklistToCategory, setAddingChecklistToCategory] = useState<string | null>(null);
  const [newChecklistLabel, setNewChecklistLabel] = useState('');
  const [newChecklistType, setNewChecklistType] = useState<ChecklistParamType>('text');

  // Module Management State
  const [newModuleInput, setNewModuleInput] = useState('');
  const [editingModule, setEditingModule] = useState<{ oldName: string; newName: string } | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [activeModuleTab, setActiveModuleTab] = useState<ModuleType>('measurement');

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
  
  // Store Module Config Modal (New - Full Page)
  const [isModuleConfigModalOpen, setIsModuleConfigModalOpen] = useState(false);

  // Room Detail Modal State
  const [editingRoom, setEditingRoom] = useState<{ storeId: string; room: Room } | null>(null);

  // Derived State
  const activeStore = stores.find(s => s.id === viewingStoreId);
  
  const filteredStores = stores.filter(s => {
      if (regionFilter && s.regionId !== regionFilter) return false;
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false; 
      return true;
  });

  // Sync Active Room Type
  useEffect(() => {
      if (activeStore) {
          const types = activeStore.roomTypeConfigs || [];
          const typeNames = types.map(t => t.name);
          
          if (activeRoomTypeName && !typeNames.includes(activeRoomTypeName)) {
               setActiveRoomTypeName(typeNames[0] || '');
          } else if (!activeRoomTypeName && typeNames.length > 0) {
               setActiveRoomTypeName(typeNames[0]);
          }
      }
  }, [activeStore, activeRoomTypeName]);

  // --- Module Management Handlers (Store Level) ---

  const handleAddModule = () => {
      if (!activeStore || !newModuleInput.trim()) return;
      
      const currentConfig = activeStore.moduleConfig;
      if (currentConfig.activeModules.includes(newModuleInput.trim())) {
          alert('该模块名称已存在');
          return;
      }

      const newModules = [...currentConfig.activeModules, newModuleInput.trim()];
      const newModuleTypes = { ...currentConfig.moduleTypes, [newModuleInput.trim()]: activeModuleTab };

      updateStore(activeStore.id, {
          moduleConfig: {
              ...currentConfig,
              activeModules: newModules,
              moduleTypes: newModuleTypes
          }
      });
      
      setNewModuleInput('');
      setIsAddingModule(false);
  };

  const handleDeleteModule = (moduleName: string) => {
      if (!activeStore) return;
      if (!window.confirm(`确定要删除模块 "${moduleName}" 吗？所有房型的相关测量数据将保留但不可见，配置数据将被移除。`)) return;

      const currentConfig = activeStore.moduleConfig;
      const newModules = currentConfig.activeModules.filter(m => m !== moduleName);
      
      // Also clean up configs
      const newExampleImages = { ...currentConfig.exampleImages };
      delete newExampleImages[moduleName];
      const newExampleRequirements = { ...currentConfig.exampleRequirements };
      delete newExampleRequirements[moduleName];
      const newChecklistConfigs = { ...currentConfig.checklistConfigs };
      delete newChecklistConfigs[moduleName];
      const newModuleTypes = { ...currentConfig.moduleTypes };
      delete newModuleTypes[moduleName];

      updateStore(activeStore.id, {
          moduleConfig: {
              activeModules: newModules,
              moduleTypes: newModuleTypes,
              exampleImages: newExampleImages,
              exampleRequirements: newExampleRequirements,
              checklistConfigs: newChecklistConfigs
          }
      });
  };

  const handleRenameModule = () => {
      if (!activeStore || !editingModule || !editingModule.newName.trim()) return;
      const { oldName, newName } = editingModule;
      if (oldName === newName) { setEditingModule(null); return; }

      const currentConfig = activeStore.moduleConfig;
      if (currentConfig.activeModules.includes(newName)) {
          alert('该模块名称已存在');
          return;
      }

      // 1. Update Config Keys
      const newModules = currentConfig.activeModules.map(m => m === oldName ? newName : m);
      
      const newModuleTypes = { ...currentConfig.moduleTypes };
      if (newModuleTypes[oldName]) { newModuleTypes[newName] = newModuleTypes[oldName]; delete newModuleTypes[oldName]; }

      const newExampleImages = { ...currentConfig.exampleImages };
      if (newExampleImages[oldName]) { newExampleImages[newName] = newExampleImages[oldName]; delete newExampleImages[oldName]; }
      
      const newRequirements = { ...currentConfig.exampleRequirements };
      if (newRequirements[oldName]) { newRequirements[newName] = newRequirements[oldName]; delete newRequirements[oldName]; }
      
      const newChecklistConfigs = { ...currentConfig.checklistConfigs };
      if (newChecklistConfigs[oldName]) { newChecklistConfigs[newName] = newChecklistConfigs[oldName]; delete newChecklistConfigs[oldName]; }

      // 2. Migrate Data in RoomTypes (Update category name in measurements and images)
      const updatedRoomTypeConfigs = activeStore.roomTypeConfigs.map(rt => {
          const newImages = (rt.images || []).map(img => 
              img.category === oldName ? { ...img, category: newName } : img
          );
          const newMeasurements = (rt.measurements || []).map(m => 
              m.category === oldName ? { ...m, category: newName } : m
          );
          return { ...rt, images: newImages, measurements: newMeasurements };
      });

      updateStore(activeStore.id, {
          moduleConfig: {
              activeModules: newModules,
              moduleTypes: newModuleTypes,
              exampleImages: newExampleImages,
              exampleRequirements: newRequirements,
              checklistConfigs: newChecklistConfigs
          },
          roomTypeConfigs: updatedRoomTypeConfigs
      });

      setEditingModule(null);
  };

  // --- Config Image/Req/Checklist Handlers (Store Level) ---

  const handleConfigImageUpload = (category: string, e: ChangeEvent<HTMLInputElement>) => {
      if (!activeStore) return;
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const currentConfig = activeStore.moduleConfig;
          updateStore(activeStore.id, {
              moduleConfig: {
                  ...currentConfig,
                  exampleImages: { ...currentConfig.exampleImages, [category]: url }
              }
          });
          e.target.value = '';
      }
  };

  const removeConfigImage = (category: string) => {
      if (!activeStore) return;
      const currentConfig = activeStore.moduleConfig;
      const newImages = { ...currentConfig.exampleImages };
      delete newImages[category];
      updateStore(activeStore.id, {
          moduleConfig: { ...currentConfig, exampleImages: newImages }
      });
  };

  const handleConfigRequirementChange = (category: string, value: string) => {
      if (!activeStore) return;
      const currentConfig = activeStore.moduleConfig;
      updateStore(activeStore.id, {
          moduleConfig: {
              ...currentConfig,
              exampleRequirements: { ...currentConfig.exampleRequirements, [category]: value }
          }
      });
  };

  const handleAddChecklistParam = (category: string) => {
      if (!activeStore || !newChecklistLabel.trim()) return;
      const currentConfig = activeStore.moduleConfig;
      const currentParams = currentConfig.checklistConfigs[category] || [];
      const newParam: ChecklistParam = {
          id: `cp-${Date.now()}`,
          label: newChecklistLabel.trim(),
          type: newChecklistType
      };
      
      updateStore(activeStore.id, {
          moduleConfig: {
              ...currentConfig,
              checklistConfigs: {
                  ...currentConfig.checklistConfigs,
                  [category]: [...currentParams, newParam]
              }
          }
      });
      setNewChecklistLabel('');
      setAddingChecklistToCategory(null);
  };

  const handleRemoveChecklistParam = (category: string, paramId: string) => {
      if (!activeStore) return;
      const currentConfig = activeStore.moduleConfig;
      const currentParams = currentConfig.checklistConfigs[category] || [];
      
      updateStore(activeStore.id, {
          moduleConfig: {
              ...currentConfig,
              checklistConfigs: {
                  ...currentConfig.checklistConfigs,
                  [category]: currentParams.filter(p => p.id !== paramId)
              }
          }
      });
  };

  // --- Store Management Logic ---

  const openAddStoreModal = () => {
      setEditingStoreId(null);
      setStoreForm({ 
          id: '', 
          name: '', 
          regionId: '', 
          rooms: [{ key: 'init', number: '' }],
          roomTypes: [{ id: 'rt1', name: '普通房', images: [], measurements: [] }, { id: 'rt2', name: '样板房', images: [], measurements: [] }]
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

  const addFormRoomType = () => {
      if (!newRoomTypeName.trim()) return;
      setStoreForm(prev => ({
          ...prev,
          roomTypes: [...prev.roomTypes, { id: `rt-${Date.now()}`, name: newRoomTypeName.trim(), images: [], measurements: [] }]
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
              rooms: mergeRooms([]),
              moduleConfig: { activeModules: [], moduleTypes: {}, exampleImages: {}, exampleRequirements: {}, checklistConfigs: {} } // Will be handled by addStore defaults usually
          });
      }
      setIsStoreModalOpen(false);
  };

  const handleDeleteStore = (id: string, name: string) => {
      if (window.confirm(`确定要删除门店 "${name}" 吗？此操作不可恢复。`)) {
          removeStore(id);
      }
  };

  const handleOpenConfigModal = () => {
      if (!activeStore) return;
      setStoreForm({
          id: activeStore.id,
          name: activeStore.name,
          regionId: activeStore.regionId,
          rooms: [],
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

  const openExample = (moduleName: string) => {
      let exampleUrl = activeStore?.moduleConfig.exampleImages?.[moduleName] || EXAMPLE_IMAGES[moduleName];
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
      
      const activeModules = activeStore.moduleConfig.activeModules || DEFAULT_MODULES;
      const measurementModules = activeModules.filter(m => (activeStore.moduleConfig.moduleTypes?.[m] || 'measurement') === 'measurement');
      
      const filteredRooms = activeStore.rooms.filter(room => {
          if (activeRoomTypeName && room.type !== activeRoomTypeName) return false;
          return true;
      });

      const assignableRooms = activeStore.rooms.filter(r => r.type !== activeRoomTypeName);

      return (
          <div className="h-full flex flex-col bg-white">
              {/* Header */}
              <div className="sticky top-0 bg-white z-10 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between p-4 pb-2">
                      <div className="flex items-center gap-3">
                          <button onClick={() => setViewingStoreId(null)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                              <ArrowLeft size={20} />
                          </button>
                          <div>
                              <h2 className="text-base font-bold text-slate-800">{activeStore.name}</h2>
                              <p className="text-xs text-slate-500">共 {roomCount} 间客房</p>
                          </div>
                      </div>
                      <div className="flex flex-col gap-1">
                          <button onClick={handleOpenConfigModal} className="flex items-center justify-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-1.5 rounded-lg font-bold hover:bg-slate-200 min-w-[70px]">
                              <Settings size={12} /> 房型配置
                          </button>
                          <button onClick={() => setIsModuleConfigModalOpen(true)} className="flex items-center justify-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1.5 rounded-lg font-bold hover:bg-blue-100 min-w-[70px]">
                              <ListChecks size={12} /> 模块配置
                          </button>
                      </div>
                  </div>

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
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 pb-20 p-4 space-y-4">
                  
                  {/* Module 1: Measurement Info - NOW READS FROM ROOM TYPE CONFIG */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                      <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1 uppercase">
                          <Ruler size={14} className="text-blue-500" /> 
                          【复尺模块】
                      </h3>
                      <div className="space-y-4">
                          {currentRoomTypeConfig ? (
                              measurementModules.map(moduleName => {
                                  // Data Source: Room Type Config
                                  const measurement = currentRoomTypeConfig.measurements?.find(m => m.category === moduleName);
                                  const catImages = currentRoomTypeConfig.images?.filter(img => img.category === moduleName) || [];
                                  
                                  if (!measurement || measurement.status !== 'approved') return null;

                                  return (
                                      <div key={moduleName} className="border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                                          <div className="flex items-center gap-2 mb-2">
                                              <span className="text-xs font-bold text-slate-800">{moduleName}</span>
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${measurement.type === '特殊安装' ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                                                  {measurement.type}
                                              </span>
                                          </div>
                                          {measurement.remark && <p className="text-[10px] text-slate-500 mb-2">{measurement.remark}</p>}
                                          <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                              {catImages.map((img, idx) => (
                                                  <div key={idx} className="w-12 h-12 rounded border border-slate-200 flex-shrink-0 overflow-hidden">
                                                      <img src={img.url} alt="measure" className="w-full h-full object-cover" />
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  );
                              })
                          ) : null}
                          {(!currentRoomTypeConfig?.measurements?.some(m => m.status === 'approved')) && (
                              <div className="text-center py-4 text-xs text-slate-400 border border-dashed rounded-lg bg-slate-50">暂无已归档的复尺信息</div>
                          )}
                      </div>
                  </div>

                  {/* Module 3: Rooms */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase">
                                <BedDouble size={14} className="text-purple-500" /> 
                                【客房模块】 ({filteredRooms.length})
                            </h3>
                            <div className="relative">
                                <button 
                                    onClick={() => setIsAssignOpen(!isAssignOpen)}
                                    className="flex items-center gap-1 bg-white border border-blue-200 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
                                >
                                    <Plus size={10} /> 选择客房进行分配
                                </button>
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

                        {filteredRooms.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {filteredRooms.map(room => (
                                    <button 
                                        key={room.number}
                                        onClick={() => openRoomDetail(activeStore.id, room)}
                                        className="aspect-square flex flex-col items-center justify-center p-2 rounded-xl border bg-slate-50 shadow-sm hover:border-blue-400 hover:text-blue-600 text-slate-600 transition-all"
                                    >
                                        <div className="text-xl font-bold">{room.number}</div>
                                        <div className="text-[9px] text-slate-400 mt-1">{room.type}</div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-20 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-xs">该房型下暂无客房</p>
                            </div>
                        )}
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
                          {/* Room Modules - SHOWING INSTALLATION DATA ONLY IF APPROVED */}
                          <div className="space-y-4">
                              <label className="block text-xs font-bold text-slate-500 uppercase px-1">安装归档详情</label>
                              {(() => {
                                  // Check if Installation Progress is Approved
                                  const isInstallationApproved = activeStore.installation?.status === 'approved';
                                  
                                  if (!isInstallationApproved) {
                                      return (
                                          <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-xl border border-dashed">
                                              客房安装进度尚未审核通过，暂无归档数据
                                          </div>
                                      );
                                  }

                                  // Find the '安装' Node
                                  const installNode = activeStore.installation?.nodes.find(n => n.name === '安装');
                                  const roomInstallData = installNode?.data?.[editingRoom.room.number];

                                  if (!roomInstallData) {
                                       return (
                                          <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-xl border border-dashed">
                                              该客房暂无安装图片数据
                                          </div>
                                      );
                                  }

                                  // Filter active modules to show only installation modules
                                  const installationModules = activeStore.moduleConfig.activeModules.filter(m => activeStore.moduleConfig.moduleTypes?.[m] === 'installation');

                                  return (
                                      <>
                                        {installationModules.length > 0 ? installationModules.map(category => {
                                            const catImages: string[] = roomInstallData[category] || [];
                                            return (
                                                <div key={category} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
                                                        <Hammer size={14} className="text-blue-500" />
                                                        <span className="text-sm font-bold text-slate-800">{category} (安装现场)</span>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {catImages.map((url, idx) => (
                                                            <div key={idx} className="aspect-square rounded-lg border border-slate-200 relative group overflow-hidden bg-slate-100">
                                                                <img src={url} alt={`install-${category}-${idx}`} className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                        {catImages.length === 0 && <span className="text-xs text-slate-400 col-span-4 italic">暂无照片</span>}
                                                    </div>
                                                </div>
                                            );
                                        }) : <div className="text-center text-slate-400 text-xs p-4">暂无配置安装类模块</div>}
                                      </>
                                  );
                              })()}
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

              {/* Module Config Page (Full Screen Overlay) */}
              {isModuleConfigModalOpen && (
                  <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-slideInRight">
                      <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center flex-shrink-0 shadow-sm">
                          <h3 className="font-bold text-slate-800 flex items-center gap-2">
                              <ListChecks size={20} className="text-blue-600" />
                              模块配置 - {activeStore.name}
                          </h3>
                          <button onClick={() => setIsModuleConfigModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} className="text-slate-500" /></button>
                      </div>
                      
                      <div className="flex bg-slate-100 p-1 mx-4 mt-4 rounded-lg flex-shrink-0">
                          <button 
                              onClick={() => setActiveModuleTab('measurement')}
                              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeModuleTab === 'measurement' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              复尺类模块
                          </button>
                          <button 
                              onClick={() => setActiveModuleTab('installation')}
                              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeModuleTab === 'installation' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                              安装类模块
                          </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 bg-white">
                          <div className="flex justify-between items-center mb-4">
                              <div className="text-xs text-slate-400">
                                  {activeModuleTab === 'measurement' ? '复尺类模块需配置图片、备注及清单，将同步至复尺页面。' : '安装类模块只需配置图片，将同步至安装页面。'}
                              </div>
                              
                              {!isAddingModule ? (
                                  <button 
                                    onClick={() => setIsAddingModule(true)} 
                                    className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 font-bold transition-colors"
                                  >
                                      <Plus size={12} /> 添加模块
                                  </button>
                              ) : (
                                  <div className="flex gap-2 animate-fadeIn">
                                      <input 
                                        autoFocus
                                        className="border border-blue-200 rounded px-2 py-1 text-xs outline-none w-32 focus:ring-1 focus:ring-blue-500"
                                        placeholder="输入模块名称"
                                        value={newModuleInput}
                                        onChange={(e) => setNewModuleInput(e.target.value)}
                                      />
                                      <button onClick={handleAddModule} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">确定</button>
                                      <button onClick={() => { setIsAddingModule(false); setNewModuleInput(''); }} className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-300">取消</button>
                                  </div>
                              )}
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4 pb-10">
                              {activeStore.moduleConfig.activeModules
                                .filter(m => (activeStore.moduleConfig.moduleTypes?.[m] || 'measurement') === activeModuleTab)
                                .map(moduleName => {
                                  const existingImage = activeStore.moduleConfig.exampleImages[moduleName];
                                  const existingRequirement = activeStore.moduleConfig.exampleRequirements[moduleName] || '';
                                  const checklistParams = activeStore.moduleConfig.checklistConfigs[moduleName] || [];
                                  const isAddingChecklist = addingChecklistToCategory === moduleName;
                                  const isEditingName = editingModule?.oldName === moduleName;
                                  
                                  return (
                                      <div key={moduleName} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 relative group/module animate-fadeIn">
                                          {/* Module Name Header & Controls */}
                                          <div className="w-24 shrink-0 flex flex-col gap-2 items-center">
                                              {existingImage ? (
                                                  <div className="aspect-square w-full rounded-lg border border-slate-200 relative group overflow-hidden bg-white">
                                                      <img src={existingImage} alt={`${moduleName} example`} className="w-full h-full object-cover" />
                                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                          <div className="relative cursor-pointer bg-white/20 p-1 rounded hover:bg-white/40">
                                                              <Edit2 size={14} className="text-white" />
                                                              <input type="file" accept="image/*" onChange={(e) => handleConfigImageUpload(moduleName, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                          </div>
                                                          <button onClick={() => removeConfigImage(moduleName)} className="text-white hover:text-red-400 bg-white/20 p-1 rounded hover:bg-white/40">
                                                              <Trash2 size={14} />
                                                          </button>
                                                      </div>
                                                  </div>
                                              ) : (
                                                  <div className="aspect-square w-full border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-colors cursor-pointer relative group">
                                                          <input type="file" accept="image/*" onChange={(e) => handleConfigImageUpload(moduleName, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                          <Plus size={20} className="text-slate-300 group-hover:text-blue-400 mb-1" />
                                                          <span className="text-[10px] text-slate-400 font-bold group-hover:text-blue-500">上传示例</span>
                                                  </div>
                                              )}
                                              
                                              {isEditingName ? (
                                                  <div className="flex flex-col gap-1 w-full animate-fadeIn">
                                                      <input 
                                                        autoFocus
                                                        className="w-full text-[10px] border border-blue-300 rounded px-1 py-0.5 text-center outline-none bg-white"
                                                        value={editingModule?.newName}
                                                        onChange={(e) => setEditingModule(prev => prev ? ({ ...prev, newName: e.target.value }) : null)}
                                                      />
                                                      <div className="flex justify-center gap-1">
                                                          <button onClick={handleRenameModule} className="bg-green-100 text-green-600 p-0.5 rounded hover:bg-green-200"><Check size={12} /></button>
                                                          <button onClick={() => setEditingModule(null)} className="bg-red-100 text-red-600 p-0.5 rounded hover:bg-red-200"><X size={12} /></button>
                                                      </div>
                                                  </div>
                                              ) : (
                                                  <div className="w-full text-center relative">
                                                      <div className="text-[10px] font-bold text-slate-700 truncate px-1 cursor-default mb-1" title={moduleName}>{moduleName}</div>
                                                      <div className="flex justify-center gap-2">
                                                          <button onClick={() => setEditingModule({ oldName: moduleName, newName: moduleName })} className="text-slate-400 hover:text-blue-500"><Edit2 size={12} /></button>
                                                          <button onClick={() => handleDeleteModule(moduleName)} className="text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>

                                          {/* Requirement & Checklist Config (Only for Measurement Modules) */}
                                          {activeModuleTab === 'measurement' ? (
                                              <div className="flex-1 flex flex-col gap-3 min-w-0">
                                                  {/* Text Requirement */}
                                                  <div className="flex flex-col">
                                                      <label className="text-[9px] text-slate-400 font-bold uppercase mb-1">拍摄需求 / 备注</label>
                                                      <textarea 
                                                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-none text-slate-700 placeholder-slate-300 h-16"
                                                          placeholder="请输入此模块的拍照或复尺需求..."
                                                          value={existingRequirement}
                                                          onChange={(e) => handleConfigRequirementChange(moduleName, e.target.value)}
                                                      />
                                                  </div>

                                                  {/* Checklist Config */}
                                                  <div className="flex flex-col">
                                                      <div className="flex justify-between items-center mb-1">
                                                          <label className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                              <ListChecks size={10} /> 必填清单参数
                                                          </label>
                                                          {!isAddingChecklist && (
                                                              <button 
                                                                  onClick={() => { setAddingChecklistToCategory(moduleName); setNewChecklistLabel(''); }}
                                                                  className="text-[9px] text-blue-500 bg-white border border-blue-100 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                                                              >
                                                                  + 添加参数
                                                              </button>
                                                          )}
                                                      </div>
                                                      
                                                      {/* Checklist Items */}
                                                      {checklistParams.length > 0 && (
                                                          <div className="bg-white rounded border border-slate-200 divide-y divide-slate-100 mb-1">
                                                              {checklistParams.map(param => (
                                                                  <div key={param.id} className="flex justify-between items-center p-1.5 text-xs">
                                                                      <div className="flex items-center gap-2 overflow-hidden">
                                                                          <span className="font-medium text-slate-700 truncate">{param.label}</span>
                                                                          <span className="text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-1 rounded">{param.type === 'text' ? '填空' : '判断'}</span>
                                                                      </div>
                                                                      <button onClick={() => handleRemoveChecklistParam(moduleName, param.id)} className="text-slate-300 hover:text-red-500">
                                                                          <X size={12} />
                                                                      </button>
                                                                  </div>
                                                              ))}
                                                          </div>
                                                      )}

                                                      {/* Add New Checklist Form */}
                                                      {isAddingChecklist && (
                                                          <div className="bg-blue-50 p-2 rounded border border-blue-100 animate-fadeIn">
                                                              <div className="flex gap-2 mb-2">
                                                                  <input 
                                                                      autoFocus
                                                                      type="text" 
                                                                      className="flex-1 text-xs border border-blue-200 rounded px-2 py-1 outline-none"
                                                                      placeholder="参数名称 (如: 墙面宽度)"
                                                                      value={newChecklistLabel}
                                                                      onChange={e => setNewChecklistLabel(e.target.value)}
                                                                  />
                                                                  <select 
                                                                      className="text-xs border border-blue-200 rounded px-1 outline-none bg-white w-20"
                                                                      value={newChecklistType}
                                                                      onChange={e => setNewChecklistType(e.target.value as ChecklistParamType)}
                                                                  >
                                                                      <option value="text">填空</option>
                                                                      <option value="boolean">判断</option>
                                                                  </select>
                                                              </div>
                                                              <div className="flex gap-2 justify-end">
                                                                  <button onClick={() => setAddingChecklistToCategory(null)} className="text-[10px] text-slate-500 hover:text-slate-700">取消</button>
                                                                  <button onClick={() => handleAddChecklistParam(moduleName)} className="text-[10px] bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">确认</button>
                                                              </div>
                                                          </div>
                                                      )}
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="flex-1 flex flex-col justify-center items-center text-slate-300 text-xs italic border-l border-slate-100 ml-2 pl-4">
                                                  <ImageIcon size={24} className="mb-2 opacity-50" />
                                                  安装类模块仅需配置示例图
                                              </div>
                                          )}
                                      </div>
                                  );
                              })}
                              {activeStore.moduleConfig.activeModules.filter(m => (activeStore.moduleConfig.moduleTypes?.[m] || 'measurement') === activeModuleTab).length === 0 && (
                                  <div className="text-center py-10 text-slate-400 text-xs border border-dashed rounded-xl">
                                      暂无{activeModuleTab === 'measurement' ? '复尺' : '安装'}类模块，请点击右上角添加
                                  </div>
                              )}
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
                
                // Calculate Progress
                // Measurement
                const measureConfigs = s.roomTypeConfigs || [];
                const activeModules = s.moduleConfig.activeModules || DEFAULT_MODULES;
                // Filter only measurement modules for progress
                const measurementModules = activeModules.filter(m => (s.moduleConfig.moduleTypes?.[m] || 'measurement') === 'measurement');
                
                const completedMeasureCount = measureConfigs.filter(config => {
                    const approvedCount = config.measurements?.filter(m => m.status === 'approved' && measurementModules.includes(m.category)).length || 0;
                    return approvedCount >= measurementModules.length;
                }).length;
                const measureProgress = measureConfigs.length > 0 ? Math.round((completedMeasureCount / measureConfigs.length) * 100) : 0;

                // Installation
                const installNodes = s.installation?.nodes || [];
                const completedInstallNodes = installNodes.filter(n => n.completed).length;
                const installProgress = installNodes.length > 0 ? Math.round((completedInstallNodes / installNodes.length) * 100) : 0;
                
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
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                <span className="bg-slate-100 px-1.5 rounded">{regionName}</span>
                                <span className="text-slate-300">|</span>
                                <span className="flex items-center gap-1"><BedDouble size={12}/> {roomCount} 间客房</span>
                            </div>
                            
                            <div className="flex gap-2">
                                 <div className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 font-bold">
                                     房型复尺进度: {measureProgress}%
                                 </div>
                                 <div className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold">
                                     安装进度: {installProgress}%
                                 </div>
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