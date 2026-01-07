import React from 'react';
import { Device, DeviceType, DeviceEvent, OpsStatus, DeviceStatus } from '../../types';
import { DeviceDetailCard, STATUS_MAP } from '../DeviceComponents';
import { CheckSquare, Square, ChevronUp, ChevronDown } from 'lucide-react';

interface DeviceListProps {
    devices: Device[];
    deviceTypes: DeviceType[];
    expandedDeviceId: string | null;
    toggleExpand: (id: string) => void;
    selectedDeviceIds: Set<string>;
    toggleSelection: (id: string) => void;
    hasPendingAudit: (id: string) => boolean;
    onEditImage: (device: Device) => void;
    onViewReport: (device: Device) => void;
    onViewEvent: (event: DeviceEvent, deviceId: string) => void;
    onOpenInspection: (deviceId: string) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
    devices,
    deviceTypes,
    expandedDeviceId,
    toggleExpand,
    selectedDeviceIds,
    toggleSelection,
    hasPendingAudit,
    onEditImage,
    onViewReport,
    onViewEvent,
    onOpenInspection
}) => {
    const getRowStyle = (d: Device) => {
        if (d.opsStatus === OpsStatus.HOTEL_COMPLAINT) return 'bg-pink-100 border-pink-300 text-pink-900';
        if (d.opsStatus === OpsStatus.REPAIRING) return 'bg-purple-200 border-purple-300 text-purple-900';
        if (d.opsStatus === OpsStatus.PENDING) return 'bg-orange-200 border-orange-300 text-orange-900';
        if (d.status === DeviceStatus.OFFLINE) return 'bg-slate-200 border-slate-300 text-slate-700';
        if (d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.IN_USE) return 'bg-green-200 border-green-300 text-green-900';
        return 'bg-yellow-100 border-yellow-200 text-yellow-900'; 
    };

    return (
        <div className="animate-fadeIn pb-16">
            {devices.map(device => {
                const rowStyle = getRowStyle(device);
                const isDetailExpanded = expandedDeviceId === device.id;
                const isSelected = selectedDeviceIds.has(device.id);
                const isPending = hasPendingAudit(device.id);

                return (
                    <div key={device.id} className="mb-2 rounded-lg overflow-hidden shadow-sm border border-slate-100 relative">
                        <div 
                            className={`flex items-center px-3 py-3 transition-colors cursor-pointer ${rowStyle}`}
                            onClick={() => toggleExpand(device.id)}
                        >
                            <div onClick={(e) => { e.stopPropagation(); toggleSelection(device.id); }} className="mr-2 cursor-pointer opacity-60 hover:opacity-100">
                                {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                            </div>
                            <div className="w-20 truncate font-bold text-xs">{device.name}</div>
                            <div className="flex-1 text-center truncate text-[10px] px-1 opacity-80">{device.subType || deviceTypes.find(t=>t.id===device.typeId)?.name}</div>
                            <div className="w-12 text-center text-[10px] font-bold opacity-90">{STATUS_MAP[device.status]}</div>
                            <div className="w-16 text-right text-[10px] font-bold flex flex-col items-end justify-center leading-tight">
                                <span className="truncate">{device.opsStatus}</span>
                                {isPending && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded mt-0.5 border border-red-200 animate-pulse">待审核</span>}
                            </div>
                            <div className="ml-1 opacity-50 flex-shrink-0">
                                {isDetailExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </div>
                        </div>
                        
                        {/* Expanded Device Detail */}
                        {isDetailExpanded && (
                            <div className="p-2 bg-white border-t border-slate-100">
                                <DeviceDetailCard 
                                    device={device} 
                                    onEditImage={onEditImage}
                                    onViewReport={onViewReport}
                                    onViewEvent={onViewEvent}
                                    onOpenInspection={onOpenInspection}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
            {devices.length === 0 && (
                <div className="text-center py-20 text-slate-400 text-xs">
                    该类型下暂无匹配的设备
                </div>
            )}
        </div>
    );
};