import React, { useState, useMemo, ChangeEvent } from 'react';
import { Store as StoreIcon, Plus, ChevronDown, Search, Edit2, Trash2, ChevronRight, Ruler, RotateCcw, Send, Hammer, Calendar, User, X, FileText, ArrowLeft, Settings2, Box, CheckCircle, BedDouble, Upload, Image as ImageIcon, Save, ListChecks, ToggleLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Store, Region, RoomTypeConfig, Room, ChecklistParam } from '../../types';
import { useNavigate } from 'react-router-dom';

// --- Sub-component: Room Detail (Installation Archive) ---
const RoomDetail: React.FC<{ store: Store; room: Room; onClose: () => void }> = ({ store, room, onClose }) => {
    // Helper to extract data
    const installNode = store.installation?.nodes?.find(n => n.name === '安装');
    const debugNode = store.installation?.nodes?.find(n => n.name === '调试');
    
    // Safety check for data structure
    const roomInstallData = (installNode?.data && typeof installNode.data === 'object' && !Array.isArray(installNode.data)) 
        ? installNode.data[room.number] || {} 
        : {};
    
    const roomDebugData = (debugNode?.data && typeof debugNode.data === 'object' && !Array.isArray(debugNode.data))
        ? debugNode.data[room.number] || {}
        : {};

    const installModules = store.moduleConfig.activeModules.filter(m => store.moduleConfig.moduleTypes?.[m] === 'installation');

    return (
        <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col animate-slideInRight">
            <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <BedDouble size={20} className="text-blue-600" />
                        {room.number} 客房详情
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{room.type}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><X size={20} className="text-slate-500" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                        <Hammer size={16} className="text-green-600" /> 安装归档详情
                    </h4>
                    
                    {installModules.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400">暂无安装模块配置</div>
                    ) : (
                        <div className="space-y-4">
                            {installModules.map(modName => {
                                const modData = roomInstallData[modName];
                                // Normalize
                                let images: string[] = [];
                                let params: Record<string, any> = {};
                                if (Array.isArray(modData)) {
                                    images = modData;
                                } else if (typeof modData === 'object' && modData) {
                                    images = modData.images || [];
                                    params = modData.params || {};
                                }

                                return (
                                    <div key={modName} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-700">{modName}</span>
                                            <span className="text-[10px] text-slate-400">{images.length} 张图片</span>
                                        </div>
                                        
                                        {/* Params Display */}
                                        {Object.keys(params).length > 0 && (
                                            <div className="bg-slate-50 p-2 rounded mb-2 grid grid-cols-2 gap-2">
                                                {Object.entries(params).map(([k, v]) => (
                                                    <div key={k} className="text-[10px]">
                                                        <span className="text-slate-400 mr-1">
                                                            {k === 'deviceSn' ? 'SN号' : k === 'powerOnBoot' ? '通电自启' : k}:
                                                        </span>
                                                        <span className="font-bold text-slate-700">
                                                            {typeof v === 'boolean' ? (v ? '是' : '否') : v}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Images Grid */}
                                        {images.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-2">
                                                {images.map((img, i) => (
                                                    <div key={i} className="aspect-square rounded border border-slate-200 overflow-hidden">
                                                        <img src={img} className="w-full h-full object-cover" alt="install" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-slate-300 italic">暂无图片</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                        <RotateCcw size={16} className="text-purple-600" /> 调试状态
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 ${roomDebugData.network ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                            <span className="text-xs font-bold">网络连通性</span>
                            {roomDebugData.network ? <CheckCircle size={16} /> : <div className="text-[10px]">未通过</div>}
                        </div>
                        <div className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 ${roomDebugData.log ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                            <span className="text-xs font-bold">日志上报</span>
                            {roomDebugData.log ? <CheckCircle size={16} /> : <div className="text-[10px]">未检测</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-component: Module Config ---
const ModuleConfig: React.FC<{ store: Store; onClose: () => void }> = ({ store, onClose }) => {
    const { updateStore } = useApp();
    const [activeTab, setActiveTab] = useState<'measurement' | 'installation'>('measurement');
    
    // Editing State
    const [editingModule, setEditingModule] = useState<string | null>(null); // Name of module being edited (or 'NEW')
    const [tempName, setTempName] = useState('');
    const [tempReq, setTempReq] = useState('');
    const [tempImage, setTempImage] = useState('');
    const [tempParams, setTempParams] = useState<ChecklistParam[]>([]);

    const filteredModules = store.moduleConfig.activeModules.filter(m => 
        (store.moduleConfig.moduleTypes?.[m] || 'measurement') === activeTab
    );

    const handleAddModule = () => {
        setEditingModule('NEW');
        setTempName('');
        setTempReq('');
        setTempImage('');
        setTempParams([]);
    };

    const handleEditModule = (name: string) => {
        setEditingModule(name);
        setTempName(name);
        setTempReq(store.moduleConfig.exampleRequirements?.[name] || '');
        setTempImage(store.moduleConfig.exampleImages?.[name] || '');
        setTempParams(store.moduleConfig.checklistConfigs?.[name] || []);
    };

    const handleDeleteModule = (name: string) => {
        if (window.confirm(`确定要删除模块 "${name}" 吗?`)) {
            const newActive = store.moduleConfig.activeModules.filter(m => m !== name);
            const newTypes = { ...store.moduleConfig.moduleTypes };
            delete newTypes[name];
            
            updateStore(store.id, {
                moduleConfig: {
                    ...store.moduleConfig,
                    activeModules: newActive,
                    moduleTypes: newTypes
                }
            });
        }
    };

    const handleSaveModule = () => {
        if (!tempName.trim()) { alert('请输入模块名称'); return; }
        
        let newActive = [...store.moduleConfig.activeModules];
        const newTypes = { ...store.moduleConfig.moduleTypes };
        const newReqs = { ...store.moduleConfig.exampleRequirements };
        const newImages = { ...store.moduleConfig.exampleImages };
        const newChecklists = { ...store.moduleConfig.checklistConfigs };

        if (editingModule === 'NEW') {
            if (newActive.includes(tempName)) { alert('模块名称已存在'); return; }
            newActive.push(tempName);
        } else if (editingModule && editingModule !== tempName) {
            // Rename logic: remove old, add new
            newActive = newActive.map(m => m === editingModule ? tempName : m);
            delete newTypes[editingModule];
            delete newReqs[editingModule];
            delete newImages[editingModule];
            delete newChecklists[editingModule];
        }

        // Update Values
        newTypes[tempName] = activeTab;
        if (tempReq) newReqs[tempName] = tempReq;
        if (tempImage) newImages[tempName] = tempImage;
        newChecklists[tempName] = tempParams;

        updateStore(store.id, {
            moduleConfig: {
                ...store.moduleConfig,
                activeModules: newActive,
                moduleTypes: newTypes,
                exampleRequirements: newReqs,
                exampleImages: newImages,
                checklistConfigs: newChecklists
            }
        });

        setEditingModule(null);
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            setTempImage(url);
        }
    };

    const addParam = () => {
        setTempParams([...tempParams, { id: `p-${Date.now()}`, label: '', type: 'text' }]);
    };

    const updateParam = (idx: number, field: keyof ChecklistParam, value: string) => {
        const newParams = [...tempParams];
        newParams[idx] = { ...newParams[idx], [field]: value };
        setTempParams(newParams);
    };

    const removeParam = (idx: number) => {
        setTempParams(tempParams.filter((_, i) => i !== idx));
    };

    // --- Render Config View ---
    if (editingModule) {
        return (
            <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col animate-slideInRight">
                <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm">
                    <h3 className="font-bold text-slate-800 text-sm">
                        {editingModule === 'NEW' ? '新增模块' : '编辑模块'}
                    </h3>
                    <button onClick={() => setEditingModule(null)} className="text-slate-500"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">模块名称</label>
                            <input 
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                                value={tempName}
                                onChange={e => setTempName(e.target.value)}
                                placeholder="如: 地投环境"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">示例图片</label>
                            <div className="flex items-center gap-3">
                                <div className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center relative hover:border-blue-300 transition-colors overflow-hidden">
                                    {tempImage ? (
                                        <img src={tempImage} className="w-full h-full object-cover" />
                                    ) : (
                                        <Upload size={20} className="text-slate-300" />
                                    )}
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                                </div>
                                <div className="text-[10px] text-slate-400">点击上传示例图</div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">备注/需求说明</label>
                            <textarea 
                                className="w-full border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-blue-500 h-20 resize-none"
                                value={tempReq}
                                onChange={e => setTempReq(e.target.value)}
                                placeholder="填写该模块的操作规范或注意事项..."
                            />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <ListChecks size={14} /> 参数配置
                            </label>
                            <button onClick={addParam} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100 flex items-center gap-1">
                                <Plus size={10} /> 添加参数
                            </button>
                        </div>
                        <div className="space-y-2">
                            {tempParams.map((p, idx) => (
                                <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-100">
                                    <input 
                                        className="flex-1 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                                        placeholder="参数名称 (如: 长度)"
                                        value={p.label}
                                        onChange={e => updateParam(idx, 'label', e.target.value)}
                                    />
                                    <select 
                                        className="border border-slate-200 rounded px-2 py-1 text-xs outline-none bg-white focus:border-blue-500"
                                        value={p.type}
                                        onChange={e => updateParam(idx, 'type', e.target.value as any)}
                                    >
                                        <option value="text">填空题</option>
                                        <option value="boolean">判断题</option>
                                    </select>
                                    <button onClick={() => removeParam(idx)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            {tempParams.length === 0 && (
                                <div className="text-center text-[10px] text-slate-400 py-4 border border-dashed border-slate-200 rounded">
                                    暂无参数，请点击添加
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-white">
                    <button onClick={handleSaveModule} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                        保存配置
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col animate-slideInRight">
            <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Settings2 size={18} className="text-blue-600" /> 模块配置
                </h3>
                <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><X size={20} className="text-slate-500" /></button>
            </div>

            <div className="p-4">
                <div className="flex bg-slate-200 p-1 rounded-lg mb-4">
                    <button 
                        onClick={() => setActiveTab('measurement')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'measurement' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        <Ruler size={14} /> 复尺模块
                    </button>
                    <button 
                        onClick={() => setActiveTab('installation')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${activeTab === 'installation' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        <Hammer size={14} /> 安装模块
                    </button>
                </div>

                <div className="space-y-3">
                    {filteredModules.map(moduleName => (
                        <div key={moduleName} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border border-slate-200">
                                {store.moduleConfig.exampleImages?.[moduleName] ? (
                                    <img src={store.moduleConfig.exampleImages[moduleName]} className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon size={20} className="text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-700 text-sm">{moduleName}</h4>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                    {(store.moduleConfig.checklistConfigs?.[moduleName]?.length || 0)} 个参数
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditModule(moduleName)} className="p-2 bg-slate-50 text-blue-600 rounded hover:bg-blue-50"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteModule(moduleName)} className="p-2 bg-slate-50 text-red-500 rounded hover:bg-red-50"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={handleAddModule}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-1"
                    >
                        <Plus size={16} /> 添加新模块
                    </button>
                </div>
            </div>
        </div>
    );
};

export const RoomArchive: React.FC = () => {
    const navigate = useNavigate();
    const { regions, stores, removeStore, publishMeasurementTask, republishMeasurementTask, publishInstallationTask, republishInstallationTask, assignableUsers, updateStore } = useApp();

    const [regionFilter, setRegionFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);
    const [activeRoomTypeName, setActiveRoomTypeName] = useState<string>(''); 

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [activeTaskStoreId, setActiveTaskStoreId] = useState<string | null>(null);
    const [activeTaskType, setActiveTaskType] = useState<'measurement' | 'republish_measurement' | 'installation' | 'republish_installation' | null>(null);
    const [taskDeadline, setTaskDeadline] = useState('');
    const [taskAssignee, setTaskAssignee] = useState('');

    // New State for Modals
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [detailRoom, setDetailRoom] = useState<Room | null>(null);

    // Handlers
    const filteredStores = useMemo(() => {
        return stores.filter(s => {
            if (regionFilter && s.regionId !== regionFilter) return false;
            if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [stores, regionFilter, searchQuery]);

    const getRegionLabel = (region: Region) => {
        const count = stores.filter(s => s.regionId === region.id).length;
        return `${region.name} (${count}家)`;
    };

    const handleAddStoreClick = () => {
        navigate('/rooms/add');
    };

    const handleEditStoreClick = (store: Store) => {
        navigate(`/rooms/edit/${store.id}`);
    };

    const handleDeleteStore = (id: string, name: string) => {
        if (window.confirm(`确定要删除门店 "${name}" 吗？`)) {
            removeStore(id);
        }
    };

    const handleViewStore = (store: Store) => {
        setViewingStoreId(store.id);
        if (store.roomTypeConfigs.length > 0) {
            setActiveRoomTypeName(store.roomTypeConfigs[0].name);
        } else {
            setActiveRoomTypeName('');
        }
    };

    const handleOpenTaskModal = (storeId: string, type: any, currentDeadline?: string) => {
        setActiveTaskStoreId(storeId);
        setActiveTaskType(type);
        setTaskDeadline(currentDeadline || '');
        setTaskAssignee('');
        setIsTaskModalOpen(true);
    };

    const handlePublishTask = () => {
        if (!activeTaskStoreId || !activeTaskType || !taskDeadline || !taskAssignee) return;
        if (activeTaskType === 'measurement') publishMeasurementTask(activeTaskStoreId, taskDeadline, taskAssignee);
        if (activeTaskType === 'republish_measurement') republishMeasurementTask(activeTaskStoreId, taskDeadline, taskAssignee);
        if (activeTaskType === 'installation') publishInstallationTask(activeTaskStoreId, taskDeadline, taskAssignee);
        if (activeTaskType === 'republish_installation') republishInstallationTask(activeTaskStoreId, taskDeadline, taskAssignee);
        setIsTaskModalOpen(false);
    };

    // View 2: Store Detail (Room Management)
    if (viewingStoreId) {
        const store = stores.find(s => s.id === viewingStoreId);
        if (!store) { setViewingStoreId(null); return null; }

        // Render New Sub-Components
        if (isConfigOpen) return <ModuleConfig store={store} onClose={() => setIsConfigOpen(false)} />;
        if (detailRoom) return <RoomDetail store={store} room={detailRoom} onClose={() => setDetailRoom(null)} />;

        const roomTypes = store.roomTypeConfigs || [];
        const currentRoomType = roomTypes.find(rt => rt.name === activeRoomTypeName);
        
        const typeRooms = store.rooms.filter(r => r.type === activeRoomTypeName);

        const measurementModules = store.moduleConfig.activeModules.filter(m => 
            (store.moduleConfig.moduleTypes?.[m] || 'measurement') === 'measurement'
        );

        return (
            <div className="h-full flex flex-col bg-white">
                <div className="bg-white p-4 border-b border-slate-100 shadow-sm sticky top-0 z-20">
                    <div className="flex items-center gap-2 mb-3">
                        <button onClick={() => setViewingStoreId(null)} className="p-1 -ml-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <StoreIcon size={14} className="text-blue-600" /> {store.name} - 档案管理
                        </h3>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleEditStoreClick(store)}
                            className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95"
                        >
                            <Settings2 size={14} className="text-blue-500" /> 房型配置
                        </button>
                        <button 
                            onClick={() => setIsConfigOpen(true)}
                            className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95"
                        >
                            <Box size={14} className="text-purple-500" /> 模块配置
                        </button>
                    </div>
                </div>
                
                {/* Room Type Tabs */}
                <div className="flex px-4 border-b border-slate-100 overflow-x-auto no-scrollbar gap-6 bg-slate-50 pt-2">
                    {roomTypes.map(rt => (
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
                    {roomTypes.length === 0 && <div className="py-3 text-xs text-slate-400">暂无房型</div>}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Module 1: Measurement Info (Approved Only) */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center justify-between">
                            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                <Ruler size={16} className="text-blue-500" /> 复尺模块
                            </h4>
                            <span className="text-[10px] text-slate-400">已审核通过的数据</span>
                        </div>
                        <div className="p-4 space-y-4">
                            {measurementModules.map(modName => {
                                const mData = currentRoomType?.measurements?.find(m => m.category === modName);
                                const images = currentRoomType?.images?.filter(img => img.category === modName) || [];
                                
                                // Only show approved measurements
                                if (mData?.status !== 'approved') return null;

                                return (
                                    <div key={modName} className="border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                <CheckCircle size={10} className="text-green-500" /> {modName}
                                            </span>
                                        </div>
                                        {/* Images Grid */}
                                        {images.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-2">
                                                {images.map((img, i) => (
                                                    <div key={i} className="aspect-square rounded-lg border border-slate-100 overflow-hidden">
                                                        <img src={img.url} className="w-full h-full object-cover" alt="measurement" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 italic">无图片凭证</span>
                                        )}
                                        {mData.remark && (
                                            <div className="text-[10px] text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                                                {mData.remark}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {!measurementModules.some(m => currentRoomType?.measurements?.find(meas => meas.category === m)?.status === 'approved') && (
                                <div className="text-center text-xs text-slate-400 py-4 flex flex-col items-center gap-1">
                                    <Ruler size={24} className="opacity-20 mb-1" />
                                    暂无已审核通过的复尺信息
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Module 2: Room List */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center justify-between">
                            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                <BedDouble size={16} className="text-green-500" /> 客房模块
                            </h4>
                            <span className="text-[10px] text-slate-400">共 {typeRooms.length} 间</span>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                {typeRooms.map((room, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setDetailRoom(room)}
                                        className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-center shadow-sm cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                    >
                                        <div className="font-bold text-slate-700 text-sm">{room.number}</div>
                                    </div>
                                ))}
                                {typeRooms.length === 0 && (
                                    <div className="col-span-4 text-center text-xs text-slate-400 py-2">
                                        暂无该房型的客房
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => alert('分配功能即将上线')}
                                disabled={typeRooms.length === 0}
                                className="w-full py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                选择客房进行分配
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // View 1: Store List
    return (
        <div className="h-full flex flex-col">
            {/* Header / Filter */}
            <div className="bg-white p-4 shrink-0 shadow-sm border-b border-slate-100 z-10">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                        <StoreIcon size={12} /> 门店列表
                    </h3>
                    <button 
                        onClick={handleAddStoreClick}
                        className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={12} /> 新增门店
                    </button>
                </div>
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
                    
                    // Task Status Logic
                    let progressPercent = 0;
                    let isTaskPublished = store.measurementTask?.status === 'published';
                    
                    if (isTaskPublished) {
                        const activeMods = store.moduleConfig.activeModules.filter(m => (store.moduleConfig.moduleTypes?.[m] || 'measurement') === 'measurement');
                        const roomTypes = store.roomTypeConfigs || [];
                        const totalModules = roomTypes.length * activeMods.length;
                        let completedModules = 0;
                        roomTypes.forEach(rt => {
                            const approvedCount = rt.measurements?.filter(m => m.status === 'approved' && activeMods.includes(m.category)).length || 0;
                            completedModules += approvedCount;
                        });
                        progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : (roomTypes.length > 0 && activeMods.length === 0 ? 100 : 0);
                    }

                    const installNodes = store.installation?.nodes || [];
                    const installCompleted = installNodes.filter(n => n.completed).length;
                    const installTotal = installNodes.length;
                    const installProgress = installTotal > 0 ? Math.round((installCompleted / installTotal) * 100) : 0;
                    const isMeasurementCompleted = progressPercent === 100;
                    const isInstallCompleted = store.installation?.status === 'approved';
                    const installStatus = store.installation?.status;
                    let installAuditLabel = null;
                    if (installStatus === 'pending_review_1') installAuditLabel = '待初审';
                    else if (installStatus === 'pending_review_2') installAuditLabel = '待二审';
                    else if (installStatus === 'pending_review_3') installAuditLabel = '待三审';
                    else if (installStatus === 'pending_review_4') installAuditLabel = '待终审';
                    else if (installStatus === 'rejected') installAuditLabel = '已驳回';

                    return (
                        <div 
                            key={store.id} 
                            onClick={() => handleViewStore(store)}
                            className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 relative group hover:shadow-md transition-all"
                        >
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
                                        onClick={(e) => { e.stopPropagation(); handleEditStoreClick(store); }}
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

                            <div className="mt-3 pt-3 border-t border-slate-50 flex flex-col gap-3">
                                {/* Measurement Task */}
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
                                                    <div className={`h-full rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }}></div>
                                                </div>
                                            </div>
                                            {isMeasurementCompleted ? (
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenTaskModal(store.id, 'republish_measurement', store.measurementTask?.deadline); }} className="text-[10px] px-2 py-1.5 rounded-lg shadow-sm flex items-center gap-1 font-bold transition-colors bg-orange-50 text-orange-600 hover:bg-orange-100 shrink-0 border border-orange-100">
                                                    <RotateCcw size={10} /> 重发复尺任务
                                                </button>
                                            ) : (
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenTaskModal(store.id, 'measurement', store.measurementTask?.deadline); }} className="text-[10px] px-2 py-1.5 rounded-lg shadow-sm flex items-center gap-1 font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0">
                                                    <Edit2 size={10} /> 更新任务
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-xs text-slate-400 flex items-center gap-1 opacity-60"><Ruler size={12} /> 暂未发布复尺任务</div>
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenTaskModal(store.id, 'measurement'); }} className="text-[10px] px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 font-bold transition-colors bg-blue-600 text-white hover:bg-blue-700 shrink-0">
                                                <Send size={10} /> 发布复尺任务
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Installation Task */}
                                <div className="flex items-center justify-between gap-4">
                                    {store.installationTask?.status === 'published' ? (
                                        <>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center text-[10px] mb-1">
                                                    <span className="text-green-600 font-bold flex items-center gap-1">
                                                        <Hammer size={10} /> 安装进度: {installProgress}%
                                                        {installAuditLabel && <span className={`text-[9px] px-1.5 rounded ml-1 ${installStatus === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600 animate-pulse'}`}>{installAuditLabel}</span>}
                                                    </span>
                                                    <span className="text-slate-400">预期: {store.installationTask.deadline}</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-500 bg-green-500" style={{ width: `${installProgress}%` }}></div>
                                                </div>
                                            </div>
                                            {isInstallCompleted ? (
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenTaskModal(store.id, 'republish_installation', store.installationTask?.deadline); }} className="text-[10px] px-2 py-1.5 rounded-lg shadow-sm flex items-center gap-1 font-bold transition-colors bg-orange-50 text-orange-600 hover:bg-orange-100 shrink-0 border border-orange-100">
                                                    <RotateCcw size={10} /> 重发安装任务
                                                </button>
                                            ) : (
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenTaskModal(store.id, 'installation', store.installationTask?.deadline); }} className="text-[10px] px-2 py-1.5 rounded-lg shadow-sm flex items-center gap-1 font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0">
                                                    <Edit2 size={10} /> 更新任务
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-xs text-slate-400 flex items-center gap-1 opacity-60"><Hammer size={12} /> 暂未发布安装任务</div>
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenTaskModal(store.id, 'installation'); }} className="text-[10px] px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 font-bold transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 shrink-0">
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

            {/* Task Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Send size={18} className="text-blue-600" />
                                {activeTaskType === 'measurement' ? '发布复尺任务' 
                                : activeTaskType === 'republish_measurement' ? '重发复尺任务' 
                                : activeTaskType === 'republish_installation' ? '重发安装任务'
                                : '发布安装任务'}
                            </h3>
                            <button onClick={() => setIsTaskModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    {activeTaskType?.includes('measurement') ? '期望完成复尺的时间' : '预期安装时间'}
                                </label>
                                <input type="date" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" value={taskDeadline} onChange={(e) => setTaskDeadline(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">任务指派对象</label>
                                <div className="relative">
                                    <select className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 appearance-none" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                                        <option value="">请选择负责人...</option>
                                        {assignableUsers.map(user => <option key={user.id} value={user.name}>{user.name} ({user.role})</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                            <button onClick={handlePublishTask} disabled={!taskDeadline || !taskAssignee} className={`w-full text-white font-bold py-2.5 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${activeTaskType?.includes('republish') ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {activeTaskType?.includes('republish') ? '重发任务' : '确定发布'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};