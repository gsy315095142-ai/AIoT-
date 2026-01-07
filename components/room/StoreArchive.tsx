import React, { useState, ChangeEvent } from 'react';
import { Store as StoreIcon, ArrowLeft, Settings2, Box, CheckCircle, BedDouble, Ruler, Hammer, RotateCcw, X, Upload, Plus, Edit2, Trash2, ListChecks, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Store, Room, ChecklistParam } from '../../types';
import { useNavigate } from 'react-router-dom';
import { RoomDetail } from './RoomDetail';

// --- Sub-component: Module Config ---
const ModuleConfig: React.FC<{ store: Store; onClose: () => void }> = ({ store, onClose }) => {
    const { updateStore } = useApp();
    const [activeTab, setActiveTab] = useState<'measurement' | 'installation'>('measurement');
    
    // Editing State
    const [editingModule, setEditingModule] = useState<string | null>(null);
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
            newActive = newActive.map(m => m === editingModule ? tempName : m);
            delete newTypes[editingModule];
            delete newReqs[editingModule];
            delete newImages[editingModule];
            delete newChecklists[editingModule];
        }

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

export const StoreArchive: React.FC<{ store: Store; onClose: () => void }> = ({ store, onClose }) => {
    const navigate = useNavigate();
    const { updateStore } = useApp();
    const [activeRoomTypeName, setActiveRoomTypeName] = useState<string>(
        store.roomTypeConfigs.length > 0 ? store.roomTypeConfigs[0].name : ''
    );
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [detailRoom, setDetailRoom] = useState<Room | null>(null);

    const roomTypes = store.roomTypeConfigs || [];
    const currentRoomType = roomTypes.find(rt => rt.name === activeRoomTypeName);
    
    // Filter rooms for the active type
    const typeRooms = store.rooms.filter(r => r.type === activeRoomTypeName);
    
    // Filter rooms available for reassignment (i.e. NOT current type)
    const availableToAssign = store.rooms.filter(r => r.type !== activeRoomTypeName);

    // Get modules configured for measurement
    const measurementModules = store.moduleConfig.activeModules.filter(m => 
        (store.moduleConfig.moduleTypes?.[m] || 'measurement') === 'measurement'
    );

    const handleAssignRoom = (room: Room) => {
        const updatedRooms = store.rooms.map(r => 
            r.number === room.number ? { ...r, type: activeRoomTypeName } : r
        );
        updateStore(store.id, { rooms: updatedRooms });
        setIsAssignModalOpen(false);
    };

    if (isConfigOpen) return <ModuleConfig store={store} onClose={() => setIsConfigOpen(false)} />;
    if (detailRoom) return <RoomDetail store={store} room={detailRoom} onClose={() => setDetailRoom(null)} />;

    return (
        <div className="h-full flex flex-col bg-white animate-slideInRight">
            <div className="bg-white p-4 border-b border-slate-100 shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-2 mb-3">
                    <button onClick={onClose} className="p-1 -ml-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <StoreIcon size={14} className="text-blue-600" /> {store.name} - 档案管理
                    </h3>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate(`/rooms/edit/${store.id}`)}
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
                            onClick={() => setIsAssignModalOpen(true)}
                            className="w-full py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                            选择客房进行分配
                        </button>
                    </div>
                </div>
            </div>

            {/* Room Assignment Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm" onClick={() => setIsAssignModalOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden flex flex-col max-h-[80vh] animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <BedDouble size={18} className="text-blue-600" />
                                分配到: {activeRoomTypeName}
                            </h3>
                            <button onClick={() => setIsAssignModalOpen(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            {availableToAssign.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-xs">
                                    没有其他房型的客房可供分配
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {availableToAssign.map((room, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => handleAssignRoom(room)}
                                            className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm flex items-center justify-between cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-colors group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-700">{room.number}</span>
                                                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded group-hover:bg-white">{room.type}</span>
                                            </div>
                                            <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};