import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Store as StoreIcon, Plus, Edit2, Trash2, X, Store } from 'lucide-react';
import { Store as StoreType } from '../../types';

export const RoomArchive: React.FC = () => {
  const { regions, stores, addStore, updateStore, removeStore } = useApp();

  // Store Management Modal State
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [storeForm, setStoreForm] = useState({
      id: '',
      name: '',
      regionId: '',
      roomListStr: ''
  });

  const openAddStoreModal = () => {
      setEditingStoreId(null);
      setStoreForm({ id: '', name: '', regionId: '', roomListStr: '' });
      setIsStoreModalOpen(true);
  };

  const openEditStoreModal = (store: StoreType) => {
      setEditingStoreId(store.id);
      setStoreForm({
          id: store.id,
          name: store.name,
          regionId: store.regionId,
          roomListStr: (store.roomList || []).join(', ')
      });
      setIsStoreModalOpen(true);
  };

  const handleStoreSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const rooms = storeForm.roomListStr.split(/[,，、\s]+/).map(s => s.trim()).filter(Boolean);

      if (editingStoreId) {
          // Update
          updateStore(editingStoreId, {
              name: storeForm.name,
              regionId: storeForm.regionId,
              roomList: rooms
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
              roomList: rooms
          });
      }
      setIsStoreModalOpen(false);
  };

  const handleDeleteStore = (id: string, name: string) => {
      if (window.confirm(`确定要删除门店 "${name}" 吗？此操作不可恢复。`)) {
          removeStore(id);
      }
  };

  return (
    <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
        <h3 className="text-sm font-bold text-blue-800 mb-1">客房数据归档</h3>
        <p className="text-xs text-blue-600 opacity-80">在此处管理门店及其下属客房的基础信息。</p>
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

        <div className="space-y-3">
            {stores.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">暂无门店数据，请点击上方按钮添加</div>
            )}
            {stores.map(s => {
                const regionName = regions.find(r => r.id === s.regionId)?.name || '未知大区';
                const roomCount = s.roomList?.length || 0;
                return (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-2">
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
                        <div className="border-t border-slate-200 pt-2">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">客房列表 ({roomCount})</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed break-words">
                                {roomCount > 0 ? (s.roomList || []).join(', ') : <span className="opacity-50 italic">暂无客房信息</span>}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
        </div>

        {/* Store Modal */}
        {isStoreModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-scaleIn">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Store size={20} className="text-blue-600" />
                            {editingStoreId ? '编辑门店' : '新增门店'}
                        </h3>
                        <button onClick={() => setIsStoreModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    <form onSubmit={handleStoreSubmit} className="p-5 space-y-4">
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
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">客房列表</label>
                            <textarea 
                            className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-24 resize-none"
                            value={storeForm.roomListStr}
                            onChange={e => setStoreForm({...storeForm, roomListStr: e.target.value})}
                            placeholder="输入客房号，使用逗号、空格或顿号分隔 (例如: 101, 102, 103)"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">提示：多个房号请用逗号隔开</p>
                        </div>
                        
                        <div className="pt-2">
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