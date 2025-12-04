import React, { useState, useMemo, ChangeEvent } from 'react';
import { useApp } from '../context/AppContext';
import { FilterBar } from '../components/FilterBar';
import { Device, OpsStatus, DeviceStatus } from '../types';
import { ChevronDown, ChevronUp, Plus, Wifi, Cpu, HardDrive, Image as ImageIcon, MapPin, MonitorSmartphone, Settings } from 'lucide-react';

export const DeviceManagement: React.FC = () => {
  const { devices, regions, stores, deviceTypes, updateDevice, addDevice } = useApp();
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeviceForm, setNewDeviceForm] = useState({
    name: '', sn: '', regionId: '', storeId: '', typeId: '', roomNumber: '', softwareName: '', imageUrl: ''
  });

  // Filter Logic
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (selectedRegion && d.regionId !== selectedRegion) return false;
      if (selectedStore && d.storeId !== selectedStore) return false;
      if (selectedType && d.typeId !== selectedType) return false;
      return true;
    });
  }, [devices, selectedRegion, selectedStore, selectedType]);

  // Helpers
  const getStoreName = (id: string) => stores.find(s => s.id === id)?.name || '-';
  const getTypeName = (id: string) => deviceTypes.find(t => t.id === id)?.name || '-';

  const toggleExpand = (id: string) => {
    setExpandedDeviceId(expandedDeviceId === id ? null : id);
  };

  const handleOpsStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, deviceId: string) => {
    e.stopPropagation();
    updateDevice(deviceId, { opsStatus: e.target.value as OpsStatus });
  };

  // Add Device Handlers
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setNewDeviceForm(prev => ({ ...prev, imageUrl: url }));
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceForm.regionId || !newDeviceForm.storeId || !newDeviceForm.typeId) return;

    addDevice(newDeviceForm);
    setIsAddModalOpen(false);
    setNewDeviceForm({
        name: '', sn: '', regionId: '', storeId: '', typeId: '', roomNumber: '', softwareName: '', imageUrl: ''
    });
  };

  const DeviceDetailCard: React.FC<{ device: Device }> = ({ device }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: device.name,
        sn: device.sn,
        roomNumber: device.roomNumber,
        softwareName: device.softwareName
    });

    const saveEdit = () => {
        updateDevice(device.id, editForm);
        setIsEditing(false);
    };

    return (
      <div className="bg-slate-50 p-4 border-t border-slate-100 text-sm animate-fadeIn">
        
        {/* Image */}
        <div className="w-full h-40 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden mb-4 relative group">
            {device.imageUrl ? (
            <img src={device.imageUrl} alt={device.name} className="w-full h-full object-cover" />
            ) : (
            <ImageIcon className="text-slate-300" size={32} />
            )}
        </div>

        {/* Edit Form */}
        {isEditing ? (
             <div className="space-y-3 mb-4">
                <div>
                    <label className="text-xs text-slate-500">设备名称</label>
                    <input className="w-full border rounded px-2 py-1 bg-white" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs text-slate-500">SN号</label>
                    <input className="w-full border rounded px-2 py-1 bg-white" value={editForm.sn} onChange={e => setEditForm({...editForm, sn: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs text-slate-500">房间号</label>
                    <input className="w-full border rounded px-2 py-1 bg-white" value={editForm.roomNumber} onChange={e => setEditForm({...editForm, roomNumber: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs text-slate-500">体验软件</label>
                    <input className="w-full border rounded px-2 py-1 bg-white" value={editForm.softwareName} onChange={e => setEditForm({...editForm, softwareName: e.target.value})} />
                </div>
                <div className="flex gap-2 pt-2">
                    <button onClick={saveEdit} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded text-xs font-bold shadow">保存</button>
                    <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded text-xs font-bold">取消</button>
                 </div>
             </div>
        ) : (
             <div className="space-y-2 mb-4">
                 <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">房间号</span>
                    <span className="font-medium text-slate-800">{device.roomNumber || '-'}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">体验软件</span>
                    <span className="font-medium text-slate-800">{device.softwareName || '-'}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">首次启动</span>
                    <span className="font-medium text-slate-800">{new Date(device.firstStartTime).toLocaleDateString()}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">最近测试</span>
                    <span className="font-medium text-slate-800">{new Date(device.lastTestTime).toLocaleDateString()}</span>
                 </div>
                 <button onClick={() => setIsEditing(true)} className="w-full mt-2 bg-white border border-slate-300 text-slate-600 py-2 rounded text-xs font-bold">
                  编辑设备信息
                </button>
             </div>
        )}

        {/* Hardware Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white p-2 rounded border border-slate-200 flex flex-col items-center">
                <Cpu className="text-blue-500 mb-1" size={16}/>
                <span className="text-[10px] text-slate-500">CPU</span>
                <span className="text-xs font-bold text-slate-800">{device.cpuUsage}%</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 flex flex-col items-center">
                <HardDrive className="text-purple-500 mb-1" size={16}/>
                <span className="text-[10px] text-slate-500">内存</span>
                <span className="text-xs font-bold text-slate-800">{device.memoryUsage}%</span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 flex flex-col items-center">
                <Wifi className="text-green-500 mb-1" size={16}/>
                <span className="text-[10px] text-slate-500">信号</span>
                <span className="text-xs font-bold text-slate-800">{device.signalStrength}</span>
            </div>
        </div>
        
        {/* Events */}
        <div>
            <h4 className="font-bold text-slate-700 mb-2 text-xs uppercase">最新事件</h4>
            <div className="bg-white rounded border border-slate-200 max-h-32 overflow-y-auto">
                {device.events.length === 0 ? (
                    <p className="p-3 text-slate-400 text-xs text-center">暂无事件记录</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {device.events.map(e => (
                            <li key={e.id} className="p-2 text-xs flex gap-2">
                                <span className="text-slate-400 whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <span className={e.type === 'error' ? 'text-red-500' : e.type === 'warning' ? 'text-yellow-600' : 'text-slate-700'}>
                                    {e.message}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      {/* Action Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">设备列表 ({filteredDevices.length})</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-blue-600 text-white p-2 rounded-full shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>
      
      <FilterBar 
        regions={regions}
        stores={stores}
        deviceTypes={deviceTypes}
        selectedRegion={selectedRegion}
        selectedStore={selectedStore}
        selectedType={selectedType}
        onRegionChange={setSelectedRegion}
        onStoreChange={setSelectedStore}
        onTypeChange={setSelectedType}
      />

      {/* Device List (Mobile Cards) */}
      <div className="space-y-3 pb-20">
        {filteredDevices.length === 0 ? (
            <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                <MonitorSmartphone size={48} className="mb-4 opacity-20" />
                <span>暂无符合条件的设备</span>
            </div>
        ) : (
            filteredDevices.map(device => (
            <div 
                key={device.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
            >
                {/* Card Header (Always Visible) */}
                <div 
                    className="p-4 cursor-pointer active:bg-slate-50 transition-colors"
                    onClick={() => toggleExpand(device.id)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{device.name}</span>
                                <span className={`w-2 h-2 rounded-full ${device.status === DeviceStatus.ONLINE ? 'bg-green-500' : device.status === DeviceStatus.OFFLINE ? 'bg-slate-400' : device.status === DeviceStatus.IN_USE ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">{device.sn}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border
                            ${device.status === DeviceStatus.ONLINE ? 'bg-green-50 text-green-600 border-green-100' : 
                              device.status === DeviceStatus.OFFLINE ? 'bg-slate-50 text-slate-500 border-slate-100' :
                              device.status === DeviceStatus.IN_USE ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                              'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>
                            {device.status}
                        </span>
                    </div>

                    <div className="flex items-center text-xs text-slate-500 mb-3 gap-4">
                        <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            <span>{getStoreName(device.storeId)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Settings size={12} />
                            <span>{getTypeName(device.typeId)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-50" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">运维状态</span>
                             <select 
                                value={device.opsStatus}
                                onChange={(e) => handleOpsStatusChange(e, device.id)}
                                className={`text-xs font-bold bg-transparent border-none p-0 cursor-pointer focus:ring-0
                                    ${device.opsStatus === OpsStatus.ABNORMAL ? 'text-red-500' : 
                                      device.opsStatus === OpsStatus.REPAIRING ? 'text-yellow-600' : 
                                      device.opsStatus === OpsStatus.INSPECTED ? 'text-green-600' : 'text-slate-600'}`}
                            >
                                {Object.values(OpsStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <button onClick={() => toggleExpand(device.id)} className="text-slate-400">
                             {expandedDeviceId === device.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    </div>
                </div>

                {/* Expanded Detail View */}
                {expandedDeviceId === device.id && (
                    <DeviceDetailCard device={device} />
                )}
            </div>
            ))
        )}
      </div>

      {/* Add Device Mobile Modal (Full Screen Overlay) */}
      {isAddModalOpen && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-fadeIn">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-lg font-bold text-slate-800">添加新设备</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                  <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备名称 *</label>
                            <input required type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={newDeviceForm.name} onChange={e => setNewDeviceForm({...newDeviceForm, name: e.target.value})} placeholder="例如: VR-009" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SN号 *</label>
                            <input required type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={newDeviceForm.sn} onChange={e => setNewDeviceForm({...newDeviceForm, sn: e.target.value})} placeholder="例如: SN-2024-XXXX" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属大区 *</label>
                            <select required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                                value={newDeviceForm.regionId} onChange={e => setNewDeviceForm({...newDeviceForm, regionId: e.target.value, storeId: ''})}
                            >
                                <option value="">请选择大区</option>
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属门店 *</label>
                            <select required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                                value={newDeviceForm.storeId} onChange={e => setNewDeviceForm({...newDeviceForm, storeId: e.target.value})}
                                disabled={!newDeviceForm.regionId}
                            >
                                <option value="">请选择门店</option>
                                {stores.filter(s => s.regionId === newDeviceForm.regionId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备类型 *</label>
                            <select required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50"
                                value={newDeviceForm.typeId} onChange={e => setNewDeviceForm({...newDeviceForm, typeId: e.target.value})}
                            >
                                <option value="">请选择类型</option>
                                {deviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">房间号码</label>
                            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={newDeviceForm.roomNumber} onChange={e => setNewDeviceForm({...newDeviceForm, roomNumber: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">体验软件名称</label>
                            <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50" 
                                value={newDeviceForm.softwareName} onChange={e => setNewDeviceForm({...newDeviceForm, softwareName: e.target.value})} />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">设备缩略图</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 z-10 w-full h-full" />
                                {newDeviceForm.imageUrl ? (
                                    <img src={newDeviceForm.imageUrl} alt="Preview" className="h-32 object-contain rounded-md" />
                                ) : (
                                    <>
                                        <ImageIcon className="text-slate-400 mb-2" size={32} />
                                        <span className="text-xs text-slate-500">点击上传图片</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-10"></div>
                </form>
            </div>
            
            <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0">
                 <button 
                    onClick={handleAddSubmit}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 active:scale-98 transition-transform"
                 >
                    确认添加设备
                 </button>
            </div>
        </div>
      )}
    </div>
  );
};