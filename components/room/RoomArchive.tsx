import React, { useState, useMemo } from 'react';
import { Store as StoreIcon, Plus, ChevronDown, Search, Edit2, Trash2, ChevronRight, Ruler, RotateCcw, Send, Hammer, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Store, Region } from '../../types';
import { useNavigate } from 'react-router-dom';
import { StoreArchive } from './StoreArchive';

export const RoomArchive: React.FC = () => {
    const navigate = useNavigate();
    const { regions, stores, removeStore, publishMeasurementTask, republishMeasurementTask, publishInstallationTask, republishInstallationTask, assignableUsers } = useApp();

    const [regionFilter, setRegionFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [activeTaskStoreId, setActiveTaskStoreId] = useState<string | null>(null);
    const [activeTaskType, setActiveTaskType] = useState<'measurement' | 'republish_measurement' | 'installation' | 'republish_installation' | null>(null);
    const [taskDeadline, setTaskDeadline] = useState('');
    const [taskAssignee, setTaskAssignee] = useState('');

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

    // View 2: Store Detail (Using extracted StoreArchive)
    if (viewingStoreId) {
        const store = stores.find(s => s.id === viewingStoreId);
        if (!store) { setViewingStoreId(null); return null; }
        return <StoreArchive store={store} onClose={() => setViewingStoreId(null)} />;
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