import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, Plus, Map, Store as StoreIcon, Settings as SettingsIcon, LogOut, User } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
      currentUser, logout,
      regions, stores, deviceTypes, 
      addRegion, removeRegion, 
      addStore, removeStore, 
      addDeviceType, removeDeviceType 
  } = useApp();

  const [newRegion, setNewRegion] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreRegionId, setNewStoreRegionId] = useState('');
  const [newType, setNewType] = useState('');

  const handleAddRegion = () => {
    if (newRegion.trim()) {
      addRegion(newRegion);
      setNewRegion('');
    }
  };

  const handleAddStore = () => {
    if (newStoreName.trim() && newStoreRegionId) {
      addStore(newStoreName, newStoreRegionId);
      setNewStoreName('');
      setNewStoreRegionId('');
    }
  };

  const handleAddType = () => {
    if (newType.trim()) {
      addDeviceType(newType);
      setNewType('');
    }
  };

  return (
    <div className="p-4 space-y-6">

        {/* User Profile Card */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-xl shadow-md border border-slate-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/50">
                    <User size={20} />
                </div>
                <div>
                    <p className="text-xs text-slate-300">当前用户</p>
                    <p className="font-bold text-sm">{currentUser || 'Guest'}</p>
                </div>
            </div>
            <button 
                onClick={logout}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs"
            >
                <LogOut size={14} />
                <span>退出</span>
            </button>
        </div>
      
        {/* Regions */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <Map size={18} />
            </div>
            <h2 className="text-sm font-bold text-slate-800">大区管理</h2>
          </div>
          
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="输入大区名称" 
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
              value={newRegion}
              onChange={e => setNewRegion(e.target.value)}
            />
            <button 
              onClick={handleAddRegion}
              className="bg-primary text-white p-2 rounded-lg hover:bg-blue-600 shadow-sm"
            >
              <Plus size={20} />
            </button>
          </div>
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {regions.map(r => (
              <li key={r.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">{r.name}</span>
                <button 
                  onClick={() => removeRegion(r.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Stores */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <StoreIcon size={18} />
            </div>
            <h2 className="text-sm font-bold text-slate-800">门店管理</h2>
          </div>
          <div className="flex flex-col gap-3 mb-4">
            <select 
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 w-full"
              value={newStoreRegionId}
              onChange={e => setNewStoreRegionId(e.target.value)}
            >
              <option value="">选择所属大区</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="输入门店名称" 
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                value={newStoreName}
                onChange={e => setNewStoreName(e.target.value)}
              />
              <button 
                onClick={handleAddStore}
                className="bg-primary text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 shadow-sm"
                disabled={!newStoreRegionId}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {stores.map(s => (
              <li key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">{s.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {regions.find(r => r.id === s.regionId)?.name || '未知大区'}
                  </span>
                </div>
                <button 
                  onClick={() => removeStore(s.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Device Types */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2">
            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                <SettingsIcon size={18} />
            </div>
            <h2 className="text-sm font-bold text-slate-800">设备类型</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="输入设备类型" 
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
              value={newType}
              onChange={e => setNewType(e.target.value)}
            />
            <button 
              onClick={handleAddType}
              className="bg-primary text-white p-2 rounded-lg hover:bg-blue-600 shadow-sm"
            >
              <Plus size={20} />
            </button>
          </div>
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {deviceTypes.map(t => (
              <li key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">{t.name}</span>
                <button 
                  onClick={() => removeDeviceType(t.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Spacer for scroll */}
        <div className="h-10"></div>
    </div>
  );
};
