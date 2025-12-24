import React, { useState, ChangeEvent } from 'react';
import { Hammer, Store, ChevronDown, Clock, CheckCircle, Upload, X, Calendar, ClipboardList, AlertCircle, ArrowRight, Gavel } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Store as StoreType, InstallNode, InstallStatus } from '../../types';

export const RoomInstall: React.FC = () => {
  const { regions, stores, updateStoreInstallation } = useApp();
  
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  
  // Modals
  const [activeStore, setActiveStore] = useState<StoreType | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Filter Logic
  const filteredStores = stores.filter(s => {
      if (selectedRegion && s.regionId !== selectedRegion) return false;
      if (selectedStoreId && s.id !== selectedStoreId) return false;
      return true;
  });

  // Helpers
  const getProgress = (nodes: InstallNode[] = []) => {
      const completed = nodes.filter(n => n.completed).length;
      return Math.round((completed / Math.max(nodes.length, 1)) * 100);
  };

  const getStatusConfig = (status: InstallStatus) => {
      switch(status) {
          case 'approved': return { label: '安装完成', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle };
          case 'pending_review': return { label: '待审核', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ClipboardList };
          case 'in_progress': return { label: '进行中', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Hammer };
          case 'rejected': return { label: '未提交', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle };
          default: return { label: '未开始', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Clock };
      }
  };

  // Actions
  const handleOpenDetail = (store: StoreType) => {
      setActiveStore(store);
      setIsDetailModalOpen(true);
  };

  const handleOpenAudit = (e: React.MouseEvent, store: StoreType) => {
      e.stopPropagation();
      setActiveStore(store);
      setIsAuditModalOpen(true);
  };

  // Node Updates (Inside Detail Modal)
  const updateNode = (index: number, data: string, completed: boolean) => {
      if (!activeStore || !activeStore.installation) return;
      
      const newNodes = [...activeStore.installation.nodes];
      newNodes[index] = { ...newNodes[index], data, completed };

      // Also update Appointment Time shortcut if it's the first node
      const extraUpdates: any = {};
      if (index === 0) extraUpdates.appointmentTime = data;

      // Optimistic update for UI then Context update
      const updatedStore = {
          ...activeStore,
          installation: { ...activeStore.installation, nodes: newNodes, ...extraUpdates, status: activeStore.installation.status === 'unstarted' ? 'in_progress' : activeStore.installation.status }
      };
      
      setActiveStore(updatedStore);
      updateStoreInstallation(activeStore.id, { 
          nodes: newNodes, 
          ...extraUpdates,
          status: activeStore.installation.status === 'unstarted' ? 'in_progress' : activeStore.installation.status
      });
  };

  const handleTimeChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val) updateNode(index, val, true);
      else updateNode(index, '', false);
  };

  const handleImageUpload = (index: number, e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          updateNode(index, url, true);
          e.target.value = '';
      }
  };

  const handleRemoveImage = (index: number) => {
      updateNode(index, '', false);
  };

  const handleSubmit = () => {
      if (!activeStore) return;
      updateStoreInstallation(activeStore.id, { status: 'pending_review' });
      setIsDetailModalOpen(false);
  };

  // Audit Actions
  const handleAudit = (pass: boolean) => {
      if (!activeStore) return;
      
      const newStatus: InstallStatus = pass ? 'approved' : 'unstarted'; // Reset to unstarted/in_progress if rejected logic dictates
      // Revert to 'in_progress' might be better to keep data but 'rejected' implies rework. 
      // Requirement says: "重新变为【未提交】的状态" -> effectively 'in_progress' (assuming data is kept) or 'unstarted'.
      // Let's use 'rejected' as a visual state that acts like 'in_progress' but shows red.
      
      const statusToSet: InstallStatus = pass ? 'approved' : 'rejected';

      updateStoreInstallation(activeStore.id, { status: statusToSet });
      setIsAuditModalOpen(false);
  };

  return (
    <div className="space-y-4">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-0 z-10">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                <Store size={12} /> 安装筛选
            </h3>
            <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedRegion}
                        onChange={(e) => { setSelectedRegion(e.target.value); setSelectedStoreId(''); }}
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
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                    >
                        <option value="">全部门店</option>
                        {filteredStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>
        </div>

        {/* Store List */}
        <div className="space-y-3">
            {filteredStores.map(store => {
                const install = store.installation!;
                const progress = getProgress(install.nodes);
                const statusConfig = getStatusConfig(install.status);
                const isCompleted = install.status === 'approved';

                return (
                    <div 
                        key={store.id} 
                        onClick={() => handleOpenDetail(store)}
                        className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all hover:shadow-md relative overflow-hidden group
                            ${isCompleted ? 'border-green-200' : 'border-slate-100'}
                        `}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">{store.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusConfig.color}`}>
                                        <statusConfig.icon size={10} />
                                        {statusConfig.label}
                                    </span>
                                    {install.appointmentTime && (
                                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                                            <Calendar size={10} />
                                            {install.appointmentTime.replace('T', ' ')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Audit Button */}
                            {install.status === 'pending_review' && (
                                <button 
                                    onClick={(e) => handleOpenAudit(e, store)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 animate-pulse"
                                >
                                    <Gavel size={14} /> 审核
                                </button>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                                <span>安装进度</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Arrow hint */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                );
            })}
            {filteredStores.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">没有找到门店数据</div>
            )}
        </div>

        {/* Detail Modal */}
        {isDetailModalOpen && activeStore && activeStore.installation && (
            <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Hammer size={18} className="text-blue-600" />
                                安装进度详情
                            </h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">{activeStore.name}</p>
                        </div>
                        <button onClick={() => setIsDetailModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                    </div>

                    <div className="p-4 overflow-y-auto flex-1 space-y-6">
                        {/* Timeline */}
                        <div className="relative pl-4 border-l-2 border-slate-100 space-y-8">
                            {activeStore.installation.nodes.map((node, index) => (
                                <div key={index} className="relative">
                                    {/* Node Dot */}
                                    <div className={`absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white transition-colors z-10
                                        ${node.completed ? 'border-green-500 text-green-500' : 'border-slate-300 text-slate-300'}
                                    `}>
                                        <div className={`w-2 h-2 rounded-full ${node.completed ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${node.completed ? 'text-green-700' : 'text-slate-600'}`}>
                                            {node.name}
                                            {node.completed && <CheckCircle size={14} />}
                                        </h4>

                                        {/* Node 1: Time Input */}
                                        {index === 0 && (
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <input 
                                                    type="datetime-local" 
                                                    value={node.data || ''}
                                                    onChange={(e) => handleTimeChange(index, e)}
                                                    disabled={activeStore.installation?.status === 'pending_review' || activeStore.installation?.status === 'approved'}
                                                    className="w-full text-xs border border-slate-200 rounded p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100"
                                                />
                                            </div>
                                        )}

                                        {/* Nodes 2-6: Image Upload */}
                                        {index > 0 && (
                                            <div>
                                                {node.completed && node.data ? (
                                                    <div className="relative w-24 h-24 rounded-lg border border-slate-200 overflow-hidden group">
                                                        <img src={node.data} alt={node.name} className="w-full h-full object-cover" />
                                                        {activeStore.installation?.status !== 'pending_review' && activeStore.installation?.status !== 'approved' && (
                                                            <button 
                                                                onClick={() => handleRemoveImage(index)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center relative hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer group">
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={(e) => handleImageUpload(index, e)}
                                                            disabled={activeStore.installation?.status === 'pending_review' || activeStore.installation?.status === 'approved'}
                                                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                        />
                                                        <Upload size={20} className="text-slate-300 group-hover:text-blue-400 mb-1" />
                                                        <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-bold">上传凭证</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        {activeStore.installation.status === 'pending_review' ? (
                            <div className="w-full py-2.5 bg-orange-100 text-orange-700 text-center text-sm font-bold rounded-lg border border-orange-200">
                                等待审核中...
                            </div>
                        ) : activeStore.installation.status === 'approved' ? (
                             <div className="w-full py-2.5 bg-green-100 text-green-700 text-center text-sm font-bold rounded-lg border border-green-200 flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> 审核通过 - 已完成
                            </div>
                        ) : (
                            <button 
                                onClick={handleSubmit}
                                disabled={!activeStore.installation.nodes.every(n => n.completed)}
                                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                提交审核
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Audit Modal */}
        {isAuditModalOpen && activeStore && (
            <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 animate-scaleIn">
                    <h3 className="font-bold text-lg mb-2 text-slate-800 flex items-center gap-2">
                        <Gavel size={20} className="text-blue-600" />
                        安装进度审核
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                        您正在审核 <strong>{activeStore.name}</strong> 的安装完成情况。
                        请确认所有节点已按要求完成。
                    </p>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleAudit(false)}
                            className="flex-1 py-3 border border-red-200 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors"
                        >
                            驳回 (需重新提交)
                        </button>
                        <button 
                            onClick={() => handleAudit(true)}
                            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transition-colors"
                        >
                            审核通过
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};