import React, { useState, ChangeEvent, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Store as StoreIcon, Plus, Edit2, Trash2, X, Store, BedDouble, Table, Ruler, ArrowLeft, Search, ChevronDown, ChevronRight, Settings, Check, HelpCircle, Image as ImageIcon, ClipboardList, Hammer, ListChecks, Calendar, Send, ToggleLeft, ToggleRight } from 'lucide-react';
import { Store as StoreType, Room, RoomImageCategory, RoomImage, RoomTypeConfig, ChecklistParam, ChecklistParamType, ModuleType, Region, InstallationParamKey } from '../../types';

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
    '玩乐活动区域长宽': 'https://images.unsplash.com/photo-1596178065887-1198b6148b2e?q=80&w=600&auto=format&fit=crop',
    '地投': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=600&auto=format&fit=crop',
    '桌显': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=600&auto=format&fit=crop'
};

export const RoomArchive: React.FC = () => {
  const { regions, stores, addStore, updateStore, removeStore, publishMeasurementTask, publishInstallationTask } = useApp();

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

  // Task Publish Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalStoreId, setTaskModalStoreId] = useState<string | null>(null);
  const [taskDeadline, setTaskDeadline] = useState('');
  const [activeTaskType, setActiveTaskType] = useState<'measurement' | 'installation' | null>(null);

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

  // Helper for Region Label with Store Count
  const getRegionLabel = (region: Region) => {
      const storeCount = stores.filter(s => s.regionId === region.id).length;
      return `${region.name} (${storeCount}家)`;
  };

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
      if (!window.confirm("是否确认删除该模块？")) return;

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
      
      // Clean up installation params
      const newInstallationParams = { ...(currentConfig.installationParams || {}) };
      delete newInstallationParams[moduleName];

      updateStore(activeStore.id, {
          moduleConfig: {
              activeModules: newModules,
              moduleTypes: newModuleTypes,
              exampleImages: newExampleImages,
              exampleRequirements: newExampleRequirements,
              checklistConfigs: newChecklistConfigs,
              installationParams: newInstallationParams
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

      const newInstallationParams = { ...(currentConfig.installationParams || {}) };
      if (newInstallationParams[oldName]) { newInstallationParams[newName] = newInstallationParams[oldName]; delete newInstallationParams[oldName]; }

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
              checklistConfigs: newChecklistConfigs,
              installationParams: newInstallationParams
          },
          roomTypeConfigs: updatedRoomTypeConfigs
      });

      setEditingModule(null);
  };

  // --- Config Image/Req/Checklist/Params Handlers (Store Level) ---

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

  const handleToggleInstallationParam = (category: string, paramKey: InstallationParamKey) => {
      if (!activeStore) return;
      const currentConfig = activeStore.moduleConfig;
      const currentParams = currentConfig.installationParams?.[category] || [];
      
      let newParams: InstallationParamKey[];
      if (currentParams.includes(paramKey)) {
          newParams = currentParams.filter(p => p !== paramKey);
      } else {
          newParams = [...currentParams, paramKey];
      }

      updateStore(activeStore.id, {
          moduleConfig: {
              ...currentConfig,
              installationParams: {
                  ...currentConfig.installationParams,
                  [category]: newParams
              }
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
              moduleConfig: { activeModules: [], moduleTypes: {}, exampleImages: {}, exampleRequirements: {}, checklistConfigs: {}, installationParams: {} } // Will be handled by addStore defaults usually
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

  // --- Publish Task Handlers ---
  const handleOpenTaskModal = (storeId: string, type: 'measurement' | 'installation', currentDeadline?: string) => {
      setTaskModalStoreId(storeId);
      setActiveTaskType(type);
      setTaskDeadline(currentDeadline || '');
      setIsTaskModalOpen(true);
  };

  const handlePublishTask = () => {
      if (!taskModalStoreId || !taskDeadline || !activeTaskType) return;
      
      if (activeTaskType === 'measurement') {
          publishMeasurementTask(taskModalStoreId, taskDeadline);
      } else {
          publishInstallationTask(taskModalStoreId, taskDeadline);
      }
      
      setIsTaskModalOpen(false);
      setTaskModalStoreId(null);
      setActiveTaskType(null);
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
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 relative">
                      <div className="flex justify-between items-center mb-3">
                          <h3 className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase">
                              <Ruler size={14} className="text-blue-500" /> 
                              【复尺模块】
                          </h3>
                      </div>
                      
                      {activeStore.measurementTask && (
                          <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-2 text-[10px] flex justify-between items-center text-blue-800">
                              <span className="font-bold">任务已发布</span>
                              <span>截止时间: {activeStore.measurementTask.deadline}</span>
                          </div>
                      )}

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
                                  // Data structure for room installation in node: 
                                  // Legacy: { [room]: { [category]: string[] } }
                                  // New: { [room]: { [category]: { images: string[], params: {} } } }
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
                                            const categoryData = roomInstallData[category];
                                            const catImages: string[] = Array.isArray(categoryData) ? categoryData : (categoryData?.images || []);
                                            const catParams = !Array.isArray(categoryData) ? categoryData?.params : undefined;

                                            return (
                                                <div key={category} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
                                                        <Hammer size={14} className="text-blue-500" />
                                                        <span className="text-sm font-bold text-slate-800">{category} (安装现场)</span>
                                                    </div>
                                                    
                                                    {/* Display Params if exist */}
                                                    {catParams && Object.keys(catParams).length > 0 && (
                                                        <div className="mb-3 grid grid-cols-2 gap-2">
                                                            {catParams.deviceSn && (
                                                                <div className="bg-slate-50 p-2 rounded text-[10px]">
                                                                    <span className="text-slate-400 block">SN号</span>
                                                                    <span className="font-mono text-slate-700 font-bold">{catParams.deviceSn}</span>
                                                                </div>
                                                            )}
                                                            {catParams.powerOnBoot !== undefined && (
                                                                <div className="bg-slate-50 p-2 rounded text-[10px]">
                                                                    <span className="text-slate-400 block">通电自启</span>
                                                                    <span className={`font-bold ${catParams.powerOnBoot ? 'text-green-600' : 'text-slate-700'}`}>
                                                                        {catParams.powerOnBoot ? '是' : '否'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

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
                                  {activeModuleTab === 'measurement' ? '复尺类模块需配置图片、备注及清单。' : '安装类模块需配置示例图、备注及必填参数。'}
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
                                  // Installation Params
                                  const installParams = activeStore.moduleConfig.installationParams?.[moduleName] || [];
                                  
                                  return (
                                      <div key={moduleName} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative group/module animate-fadeIn">
                                          {/* Module Header Row */}
                                          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                              <div className="flex items-center gap-2">
                                                  <div className={`w-1.5 h-4 rounded-full ${activeModuleTab === 'measurement' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                                                  {isEditingName ? (
                                                      <div className="flex items-center gap-1 animate-fadeIn">
                                                          <input 
                                                            autoFocus
                                                            className="w-40 text-sm border border-blue-300 rounded px-1 py-0.5 outline-none bg-white text-slate-700"
                                                            value={editingModule?.newName}
                                                            onChange={(e) => setEditingModule(prev => prev ? ({ ...prev, newName: e.target.value }) : null)}
                                                          />
                                                          <button onClick={handleRenameModule} className="bg-green-100 text-green-600 p-1 rounded hover:bg-green-200"><Check size={14} /></button>
                                                          <button onClick={() => setEditingModule(null)} className="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200"><X size={14} /></button>
                                                      </div>
                                                  ) : (
                                                      <h4 className="font-bold text-slate-700 text-sm">{moduleName}</h4>
                                                  )}
                                                  {!isEditingName && (
                                                      <button onClick={() => setEditingModule({ oldName: moduleName, newName: moduleName })} className="text-slate-300 hover:text-blue-500 transition-colors p-1">
                                                          <Edit2 size={12} />
                                                      </button>
                                                  )}
                                              </div>
                                              <button 
                                                  type="button"
                                                  onClick={(e) => { e.stopPropagation(); handleDeleteModule(moduleName); }}
                                                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer z-10"
                                                  title="删除模块"
                                              >
                                                  <Trash2 size={16} />
                                              </button>
                                          </div>

                                          <div className="flex gap-4">
                                              {/* Left Column: Image */}
                                              <div className="w-32 shrink-0 flex flex-col gap-2">
                                                  {existingImage ? (
                                                      <div className="aspect-square w-full rounded-lg border border-slate-200 relative group overflow-hidden bg-slate-50">
                                                          <img src={existingImage} alt={`${moduleName} example`} className="w-full h-full object-cover" />
                                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                              <div className="relative cursor-pointer bg-white/20 p-1.5 rounded-full hover:bg-white/40 backdrop-blur-sm">
                                                                  <Edit2 size={16} className="text-white" />
                                                                  <input type="file" accept="image/*" onChange={(e) => handleConfigImageUpload(moduleName, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                              </div>
                                                              <button onClick={() => removeConfigImage(moduleName)} className="text-white hover:text-red-400 bg-white/20 p-1.5 rounded-full hover:bg-white/40 backdrop-blur-sm">
                                                                  <Trash2 size={16} />
                                                              </button>
                                                          </div>
                                                      </div>
                                                  ) : (
                                                      <div className="aspect-square w-full border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group">
                                                              <input type="file" accept="image/*" onChange={(e) => handleConfigImageUpload(moduleName, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                              <Plus size={24} className="text-slate-300 group-hover:text-blue-400 mb-1" />
                                                              <span className="text-[10px] text-slate-400 font-bold group-hover:text-blue-500">上传示例图</span>
                                                      </div>
                                                  )}
                                                  <p className="text-[10px] text-center text-slate-400">标准参考图</p>
                                              </div>

                                              {/* Right Column: Config */}
                                              <div className="flex-1 flex flex-col gap-3 min-w-0">
                                                  {/* Text Requirement / Remark */}
                                                  <div className="flex flex-col">
                                                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                                                          {activeModuleTab === 'measurement' ? '拍摄需求 / 备注' : '安装备注 / 说明'}
                                                      </label>
                                                      <textarea 
                                                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 resize-none text-slate-700 placeholder-slate-400 h-16"
                                                          placeholder={activeModuleTab === 'measurement' ? "请输入此模块的拍照或复尺需求..." : "请输入安装说明或注意事项..."}
                                                          value={existingRequirement}
                                                          onChange={(e) => handleConfigRequirementChange(moduleName, e.target.value)}
                                                      />
                                                  </div>

                                                  {/* Installation Parameters Config */}
                                                  {activeModuleTab === 'installation' && (
                                                      <div className="flex flex-col flex-1">
                                                          <div className="flex justify-between items-center mb-1">
                                                              <label className="text-[10px] text-slate-500 font-bold uppercase">参数配置 (安装需填)</label>
                                                          </div>
                                                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col gap-2">
                                                              <div className="flex items-center gap-2">
                                                                  <div 
                                                                    onClick={() => handleToggleInstallationParam(moduleName, 'deviceSn')}
                                                                    className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-colors ${
                                                                        installParams.includes('deviceSn') ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                                                                    }`}
                                                                  >
                                                                      {installParams.includes('deviceSn') && <Check size={12} className="text-white" strokeWidth={3} />}
                                                                  </div>
                                                                  <span className="text-xs text-slate-700">填写设备SN号</span>
                                                                  <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">填空</span>
                                                              </div>
                                                              <div className="flex items-center gap-2">
                                                                  <div 
                                                                    onClick={() => handleToggleInstallationParam(moduleName, 'powerOnBoot')}
                                                                    className={`w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-colors ${
                                                                        installParams.includes('powerOnBoot') ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                                                                    }`}
                                                                  >
                                                                      {installParams.includes('powerOnBoot') && <Check size={12} className="text-white" strokeWidth={3} />}
                                                                  </div>
                                                                  <span className="text-xs text-slate-700">通电自启</span>
                                                                  <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">是/否</span>
                                                              </div>
                                                          </div>
                                                      </div>
                                                  )}

                                                  {/* Checklist Config - ONLY FOR MEASUREMENT */}
                                                  {activeModuleTab === 'measurement' && (
                                                      <div className="flex flex-col flex-1">
                                                          <div className="flex justify-between items-center mb-1">
                                                              <label className="text-[10px] text-slate-500 font-bold uppercase">必填参数清单</label>
                                                              <button 
                                                                  onClick={() => setAddingChecklistToCategory(moduleName)}
                                                                  className="text-[10px] text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                                                              >
                                                                  + 添加参数
                                                              </button>
                                                          </div>
                                                          
                                                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex-1 overflow-y-auto max-h-32">
                                                              {checklistParams.length === 0 && !isAddingChecklist && (
                                                                  <p className="text-[10px] text-slate-400 text-center py-2">暂无参数</p>
                                                              )}
                                                              
                                                              <ul className="space-y-1">
                                                                  {checklistParams.map(param => (
                                                                      <li key={param.id} className="flex justify-between items-center bg-white border border-slate-100 px-2 py-1 rounded text-xs">
                                                                          <div className="flex items-center gap-2">
                                                                              <span className="text-slate-700 font-medium">{param.label}</span>
                                                                              <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">{param.type === 'boolean' ? '是/否' : '文本'}</span>
                                                                          </div>
                                                                          <button onClick={() => handleRemoveChecklistParam(moduleName, param.id)} className="text-slate-300 hover:text-red-500"><X size={12}/></button>
                                                                      </li>
                                                                  ))}
                                                                  
                                                                  {isAddingChecklist && (
                                                                      <li className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-2 py-1 rounded animate-fadeIn">
                                                                          <input 
                                                                              autoFocus
                                                                              className="flex-1 text-xs bg-transparent outline-none min-w-0"
                                                                              placeholder="参数名称"
                                                                              value={newChecklistLabel}
                                                                              onChange={(e) => setNewChecklistLabel(e.target.value)}
                                                                              onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistParam(moduleName)}
                                                                          />
                                                                          <select 
                                                                              className="text-[10px] bg-white border border-slate-200 rounded outline-none"
                                                                              value={newChecklistType}
                                                                              onChange={(e) => setNewChecklistType(e.target.value as ChecklistParamType)}
                                                                          >
                                                                              <option value="text">文本</option>
                                                                              <option value="boolean">是/否</option>
                                                                          </select>
                                                                          <button onClick={() => handleAddChecklistParam(moduleName)} className="text-green-600"><Check size={14}/></button>
                                                                          <button onClick={() => setAddingChecklistToCategory(null)} className="text-slate-400"><X size={14}/></button>
                                                                      </li>
                                                                  )}
                                                              </ul>
                                                          </div>
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  );
                                })}
                          </div>
                      </div>
                  </div>
              )}

              {/* Add Store Modal */}
              {!viewingStoreId && (
                  <>
                    <button 
                        onClick={openAddStoreModal}
                        className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
                    >
                        <Plus size={24} />
                    </button>

                    {isStoreModalOpen && (
                        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <StoreIcon size={20} className="text-blue-600" />
                                        {editingStoreId ? '编辑门店' : '新增门店'}
                                    </h3>
                                    <button onClick={() => setIsStoreModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                                </div>
                                <form onSubmit={handleStoreSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                                    {/* ... existing form fields ... */}
                                    {!editingStoreId && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">门店ID *</label>
                                            <input required className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={storeForm.id} onChange={e => setStoreForm({...storeForm, id: e.target.value})} placeholder="例如: s1" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">门店名称 *</label>
                                        <input required className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={storeForm.name} onChange={e => setStoreForm({...storeForm, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属大区 *</label>
                                        <select required className="w-full border border-slate-200 rounded p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={storeForm.regionId} onChange={e => setStoreForm({...storeForm, regionId: e.target.value})}>
                                            <option value="">选择大区</option>
                                            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">房间列表</label>
                                            <button type="button" onClick={addRoomRow} className="text-[10px] text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors">+ 添加房间</button>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2 max-h-40 overflow-y-auto border border-slate-200 space-y-2">
                                            {storeForm.rooms.map((room, idx) => (
                                                <div key={room.key} className="flex gap-2">
                                                    <input 
                                                        className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                                                        placeholder="房间号"
                                                        value={room.number}
                                                        onChange={e => updateRoomRow(idx, e.target.value)}
                                                    />
                                                    <button type="button" onClick={() => removeRoomRow(idx)} className="text-slate-400 hover:text-red-500 px-1"><X size={16}/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">房型配置</label>
                                            {!editingStoreId && (
                                                <div className="flex gap-1">
                                                    <input 
                                                        className="w-24 border border-slate-200 rounded px-2 py-0.5 text-xs outline-none focus:border-blue-500" 
                                                        placeholder="新房型名称"
                                                        value={newRoomTypeName}
                                                        onChange={e => setNewRoomTypeName(e.target.value)}
                                                    />
                                                    <button type="button" onClick={addFormRoomType} className="bg-blue-600 text-white rounded px-2 text-xs hover:bg-blue-700">+</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {storeForm.roomTypes.map(rt => (
                                                <div key={rt.id} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                                                    {rt.name}
                                                    {!editingStoreId && <button type="button" onClick={() => removeFormRoomType(rt.id)} className="hover:text-red-500"><X size={10}/></button>}
                                                </div>
                                            ))}
                                            {storeForm.roomTypes.length === 0 && <span className="text-xs text-slate-400 italic">暂无房型</span>}
                                        </div>
                                        {editingStoreId && <p className="text-[10px] text-slate-400 mt-1">* 编辑模式下请在详情页管理房型</p>}
                                    </div>

                                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-blue-700 transition-colors mt-4">
                                        {editingStoreId ? '保存更改' : '确认添加'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                  </>
              )}

              {/* Publish Task Modal - Ensures it renders when state is true, regardless of view mode if active */}
              {isTaskModalOpen && (
                  <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                          <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                  {activeTaskType === 'measurement' ? <Send size={18} className="text-blue-600" /> : <Hammer size={18} className="text-blue-600" />}
                                  {activeTaskType === 'measurement' ? '发布复尺任务' : '发布安装任务'}
                              </h3>
                              <button onClick={() => setIsTaskModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                          </div>
                          
                          <div className="p-5 space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                      {activeTaskType === 'measurement' ? '期望完成复尺的时间' : '预期安装时间'}
                                  </label>
                                  <input 
                                      type="date" 
                                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                                      value={taskDeadline}
                                      onChange={(e) => setTaskDeadline(e.target.value)}
                                  />
                              </div>
                              
                              <p className="text-xs text-slate-400 leading-relaxed">
                                  {activeTaskType === 'measurement' 
                                    ? '发布任务后，该门店将出现在【客房复尺】列表中，供复尺人员查看和执行。'
                                    : '发布任务后，该门店将出现在【客房安装】列表中，供安装人员查看和执行。'
                                  }
                              </p>

                              <button 
                                  onClick={handlePublishTask}
                                  disabled={!taskDeadline}
                                  className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  确定发布
                              </button>
                          </div>
                      </div>
                  </div>
              )}

          </div>
      );
  }

  // --- VIEW 1: Store List ---
  return (
    <div className="h-full flex flex-col">
        {/* Header / Filter */}
        <div className="bg-white p-4 shrink-0 shadow-sm border-b border-slate-100 z-10">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                <StoreIcon size={12} /> 门店列表
            </h3>
            <div className="relative mb-3">
                <select 
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                >
                    <option value="">全部大区</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{getRegionLabel(r)}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="搜索门店名称..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs py-2 pl-8 pr-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredStores.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">没有找到符合条件的门店</div>
            )}
            {filteredStores.map(store => {
                const roomCount = store.rooms.length;
                const typeCount = store.roomTypeConfigs ? store.roomTypeConfigs.length : 0;
                
                // Calculate measurement task progress if it exists
                let progressPercent = 0;
                let isTaskPublished = store.measurementTask?.status === 'published';
                
                if (isTaskPublished) {
                    const activeMods = store.moduleConfig.activeModules.filter(m => (store.moduleConfig.moduleTypes?.[m] || 'measurement') === 'measurement');
                    const roomTypes = store.roomTypeConfigs || [];
                    
                    if (roomTypes.length > 0 && activeMods.length > 0) {
                        const totalModules = roomTypes.length * activeMods.length;
                        let completedModules = 0;
                        roomTypes.forEach(rt => {
                            const approvedCount = rt.measurements?.filter(m => m.status === 'approved' && activeMods.includes(m.category)).length || 0;
                            completedModules += approvedCount;
                        });
                        
                        progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
                    } else if (roomTypes.length > 0 && activeMods.length === 0) {
                        progressPercent = 100;
                    }
                }

                // Installation Progress
                const installNodes = store.installation?.nodes || [];
                const installCompleted = installNodes.filter(n => n.completed).length;
                const installTotal = installNodes.length;
                const installProgress = installTotal > 0 ? Math.round((installCompleted / installTotal) * 100) : 0;

                return (
                    <div 
                        key={store.id} 
                        onClick={() => setViewingStoreId(store.id)}
                        className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 relative group hover:shadow-md transition-all"
                    >
                        {/* Top Row: Info + Edit Tools */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="cursor-pointer flex-1">
                                <h4 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                                    {store.name}
                                    <ChevronRight size={14} className="text-slate-300" />
                                </h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {regions.find(r => r.id === store.regionId)?.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {roomCount} 间客房 · {typeCount} 种房型
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 ml-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openEditStoreModal(store); }}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteStore(store.id, store.name); }}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Bottom Row: Task Info & Progress */}
                        <div className="mt-3 pt-3 border-t border-slate-50 flex flex-col gap-3">
                            {/* Measurement Task Section */}
                            <div className="flex items-center justify-between gap-4">
                                {isTaskPublished ? (
                                    <>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center text-[10px] mb-1">
                                                <span className="text-blue-600 font-bold flex items-center gap-1">
                                                    <Ruler size={10} /> 复尺进度: {progressPercent}%
                                                </span>
                                                <span className="text-slate-400">截止: {store.measurementTask?.deadline}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                                    style={{ width: `${progressPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleOpenTaskModal(store.id, 'measurement', store.measurementTask?.deadline);
                                            }}
                                            className="text-[10px] px-2 py-1.5 rounded-lg shadow-sm flex items-center gap-1 font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0"
                                        >
                                            <Edit2 size={10} /> 更新任务
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-xs text-slate-400 flex items-center gap-1 opacity-60">
                                            <Ruler size={12} /> 暂未发布复尺任务
                                        </div>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleOpenTaskModal(store.id, 'measurement');
                                            }}
                                            className="text-[10px] px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 font-bold transition-colors bg-blue-600 text-white hover:bg-blue-700 shrink-0"
                                        >
                                            <Send size={10} /> 发布复尺任务
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Installation Task Section */}
                            <div className="flex items-center justify-between gap-4">
                                {store.installationTask?.status === 'published' ? (
                                    <>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center text-[10px] mb-1">
                                                <span className="text-green-600 font-bold flex items-center gap-1">
                                                    <Hammer size={10} /> 安装进度: {installProgress}%
                                                </span>
                                                <span className="text-slate-400">预期: {store.installationTask.deadline}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 bg-green-500`} 
                                                    style={{ width: `${installProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleOpenTaskModal(store.id, 'installation', store.installationTask?.deadline);
                                            }}
                                            className="text-[10px] px-2 py-1.5 rounded-lg shadow-sm flex items-center gap-1 font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0"
                                        >
                                            <Edit2 size={10} /> 更新任务
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-xs text-slate-400 flex items-center gap-1 opacity-60">
                                            <Hammer size={12} /> 暂未发布安装任务
                                        </div>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleOpenTaskModal(store.id, 'installation');
                                            }}
                                            className="text-[10px] px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 font-bold transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 shrink-0"
                                        >
                                            <Send size={10} /> 发布安装任务
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Modal rendering is handled at the top level of component return */}
        {isTaskModalOpen && (
            <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Send size={18} className="text-blue-600" />
                            {activeTaskType === 'measurement' ? '发布复尺任务' : '发布安装任务'}
                        </h3>
                        <button onClick={() => setIsTaskModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                {activeTaskType === 'measurement' ? '期望完成复尺的时间' : '预期安装时间'}
                            </label>
                            <input 
                                type="date" 
                                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                                value={taskDeadline}
                                onChange={(e) => setTaskDeadline(e.target.value)}
                            />
                        </div>
                        
                        <p className="text-xs text-slate-400 leading-relaxed">
                            {activeTaskType === 'measurement' 
                              ? '发布任务后，该门店将出现在【客房复尺】列表中，供复尺人员查看和执行。'
                              : '发布任务后，该门店将出现在【客房安装】列表中，供安装人员查看和执行。'
                            }
                        </p>

                        <button 
                            onClick={handlePublishTask}
                            disabled={!taskDeadline}
                            className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            确定发布
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};