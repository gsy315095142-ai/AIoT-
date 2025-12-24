import React from 'react';
import { useSettingsLogic } from '../hooks/useSettingsLogic';
import { UserProfileCard, ManagementSection, ListItem } from '../components/SettingsComponents';
import { Map, Store as StoreIcon, Settings as SettingsIcon, Plus } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
      currentUser, logout,
      regions, stores, deviceTypes,
      newRegion, setNewRegion, handleAddRegion, removeRegion,
      newStoreName, setNewStoreName, newStoreRegionId, setNewStoreRegionId, handleAddStore, removeStore,
      newType, setNewType, handleAddType, removeDeviceType
  } = useSettingsLogic();

  return (
    <div className="p-4 space-y-6 pb-20">
        <UserProfileCard currentUser={currentUser} onLogout={logout} />
      
        {/* Regions */}
        <ManagementSection title="大区管理" icon={Map} iconColorClass="bg-blue-100 text-blue-600">
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    placeholder="输入大区名称" 
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newRegion}
                    onChange={e => setNewRegion(e.target.value)}
                />
                <button onClick={handleAddRegion} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 shadow-sm">
                    <Plus size={20} />
                </button>
            </div>
            <ul className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                {regions.map(r => (
                    <ListItem key={r.id} label={r.name} onDelete={() => removeRegion(r.id)} />
                ))}
            </ul>
        </ManagementSection>

        {/* Stores */}
        <ManagementSection title="门店管理" icon={StoreIcon} iconColorClass="bg-indigo-100 text-indigo-600">
             <div className="flex flex-col gap-3 mb-4">
                <select 
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newStoreName}
                        onChange={e => setNewStoreName(e.target.value)}
                    />
                    <button 
                        onClick={handleAddStore}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                        disabled={!newStoreRegionId}
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
            <ul className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                {stores.map(s => (
                    <ListItem 
                        key={s.id} 
                        label={s.name} 
                        subLabel={regions.find(r => r.id === s.regionId)?.name || '未知大区'}
                        onDelete={() => removeStore(s.id)} 
                    />
                ))}
            </ul>
        </ManagementSection>

        {/* Device Types */}
        <ManagementSection title="设备类型" icon={SettingsIcon} iconColorClass="bg-orange-100 text-orange-600">
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    placeholder="输入设备类型" 
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                />
                <button onClick={handleAddType} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 shadow-sm">
                    <Plus size={20} />
                </button>
            </div>
            <ul className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                {deviceTypes.map(t => (
                    <ListItem key={t.id} label={t.name} onDelete={() => removeDeviceType(t.id)} />
                ))}
            </ul>
        </ManagementSection>
        
        <div className="h-10"></div>
    </div>
  );
};