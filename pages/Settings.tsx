import React from 'react';
import { useSettingsLogic } from '../hooks/useSettingsLogic';
import { UserProfileCard, ManagementSection, ListItem } from '../components/SettingsComponents';
import { Map, Settings as SettingsIcon, Plus, Truck, UserPlus } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
      currentUser, logout,
      regions, deviceTypes, suppliers, assignableUsers,
      newRegion, setNewRegion, handleAddRegion, updateRegion, removeRegion,
      newType, setNewType, handleAddType, removeDeviceType,
      newSupplier, setNewSupplier, handleAddSupplier, updateSupplier, removeSupplier,
      newAssigneeName, setNewAssigneeName,
      newAssigneeAccount, setNewAssigneeAccount,
      newAssigneeRole, setNewAssigneeRole,
      handleAddAssignee, removeAssignableUser
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

        {/* Assignable Users - New Section */}
        <ManagementSection title="指派人员" icon={UserPlus} iconColorClass="bg-green-100 text-green-600">
            <div className="flex flex-col gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="姓名" 
                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newAssigneeName}
                        onChange={e => setNewAssigneeName(e.target.value)}
                    />
                    <input 
                        type="text" 
                        placeholder="账号" 
                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newAssigneeAccount}
                        onChange={e => setNewAssigneeAccount(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="权限/角色 (如: 实施工程师)" 
                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={newAssigneeRole}
                        onChange={e => setNewAssigneeRole(e.target.value)}
                    />
                    <button onClick={handleAddAssignee} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm whitespace-nowrap">
                        添加人员
                    </button>
                </div>
            </div>
            <ul className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                {assignableUsers.map(u => (
                    <ListItem 
                        key={u.id} 
                        label={`${u.name} (${u.role})`} 
                        subLabel={`账号: ${u.account}`}
                        onDelete={() => removeAssignableUser(u.id)} 
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