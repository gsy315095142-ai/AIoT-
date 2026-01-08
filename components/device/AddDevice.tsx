import React, { useState, useMemo, ChangeEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DeviceImage } from '../../types';
import { CATEGORY_LIMITS, SUB_TYPE_MAPPING } from '../DeviceComponents';
import { Plus, X, ArrowLeft, Monitor } from 'lucide-react';

interface DeviceFormState {
  name: string;
  sn: string;
  mac: string;
  regionId: string;
  storeId: string;
  typeId: string;
  subType: string;
  supplierId: string; 
  orderId: string; 
  roomNumber: string;
  softwareName: string;
  firstStartTime: string; 
  images: DeviceImage[];
}

const initialFormState: DeviceFormState = {
  name: '', sn: '', mac: '', regionId: '', storeId: '', typeId: '', subType: '', supplierId: '', orderId: '', roomNumber: '', softwareName: '', firstStartTime: '', images: []
};

export const AddDevice: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { addDevice, regions, stores, deviceTypes, suppliers } = useApp();
    const [deviceForm, setDeviceForm] = useState<DeviceFormState>(initialFormState);

    // Initialize with data from scan or other source
    useEffect(() => {
        if (location.state) {
            setDeviceForm(prev => ({ ...prev, ...location.state }));
        }
    }, [location.state]);

    const imageCounts = useMemo(() => {
        const counts: Record<string, number> = { '设备外观': 0, '安装现场': 0, '其他': 0 };
        deviceForm.images.forEach(img => { if (counts[img.category] !== undefined) counts[img.category]++; });
        return counts;
    }, [deviceForm.images]);

    const handleAddFormImage = (e: ChangeEvent<HTMLInputElement>) => {
        const availableCategory = Object.keys(CATEGORY_LIMITS).find(cat => (imageCounts[cat] || 0) < CATEGORY_LIMITS[cat]);
        if (!availableCategory) { alert("所有分类图片的数量已达上限，无法继续添加"); e.target.value = ''; return; }
        if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          const newImage: DeviceImage = { url, category: availableCategory }; 
          setDeviceForm(prev => ({ ...prev, images: [newImage, ...prev.images] }));
          e.target.value = '';
        }
    };

    const handleRemoveFormImage = (index: number) => setDeviceForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

    const handleFormImageCategoryChange = (index: number, newCategory: string) => {
        setDeviceForm(prev => {
            const updatedImages = [...prev.images];
            updatedImages[index].category = newCategory;
            return { ...prev, images: updatedImages };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceForm.typeId || !deviceForm.name || !deviceForm.sn) {
            alert('请填写必要信息（名称、SN号、类型、供应商）');
            return;
        } 
        
        const imageUrl = deviceForm.images.length > 0 ? deviceForm.images[0].url : undefined;
        const fromInputDate = (dateStr: string) => dateStr.replace('T', ' ');
        const formattedDate = deviceForm.firstStartTime ? fromInputDate(deviceForm.firstStartTime) : new Date().toLocaleString();
        
        addDevice({ ...deviceForm, firstStartTime: formattedDate, imageUrl });
        // Return to Device Control
        navigate('/devices', { state: { activeTab: 'devices' } });
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button 
                    onClick={() => navigate('/devices', { state: { activeTab: 'devices' } })}
                    className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 text-xs font-bold px-3"
                >
                    <ArrowLeft size={14} /> 返回
                </button>
                <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Monitor size={18} className="text-blue-600" />
                    添加新设备
                </h1>
                <div className="w-16"></div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 pb-20">
                {/* Image Upload Section at Top */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">设备缩略图</label>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="aspect-square border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg flex flex-col items-center justify-center relative hover:bg-blue-100 transition-colors cursor-pointer">
                            <input type="file" accept="image/*" onChange={handleAddFormImage} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <Plus className="text-blue-500 mb-1" size={20} />
                            <span className="text-[9px] text-blue-600 font-bold">添加图片</span>
                        </div>
                        {deviceForm.images.map((img, index) => (
                            <div key={index} className="aspect-square rounded-lg border border-slate-200 relative group overflow-hidden bg-slate-100">
                                <img src={img.url} alt={`preview-${index}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => handleRemoveFormImage(index)} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-80 hover:opacity-100"><X size={10} /></button>
                                <div className="absolute bottom-0 left-0 right-0 p-0.5 bg-white/90">
                                    <select 
                                        value={img.category} 
                                        onChange={(e) => handleFormImageCategoryChange(index, e.target.value)}
                                        className="w-full text-[8px] bg-transparent border-none p-0 focus:ring-0 text-center font-bold text-slate-700"
                                    >
                                        {Object.entries(CATEGORY_LIMITS).map(([cat, limit]) => {
                                            const count = imageCounts[cat] || 0;
                                            const isFull = count >= limit;
                                            const isCurrent = img.category === cat;
                                            return <option key={cat} value={cat} disabled={isFull && !isCurrent}>{cat} ({count}/{limit})</option>;
                                        })}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备名称 *</label><input required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.name} onChange={e => setDeviceForm({...deviceForm, name: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">SN号码 *</label><input required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.sn} onChange={e => setDeviceForm({...deviceForm, sn: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">MAC地址</label><input className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.mac} onChange={e => setDeviceForm({...deviceForm, mac: e.target.value})} placeholder="XX:XX:XX:XX:XX:XX" /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属大区</label><select className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={deviceForm.regionId} onChange={e => setDeviceForm({...deviceForm, regionId: e.target.value})}><option value="">选择大区</option>{regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">所属门店</label><select className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={deviceForm.storeId} onChange={e => setDeviceForm({...deviceForm, storeId: e.target.value})}><option value="">选择门店</option>{stores.filter(s => !deviceForm.regionId || s.regionId === deviceForm.regionId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备类型 *</label>
                         <select required className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" value={deviceForm.typeId} onChange={e => setDeviceForm({...deviceForm, typeId: e.target.value, subType: ''})}>
                             <option value="">选择类型</option>
                             {deviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                         </select>
                     </div>
                     
                     {/* Sub Type Dropdown */}
                     {(() => {
                         const selectedTypeName = deviceTypes.find(t => t.id === deviceForm.typeId)?.name;
                         const subTypeOptions = selectedTypeName ? SUB_TYPE_MAPPING[selectedTypeName] : undefined;
                         if (!subTypeOptions) return null;
                         
                         return (
                             <div>
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">设备子类型</label>
                                 <select 
                                    className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" 
                                    value={deviceForm.subType} 
                                    onChange={e => setDeviceForm({...deviceForm, subType: e.target.value})}
                                >
                                     <option value="">选择子类型</option>
                                     {subTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                 </select>
                             </div>
                         );
                     })()}

                     {/* Supplier Selection */}
                     <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">供应商 *</label>
                         <select 
                            required
                            className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                            value={deviceForm.supplierId}
                            onChange={e => setDeviceForm({...deviceForm, supplierId: e.target.value})}
                         >
                             <option value="">选择供应商</option>
                             {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                     </div>

                     {/* Order ID Input - Added */}
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">采购订单号</label>
                        <input 
                            className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                            value={deviceForm.orderId} 
                            onChange={e => setDeviceForm({...deviceForm, orderId: e.target.value})} 
                            placeholder="选填，关联采购单"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">房间号码</label><input className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.roomNumber} onChange={e => setDeviceForm({...deviceForm, roomNumber: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">首次启动</label><input type="datetime-local" className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.firstStartTime} onChange={e => setDeviceForm({...deviceForm, firstStartTime: e.target.value})} /></div>
                     </div>
                     <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">体验软件</label><input className="w-full border border-slate-200 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={deviceForm.softwareName} onChange={e => setDeviceForm({...deviceForm, softwareName: e.target.value})} /></div>
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-colors mb-8">确认添加</button>
            </form>
        </div>
    );
};