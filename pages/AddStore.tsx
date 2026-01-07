import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Store, Plus, Trash2 } from 'lucide-react';
import { Room } from '../types';

export const AddStore: React.FC = () => {
    const navigate = useNavigate();
    const { addStore, regions } = useApp();
    
    const [name, setName] = useState('');
    const [customId, setCustomId] = useState(''); // New: Store ID Input
    const [regionId, setRegionId] = useState(regions.length > 0 ? regions[0].id : '');
    const [rooms, setRooms] = useState<Room[]>([]); // New: Room List

    const handleSave = () => {
        if (!name.trim() || !regionId || !customId.trim()) {
            alert('请填写完整信息');
            return;
        }

        // Clean up empty rows
        const validRooms = rooms.filter(r => r.number.trim() !== '');

        addStore({
            id: customId.trim(), // Use custom ID
            name: name.trim(),
            regionId: regionId,
            rooms: validRooms,
            roomTypeConfigs: [],
            // ... other props are handled by defaults in context addStore
        } as any);

        navigate('/rooms');
    };

    const handleAddRow = () => {
        const lastRoom = rooms[rooms.length - 1];
        let nextNum = '';
        let nextType = '普通房'; // Default type

        if (lastRoom) {
            nextType = lastRoom.type;
            const lastNumStr = lastRoom.number.trim();
            // Check if it's purely numeric
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
                    新增门店
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
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">门店 ID *</label>
                        <input 
                            type="text"
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={customId}
                            onChange={e => setCustomId(e.target.value)}
                            placeholder="输入门店唯一标识 (如: S001)"
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
                                            <input 
                                                type="text"
                                                className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                                value={room.type}
                                                onChange={(e) => handleRoomChange(index, 'type', e.target.value)}
                                                placeholder="输入房型"
                                                list="room-types"
                                            />
                                            <datalist id="room-types">
                                                <option value="普通房" />
                                                <option value="样板房" />
                                            </datalist>
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
                            className="w-full py-2 bg-slate-50 text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors border-t border-slate-100 flex items-center justify-center gap-1"
                        >
                            <Plus size={14} /> 添加一行
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                    确认添加
                </button>
            </div>
        </div>
    );
};