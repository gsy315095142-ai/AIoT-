import React, { useState, ChangeEvent } from 'react';
import { Hammer, Store, ChevronDown, Clock, CheckCircle, Upload, X, Calendar, ClipboardList, AlertCircle, ArrowRight, Gavel, BedDouble } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Store as StoreType, InstallNode, InstallStatus, RoomImageCategory } from '../../types';

export const RoomInstall: React.FC = () => {
  const { regions, stores, updateStoreInstallation } = useApp();
  
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  
  // Modals & Active State
  const [activeStore, setActiveStore] = useState<StoreType | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

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
      setRejectMode(false);
      setRejectReason('');
  };

  const handleOpenAudit = (e: React.MouseEvent, store: StoreType) => {
      e.stopPropagation();
      setActiveStore(store);
      setIsDetailModalOpen(true); // Open the same modal
      setRejectMode(false);
      setRejectReason('');
  };

  // Node Updates (Inside Detail Modal)
  const updateNode = (targetIndex: number, newData: any) => {
      if (!activeStore || !activeStore.installation) return;
      
      const newNodes = [...activeStore.installation.nodes];
      
      // 1. Update the data for the target node
      newNodes[targetIndex] = { ...newNodes[targetIndex], data: newData };

      // 2. Recalculate completion status for ALL nodes sequentially
      // This ensures Requirement 1.2: If prev node is incomplete, current node is incomplete.
      for (let i = 0; i < newNodes.length; i++) {
          let isComplete = false;
          const currentNode = newNodes[i];

          // --- Data Sufficiency Check ---
          if (i === 0) {
              // Node 0: Appointment Time
              isComplete = !!currentNode.data;
          } else if (i === 3) {
              // Node 3: Install Complete (Complex Check - Requirement 1.1)
              // Must have data for ALL rooms and ALL categories
              const roomData = currentNode.data || {};
              const rooms = activeStore.rooms;
              const categories: RoomImageCategory[] = ['玄关', '桌面', '床'];

              if (rooms.length > 0) {
                  const allRoomsComplete = rooms.every(room => {
                      const rData = roomData[room.number] || {};
                      // Check if every category has at least one image
                      return categories.every(cat => 
                          Array.isArray(rData[cat]) && rData[cat].length > 0
                      );
                  });
                  isComplete = allRoomsComplete;
              } else {
                  isComplete = false; // No rooms means cannot be complete
              }
          } else {
              // Other Nodes: Simple Image List
              isComplete = Array.isArray(currentNode.data) && currentNode.data.length > 0;
          }

          // --- Sequential Dependency Check (Requirement 1.2) ---
          // If previous node is not complete, this node cannot be complete
          if (i > 0 && !newNodes[i - 1].completed) {
              isComplete = false;
          }

          newNodes[i].completed = isComplete;
      }

      // Also update Appointment Time shortcut if it's the first node
      const extraUpdates: any = {};
      if (targetIndex === 0) extraUpdates.appointmentTime = newData;

      const updatedStore = {
          ...activeStore,
          installation: { 
              ...activeStore.installation, 
              nodes: newNodes, 
              ...extraUpdates, 
              status: activeStore.installation.status === 'unstarted' ? 'in_progress' : activeStore.installation.status 
          }
      };
      
      setActiveStore(updatedStore);
      updateStoreInstallation(activeStore.id, { 
          nodes: newNodes, 
          ...extraUpdates,
          status: activeStore.installation.status === 'unstarted' ? 'in_progress' : activeStore.installation.status
      });
  };

  // --- Input Handlers ---

  const handleTimeChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      updateNode(index, val);
  };

  const handleSimpleImageUpload = (index: number, e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const currentNode = activeStore?.installation?.nodes[index];
          const currentImages: string[] = Array.isArray(currentNode?.data) ? currentNode.data : [];
          const newImages = [...currentImages, url];
          updateNode(index, newImages);
          e.target.value = '';
      }
  };

  const removeSimpleImage = (index: number, imgIndex: number) => {
      const currentNode = activeStore?.installation?.nodes[index];
      const currentImages: string[] = Array.isArray(currentNode?.data) ? currentNode.data : [];
      const newImages = currentImages.filter((_, i) => i !== imgIndex);
      updateNode(index, newImages);
  };

  // Complex Node: Install Complete (Room -> Module -> Images)
  const handleRoomImageUpload = (index: number, roomNumber: string, category: RoomImageCategory, e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const currentNode = activeStore?.installation?.nodes[index];
          const currentData = (currentNode?.data && typeof currentNode.data === 'object' && !Array.isArray(currentNode.data)) ? currentNode.data : {};
          
          const roomData = currentData[roomNumber] || {};
          const categoryImages = roomData[category] || [];
          
          const newData = {
              ...currentData,
              [roomNumber]: {
                  ...roomData,
                  [category]: [...categoryImages, url]
              }
          };
          
          updateNode(index, newData);
          e.target.value = '';
      }
  };

  const removeRoomImage = (index: number, roomNumber: string, category: RoomImageCategory, imgIndex: number) => {
      const currentNode = activeStore?.installation?.nodes[index];
      const currentData = currentNode?.data || {};
      const roomData = currentData[roomNumber] || {};
      const categoryImages = roomData[category] || [];
      
      const newData = {
          ...currentData,
          [roomNumber]: {
              ...roomData,
              [category]: categoryImages.filter((_: string, i: number) => i !== imgIndex)
          }
      };
      
      updateNode(index, newData);
  };

  const handleSubmit = () => {
      if (!activeStore) return;
      updateStoreInstallation(activeStore.id, { status: 'pending_review' });
      setIsDetailModalOpen(false);
  };

  // Audit Actions
  const handleAuditApprove = () => {
      if (!activeStore) return;
      updateStoreInstallation(activeStore.id, { status: 'approved' });
      setIsDetailModalOpen(false);
  };

  const handleAuditReject = () => {
      if (!activeStore) return;
      if (!rejectReason.trim()) {
          alert('请输入驳回原因');
          return;
      }
      updateStoreInstallation(activeStore.id, { status: 'rejected', rejectReason }); // Assuming rejected status goes back to 'in_progress' visually but red
      setIsDetailModalOpen(false);
  };

  const isAuditMode = activeStore?.installation?.status === 'pending_review';
  const isApproved = activeStore?.installation?.status === 'approved';
  const isLocked = isAuditMode || isApproved;

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

        {/* Detail Modal (Shared for Editing and Auditing) */}
        {isDetailModalOpen && activeStore && activeStore.installation && (
            <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Hammer size={18} className="text-blue-600" />
                                {isAuditMode ? '安装进度审核' : '安装进度详情'}
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
                                    <div className="w-full">
                                        <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${node.completed ? 'text-green-700' : 'text-slate-600'}`}>
                                            {node.name}
                                            {node.completed && <CheckCircle size={14} />}
                                        </h4>

                                        {/* Node 1: Time Input (Index 0) */}
                                        {index === 0 && (
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                <input 
                                                    type="datetime-local" 
                                                    value={node.data || ''}
                                                    onChange={(e) => handleTimeChange(index, e)}
                                                    disabled={isLocked}
                                                    className="w-full text-xs border border-slate-200 rounded p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-100"
                                                />
                                            </div>
                                        )}

                                        {/* Node 4: Installation Complete (Index 3) - Complex Structure */}
                                        {index === 3 && (
                                            <div className="space-y-3">
                                                {activeStore.rooms.map((room) => {
                                                    const roomData = (node.data && typeof node.data === 'object') ? node.data[room.number] || {} : {};
                                                    const categories: RoomImageCategory[] = ['玄关', '桌面', '床'];
                                                    
                                                    return (
                                                        <div key={room.number} className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                                                            <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center gap-2">
                                                                <BedDouble size={14} className="text-slate-500" />
                                                                <span className="text-xs font-bold text-slate-700">{room.number} ({room.type})</span>
                                                            </div>
                                                            <div className="p-3 grid grid-cols-1 gap-3">
                                                                {categories.map(cat => {
                                                                    const images = roomData[cat] || [];
                                                                    return (
                                                                        <div key={cat} className="bg-white border border-slate-100 rounded p-2">
                                                                            <div className="text-[10px] font-bold text-slate-500 mb-2 flex items-center gap-1">
                                                                                <div className="w-1 h-2 bg-blue-400 rounded-full"></div> {cat}
                                                                            </div>
                                                                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                                                                 {/* Upload Button */}
                                                                                {!isLocked && (
                                                                                    <div className="w-14 h-14 border border-dashed border-blue-200 rounded bg-blue-50 flex-shrink-0 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 relative">
                                                                                        <input 
                                                                                            type="file" 
                                                                                            accept="image/*" 
                                                                                            onChange={(e) => handleRoomImageUpload(index, room.number, cat, e)}
                                                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                                                        />
                                                                                        <Upload size={14} className="text-blue-400 mb-0.5" />
                                                                                        <span className="text-[8px] text-blue-500">上传</span>
                                                                                    </div>
                                                                                )}
                                                                                {/* Image List */}
                                                                                {images.map((url: string, imgIdx: number) => (
                                                                                    <div key={imgIdx} className="w-14 h-14 rounded border border-slate-200 overflow-hidden relative group flex-shrink-0">
                                                                                        <img src={url} alt={`${room.number}-${cat}`} className="w-full h-full object-cover" />
                                                                                        {!isLocked && (
                                                                                            <button 
                                                                                                onClick={() => removeRoomImage(index, room.number, cat, imgIdx)}
                                                                                                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100"
                                                                                            >
                                                                                                <X size={10} />
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                                {images.length === 0 && isLocked && (
                                                                                    <span className="text-[10px] text-slate-300 italic self-center">无图片</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {activeStore.rooms.length === 0 && (
                                                    <div className="text-[10px] text-slate-400 text-center py-2 bg-slate-50 rounded border border-dashed">该门店暂无客房数据</div>
                                                )}
                                            </div>
                                        )}

                                        {/* Other Nodes: Simple Multi-Image Upload (Index 1, 2, 4, 5) */}
                                        {index > 0 && index !== 3 && (
                                            <div>
                                                <div className="flex gap-2 flex-wrap">
                                                    {!isLocked && (
                                                        <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center relative hover:bg-slate-100 hover:border-blue-300 transition-all cursor-pointer group">
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                onChange={(e) => handleSimpleImageUpload(index, e)}
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                            />
                                                            <Upload size={16} className="text-slate-300 group-hover:text-blue-400 mb-1" />
                                                            <span className="text-[9px] text-slate-400 group-hover:text-blue-500 font-bold">上传</span>
                                                        </div>
                                                    )}
                                                    
                                                    {Array.isArray(node.data) && node.data.map((url, imgIdx) => (
                                                        <div key={imgIdx} className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden relative group bg-white">
                                                            <img src={url} alt={`${node.name}-${imgIdx}`} className="w-full h-full object-cover" />
                                                            {!isLocked && (
                                                                <button 
                                                                    onClick={() => removeSimpleImage(index, imgIdx)}
                                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {Array.isArray(node.data) && node.data.length === 0 && isLocked && (
                                                        <div className="text-[10px] text-slate-300 italic py-2">无上传凭证</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        {isAuditMode ? (
                            rejectMode ? (
                                <div className="space-y-3 animate-fadeIn">
                                    <textarea 
                                        autoFocus
                                        placeholder="请输入驳回原因..."
                                        className="w-full p-2 text-xs border border-red-200 rounded bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-300 min-h-[60px]"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setRejectMode(false)}
                                            className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded hover:bg-slate-50 text-xs"
                                        >
                                            取消
                                        </button>
                                        <button 
                                            onClick={handleAuditReject}
                                            className="flex-1 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 text-xs shadow-sm"
                                        >
                                            确认驳回
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setRejectMode(true)}
                                        className="flex-1 py-3 border border-red-200 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        驳回
                                    </button>
                                    <button 
                                        onClick={handleAuditApprove}
                                        className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transition-colors"
                                    >
                                        审核通过
                                    </button>
                                </div>
                            )
                        ) : isApproved ? (
                             <div className="w-full py-2.5 bg-green-100 text-green-700 text-center text-sm font-bold rounded-lg border border-green-200 flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> 审核通过 - 已完成
                            </div>
                        ) : activeStore.installation.status === 'rejected' ? (
                            <div className="space-y-2">
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                                    <span className="font-bold">驳回原因:</span> {activeStore.installation.rejectReason || '无详细原因'}
                                </div>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!activeStore.installation.nodes.every(n => n.completed)}
                                    className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    重新提交审核
                                </button>
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
    </div>
  );
};