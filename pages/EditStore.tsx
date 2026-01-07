import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Store, Trash2, Plus, GripVertical, Settings2 } from 'lucide-react';
import { Room } from '../types';

export const EditStore: React.FC = () => {
    const navigate = useNavigate();
    const { storeId } = useParams<{ storeId: string }>();
    const { stores, updateStore, regions } = useApp();
    
    const [name, setName] = useState('');
    const [regionId, setRegionId] = useState('');
    const [rooms, setRooms] = useState<Room[]>([]);
    
    // Room Type Configuration
    const [definedTypes, setDefinedTypes] = useState<string[]>([]);

    useEffect(() => {
        const store = stores.find(s => s.id === storeId);
        if (store) {
            setName(store.name);
            setRegionId(store.regionId);
            setRooms(JSON.parse(JSON.stringify(store.rooms || [])));
            // Initialize defined types from existing configs
            if (store.roomTypeConfigs && store.roomTypeConfigs.length > 0) {
                setDefinedTypes(store.roomTypeConfigs.map(c => c.name));
            } else {
                setDefinedTypes(['普通房', '样板房']); // Fallback default
            }
        } else {
            // Handle not found
            navigate('/rooms');
        }
    }, [storeId, stores, navigate]);

    const handleSave = () => {
        if (!storeId) return;
        const store = stores.find(s => s.id === storeId);
        if (!store) return;

        if (!name.trim() || !regionId) {
            alert('请填写完整信息');
            return;
        }

        const validTypes = definedTypes.filter(t => t.trim() !== '');
        if (validTypes.length === 0) {
            alert('请至少配置一种房型');
            return;
        }

        // Clean up empty rows
        const validRooms = rooms.filter(r => r.number.trim() !== '');

        // Reconstruct RoomTypeConfigs
        // We attempt to preserve existing IDs and data if the index matches to support simple renaming
        // If a type is removed, its data is lost in this simple implementation, which is acceptable for "archive setup" phase.
        const currentConfigs = store.roomTypeConfigs || [];
        const newRoomTypeConfigs = validTypes.map((typeName, index) => {
            const existing = currentConfigs[index];
            return {
                id: existing?.id || `rt-${Date.now()}-${index}`,
                name: typeName,
                images: existing?.images || [],
                measurements: existing?.measurements || []
            };
        });

        updateStore(storeId, {
            name: name.trim(),
            regionId: regionId,
            rooms: validRooms,
            roomTypeConfigs: newRoomTypeConfigs
        });

        navigate('/rooms');
    };

    // --- Room Type Handlers ---
    const addConfigType = () => {
        setDefinedTypes([...definedTypes, '']);
    };

    const updateConfigType = (index: number, value: string) => {
        const newTypes = [...definedTypes];
        newTypes[index] = value;
        setDefinedTypes(newTypes);
    };

    const removeConfigType = (index: number) => {
        const typeToRemove = definedTypes[index];
        setDefinedTypes(definedTypes.filter((_, i) => i !== index));
        
        // Also verify if any rooms used this type and reset them
        const remainingTypes = definedTypes.filter((_, i) => i !== index);
        const fallbackType = remainingTypes.length > 0 ? remainingTypes[0] : '';
        
        setRooms(rooms.map(r => r.type === typeToRemove ? { ...r, type: fallbackType } : r));
    };

    const handleAddRow = () => {
        const lastRoom = rooms[rooms.length - 1];
        let nextNum = '';
        // Default to last room's type or first available
        let nextType = lastRoom ? lastRoom.type : (definedTypes.length > 0 ? definedTypes[0] : '');

        if (lastRoom) {
            const lastNumStr = lastRoom.number.trim();
            if (/^\d+$/.test(lastNumStr)) {
                nextNum = String(parseInt(lastNumStr, 10) + 1);
            }
        }

        setRooms([...rooms, { number: nextNum, type: nextType }]);
    };

    const handleRemoveRow = (index: number) => {
        setRooms(rooms.filter((_, i) => i !== index));
    };

    const handleRoomChange = (index: number, field: keyof Room, value: string) => {
        const newRooms = [...rooms];
        newRooms[index] = { ...newRooms[index], [field]: value };
        setRooms(newRooms);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 text-xs font-bold px-3"
                >
                    <ArrowLeft size={14} /> 返回
                </button>
                <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Store size={18} className="text-blue-600" />
                    编辑门店
                </h1>
                <div className="w-16"></div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 pb-20">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">门店名称 *</label>
                        <input 
                            type="text"
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="输入门店名称"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">门店 ID</label>
                        <input 
                            type="text"
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                            value={storeId}
                            disabled
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">所属大区 *</label>
                        <select 
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={regionId}
                            onChange={e => setRegionId(e.target.value)}
                        >
                            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Room Type Configuration (New in Edit) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                            <Settings2 size={12} /> 房型配置
                        </label>
                    </div>
                    <div className="space-y-2">
                        {definedTypes.map((type, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="text-slate-300">
                                    <GripVertical size={16} />
                                </div>
                                <input 
                                    type="text"
                                    className="flex-1 border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                    value={type}
                                    onChange={(e) => updateConfigType(index, e.target.value)}
                                    placeholder={`房型名称 ${index + 1}`}
                                />
                                <button 
                                    onClick={() => removeConfigType(index)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    disabled={definedTypes.length <= 1}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button 
                            onClick={addConfigType}
                            className="w-full py-2 bg-slate-50 border border-dashed border-slate-200 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center gap-1 mt-2"
                        >
                            <Plus size={14} /> 添加新房型
                        </button>
                    </div>
                </div>

                {/* Room List Editor */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-slate-500 uppercase">客房列表 ({rooms.length})</label>
                    </div>
                    
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                                <tr>
                                    <th className="px-3 py-2 text-left w-10">#</th>
                                    <th className="px-3 py-2 text-left">房号</th>
                                    <th className="px-3 py-2 text-left">房型</th>
                                    <th className="px-3 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rooms.map((room, index) => (
                                    <tr key={index} className="group">
                                        <td className="px-3 py-2 text-slate-400 text-xs text-center">{index + 1}</td>
                                        <td className="px-3 py-2">
                                            <input 
                                                type="text"
                                                className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                                value={room.number}
                                                onChange={(e) => handleRoomChange(index, 'number', e.target.value)}
                                                placeholder="输入房号"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <select 
                                                className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 bg-white"
                                                value={room.type}
                                                onChange={(e) => handleRoomChange(index, 'type', e.target.value)}
                                            >
                                                {definedTypes.filter(t => t.trim() !== '').map((t, i) => (
                                                    <option key={i} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button 
                                                onClick={() => handleRemoveRow(index)}
                                                className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {rooms.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                                            暂无客房，请点击下方按钮添加
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <button 
                            onClick={handleAddRow}
                            disabled={definedTypes.filter(t => t.trim() !== '').length === 0}
                            className="w-full py-2 bg-slate-50 text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors border-t border-slate-100 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} /> 添加一行
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                    保存修改
                </button>
            </div>
        </div>
    );
};