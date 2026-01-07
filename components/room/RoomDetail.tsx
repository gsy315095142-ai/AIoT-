import React from 'react';
import { BedDouble, Hammer, RotateCcw, X, CheckCircle } from 'lucide-react';
import { Store, Room } from '../../types';

export const RoomDetail: React.FC<{ store: Store; room: Room; onClose: () => void }> = ({ store, room, onClose }) => {
    const installNode = store.installation?.nodes?.find(n => n.name === '安装');
    const debugNode = store.installation?.nodes?.find(n => n.name === '调试');
    
    const roomInstallData = (installNode?.data && typeof installNode.data === 'object' && !Array.isArray(installNode.data)) 
        ? installNode.data[room.number] || {} 
        : {};
    
    const roomDebugData = (debugNode?.data && typeof debugNode.data === 'object' && !Array.isArray(debugNode.data))
        ? debugNode.data[room.number] || {}
        : {};

    const installModules = store.moduleConfig.activeModules.filter(m => store.moduleConfig.moduleTypes?.[m] === 'installation');

    return (
        <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col animate-slideInRight">
            <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <BedDouble size={20} className="text-blue-600" />
                        {room.number} 客房详情
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{room.type}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><X size={20} className="text-slate-500" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                        <Hammer size={16} className="text-green-600" /> 安装归档详情
                    </h4>
                    
                    {installModules.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-400">暂无安装模块配置</div>
                    ) : (
                        <div className="space-y-4">
                            {installModules.map(modName => {
                                const modData = roomInstallData[modName];
                                let images: string[] = [];
                                let params: Record<string, any> = {};
                                if (Array.isArray(modData)) {
                                    images = modData;
                                } else if (typeof modData === 'object' && modData) {
                                    images = modData.images || [];
                                    params = modData.params || {};
                                }

                                return (
                                    <div key={modName} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-700">{modName}</span>
                                            <span className="text-[10px] text-slate-400">{images.length} 张图片</span>
                                        </div>
                                        
                                        {/* Params Display */}
                                        {Object.keys(params).length > 0 && (
                                            <div className="bg-slate-50 p-2 rounded mb-2 grid grid-cols-2 gap-2">
                                                {Object.entries(params).map(([k, v]) => (
                                                    <div key={k} className="text-[10px]">
                                                        <span className="text-slate-400 mr-1">
                                                            {k === 'deviceSn' ? 'SN号' : k === 'powerOnBoot' ? '通电自启' : k}:
                                                        </span>
                                                        <span className="font-bold text-slate-700">
                                                            {typeof v === 'boolean' ? (v ? '是' : '否') : v}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Images Grid */}
                                        {images.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-2">
                                                {images.map((img, i) => (
                                                    <div key={i} className="aspect-square rounded border border-slate-200 overflow-hidden">
                                                        <img src={img} className="w-full h-full object-cover" alt="install" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-slate-300 italic">暂无图片</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <h4 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
                        <RotateCcw size={16} className="text-purple-600" /> 调试状态
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 ${roomDebugData.network ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                            <span className="text-xs font-bold">网络连通性</span>
                            {roomDebugData.network ? <CheckCircle size={16} /> : <div className="text-[10px]">未通过</div>}
                        </div>
                        <div className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 ${roomDebugData.log ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                            <span className="text-xs font-bold">日志上报</span>
                            {roomDebugData.log ? <CheckCircle size={16} /> : <div className="text-[10px]">未检测</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};