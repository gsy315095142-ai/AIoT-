import React from 'react';
import { Device } from '../../types';

export interface BreakdownStats {
    count: number;
    statusCounts: Record<string, number>;
}

export interface RoomData {
    number: string;
    type: string;
    devices: Device[];
    onlineCount: number;
    breakdown: Record<string, BreakdownStats>;
}

interface DeviceRoomGridProps {
    roomsData: RoomData[];
    onRoomClick: (roomNumber: string) => void;
}

export const DeviceRoomGrid: React.FC<DeviceRoomGridProps> = ({ roomsData, onRoomClick }) => {
    return (
        <div className="animate-fadeIn">
            <div className="grid grid-cols-2 gap-3">
                {roomsData.map(room => (
                    <div 
                        key={room.number}
                        onClick={() => onRoomClick(room.number)}
                        className={`rounded-xl border flex flex-col p-3 cursor-pointer transition-all hover:shadow-md active:scale-95 bg-white min-h-[100px] justify-between
                            ${room.devices.length > 0 ? 'border-blue-200' : 'border-slate-200 border-dashed'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="text-lg font-bold text-slate-800 leading-none">{room.number}</div>
                                <div className="text-[9px] text-slate-400 mt-1">{room.type}</div>
                            </div>
                            {room.devices.length > 0 && (
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded-full">{room.devices.length}</span>
                            )}
                        </div>

                        {/* Device Breakdown */}
                        {room.devices.length > 0 ? (
                            <div className="space-y-1">
                                {Object.entries(room.breakdown).map(([type, val]) => {
                                    const stats = val as BreakdownStats;
                                    return (
                                    <div key={type} className="text-[9px] bg-slate-50 px-1.5 py-1 rounded flex flex-col gap-0.5">
                                        <div className="font-bold text-slate-700 flex justify-between">
                                            <span>{type}</span>
                                            <span>x{stats.count}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-2 gap-y-0.5 opacity-90">
                                            {Object.entries(stats.statusCounts).map(([st, c]) => (
                                                <span key={st} className={
                                                    st === '正常' ? 'text-green-600' : 
                                                    st === '客诉' ? 'text-pink-600' : 
                                                    st === '维修' ? 'text-purple-600' : 'text-slate-500'
                                                }>
                                                    {st}{c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )})}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <span className="text-[10px] text-slate-300">暂无设备</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {roomsData.length === 0 && (
                <div className="text-center py-20 text-slate-400 text-xs">
                    该门店暂无客房数据
                </div>
            )}
        </div>
    );
};