import React from 'react';
import { useSettingsLogic } from '../hooks/useSettingsLogic';
import { UserProfileCard, ManagementSection, ListItem } from '../components/SettingsComponents';
import { Map, Settings as SettingsIcon, Plus, Truck } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
      currentUser, logout,
      regions, deviceTypes, suppliers,
      newRegion, setNewRegion, handleAddRegion, updateRegion, removeRegion,
      newType, setNewType, handleAddType, removeDeviceType,
      newSupplier, setNewSupplier, handleAddSupplier, updateSupplier, removeSupplier
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
                    <ListItem 
                        key={r.id} 
                        label={r.name} 
                        onDelete={() => removeRegion(r.id)} 
                        onUpdate={(newName) => updateRegion(r.id, newName)}
                    />
                ))}
            </ul>
        </ManagementSection>

        {/* Suppliers - New Section */}
        <ManagementSection title="供应商配置" icon={Truck} iconColorClass="bg-purple-100 text-purple-600">
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    placeholder="输入供应商名称" 
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newSupplier}
                    onChange={e => setNewSupplier(e.target.value)}
                />
                <button onClick={handleAddSupplier} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 shadow-sm">
                    <Plus size={20} />
                </button>
            </div>
            <ul className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                {suppliers.map(s => (
                    <ListItem 
                        key={s.id} 
                        label={s.name} 
                        onDelete={() => removeSupplier(s.id)} 
                        onUpdate={(newName) => updateSupplier(s.id, newName)}
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