import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { Device, DeviceStatus, OpsStatus, DeviceImage, AuditRecord, AuditStatus, AuditType, DeviceEvent } from '../types';
import { useApp, AuditPermissionType } from '../context/AppContext';
import { Check, X as XIcon, FilePenLine, X, Upload, ClipboardCheck, Clock, Wrench, Trash2, History, Info, ImageIcon, MapPin, Activity, Wifi, Moon, AlertCircle, Eye, ClipboardList } from 'lucide-react';

// --- Constants ---

export const CATEGORY_LIMITS: Record<string, number> = {
  '设备外观': 2,
  '安装现场': 2,
  '其他': 1
};

export const STATUS_MAP: Record<string, string> = {
    [DeviceStatus.ONLINE]: '运行中',
    [DeviceStatus.OFFLINE]: '未联网',
    [DeviceStatus.STANDBY]: '待机中',
    [DeviceStatus.IN_USE]: '使用中'
};

export const SUB_TYPE_MAPPING: Record<string, string[]> = {
  '桌显': ['桌显1.0', '桌显2.0', '桌显3.0'],
  '头显': ['大堂头显', '大空间头显（魔法学院）', '健身头显（阿拉丁）', '竞技大空间头显']
};

// --- Helper Components ---

export const AuditGate: React.FC<{ type: AuditPermissionType, stage?: number, children: React.ReactNode, className?: string }> = ({ type, stage, children, className }) => {
    const { checkAuditPermission } = useApp();
    const hasPermission = checkAuditPermission(type, stage);

    if (hasPermission) return <>{children}</>;

    return (
        <div className={`relative ${className || ''}`}>
            <div className="absolute inset-0 bg-slate-100/80 z-20 flex items-center justify-center rounded border border-slate-200 cursor-not-allowed overflow-hidden">
                <div className="bg-slate-200 px-1 rounded text-[9px] font-bold text-slate-500 transform -rotate-12 whitespace-nowrap select-none">暂无权限</div>
            </div>
            <div className="opacity-40 pointer-events-none filter grayscale w-full h-full flex">
                {children}
            </div>
        </div>
    );
};

interface EditableFieldProps {
  value: string;
  displayValue?: React.ReactNode;
  type: 'text' | 'select' | 'datetime-local';
  options?: { label: string; value: string }[];
  onSave: (newValue: string) => void;
  className?: string;
  label?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({ value, displayValue, type, options, onSave, className, label }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value, isEditing]);

  const handleSave = () => {
    if (tempValue !== value) {
      onSave(tempValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempValue(value);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 flex-1 min-w-0 animate-fadeIn">
        {type === 'select' ? (
          <select
            autoFocus
            className="flex-1 text-[10px] border border-blue-400 rounded px-1 py-0.5 bg-white outline-none"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
          >
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            autoFocus
            type={type}
            className="flex-1 text-[10px] border border-blue-400 rounded px-1 py-0.5 bg-white outline-none min-w-0"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
          />
        )}
        <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-0.5 rounded">
          <Check size={12} />
        </button>
        <button onClick={handleCancel} className="text-red-500 hover:bg-red-100 p-0.5 rounded">
          <XIcon size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between group ${className}`}>
      <span className="truncate mr-1">{displayValue || value || '-'}</span>
      <FilePenLine 
        size={10} 
        className="text-blue-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" 
        onClick={() => setIsEditing(true)} 
      />
    </div>
  );
};

// --- Image Manager Modal ---

interface ImageManagerModalProps {
  device: Device;
  onClose: () => void;
}

export const ImageManagerModal: React.FC<ImageManagerModalProps> = ({ device, onClose }) => {
  const { updateDevice } = useApp();
  const [images, setImages] = useState<DeviceImage[]>(device.images || (device.imageUrl ? [{ url: device.imageUrl, category: '设备外观' }] : []));
  const [activeTab, setActiveTab] = useState<string>('设备外观');

  const imageCounts = useMemo(() => {
    const counts: Record<string, number> = { '设备外观': 0, '安装现场': 0, '其他': 0 };
    images.forEach(img => {
      if (counts[img.category] !== undefined) {
        counts[img.category]++;
      }
    });
    return counts;
  }, [images]);

  const currentLimit = CATEGORY_LIMITS[activeTab];
  const currentCount = imageCounts[activeTab] || 0;
  const isCurrentTabFull = currentCount >= currentLimit;

  const handleAddImage = (e: ChangeEvent<HTMLInputElement>) => {
    if (isCurrentTabFull) return;

    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      const newImage: DeviceImage = { url, category: activeTab };
      setImages(prev => [newImage, ...prev]);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (originalIndex: number) => {
    setImages(prev => prev.filter((_, i) => i !== originalIndex));
  };

  const handleCategoryChange = (originalIndex: number, newCategory: string) => {
    setImages(prev => {
      const updated = [...prev];
      updated[originalIndex] = { ...updated[originalIndex], category: newCategory };
      return updated;
    });
  };

  const handleSave = () => {
    const mainImageUrl = images.length > 0 ? images[0].url : undefined;
    updateDevice(device.id, { images, imageUrl: mainImageUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">管理设备图片</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        
        <div className="flex border-b border-slate-100 bg-white overflow-x-auto no-scrollbar">
            {Object.keys(CATEGORY_LIMITS).map(cat => {
                const isActive = activeTab === cat;
                const count = imageCounts[cat] || 0;
                const limit = CATEGORY_LIMITS[cat];
                return (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`flex-1 py-3 text-xs font-medium text-center relative whitespace-nowrap px-2 transition-colors
                            ${isActive ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}
                        `}
                    >
                        {cat} <span className="opacity-80">({count}/{limit})</span>
                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
                    </button>
                )
            })}
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors relative 
                ${isCurrentTabFull ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50' : 'border-blue-300 bg-blue-50 hover:bg-blue-100 cursor-pointer'}`}>
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAddImage} 
                    disabled={isCurrentTabFull}
                    className={`absolute inset-0 z-10 w-full h-full ${isCurrentTabFull ? 'cursor-not-allowed' : 'cursor-pointer'} opacity-0`} 
                />
                <Upload className={isCurrentTabFull ? 'text-slate-300' : 'text-blue-500 mb-1'} size={24} />
                <span className={`text-[10px] text-center px-1 ${isCurrentTabFull ? 'text-slate-300' : 'text-blue-600'}`}>
                    {isCurrentTabFull ? '已达上限' : '上传图片'}
                </span>
            </div>

            {images.map((img, index) => {
                if (img.category !== activeTab) return null;
                return (
                    <div key={index} className="relative group border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm animate-fadeIn">
                        <div className="aspect-square bg-slate-100 relative">
                            <img src={img.url} alt={`img-${index}`} className="w-full h-full object-cover" />
                            <button 
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                            <X size={10} />
                            </button>
                        </div>
                        <div className="p-1">
                        <select 
                            value={img.category} 
                            onChange={(e) => handleCategoryChange(index, e.target.value)}
                            className="w-full text-[10px] border border-slate-200 rounded py-1 px-1 bg-slate-50 focus:outline-none"
                        >
                            {Object.entries(CATEGORY_LIMITS).map(([cat, limit]) => {
                                const count = imageCounts[cat] || 0;
                                const isFull = count >= limit;
                                const isCurrent = img.category === cat;
                                const isDisabled = isFull && !isCurrent;
                                return (
                                    <option key={cat} value={cat} disabled={isDisabled}>
                                        {cat} ({count}/{limit})
                                    </option>
                                );
                            })}
                        </select>
                        </div>
                    </div>
                );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button 
            onClick={handleSave}
            className="w-full py-2 bg-primary text-white font-bold rounded-lg shadow-md active:scale-95 transition-transform text-sm"
          >
            保存更改
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Report Detail Modal ---

export const ReportDetailModal: React.FC<{ record: AuditRecord | null; device: Device; onClose: () => void }> = ({ record, device, onClose }) => {
    return (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] animate-scaleIn">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <ClipboardCheck size={20} className="text-blue-600" />
                        巡检报告详情
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-600">测试结果</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            (record?.testResult || device.lastTestResult) === 'Qualified' ? 'bg-green-100 text-green-700' : 
                            (record?.testResult || device.lastTestResult) === 'Unqualified' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {(record?.testResult || device.lastTestResult) === 'Qualified' ? '合格' : '不合格'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase">巡检时间</p>
                            <p className="text-xs font-bold text-slate-800">{record?.auditTime || device.lastTestTime || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase">操作人</p>
                            <p className="text-xs font-bold text-slate-800">{record?.requestUser || '-'}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-slate-600 mb-1">备注说明</p>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 min-h-[60px]">
                            {record?.changeReason || '暂无详细备注'}
                        </div>
                    </div>

                    {record?.images && record.images.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-slate-600 mb-2">现场凭证</p>
                            <div className="grid grid-cols-3 gap-2">
                                {record.images.map((img, idx) => (
                                    <div key={idx} className="aspect-square rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:opacity-90">
                                        <img src={img} alt="evidence" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                    <button onClick={onClose} className="w-full py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg shadow-sm">关闭</button>
                </div>
             </div>
        </div>
    )
}

// --- Event Detail Modal ---

export const EventDetailModal: React.FC<{ event: DeviceEvent; deviceId: string; onClose: () => void }> = ({ event, deviceId, onClose }) => {
    const { deleteDeviceEvent } = useApp();

    const handleDelete = () => {
        if (window.confirm("确定要删除这条事件记录吗？")) {
            deleteDeviceEvent(deviceId, event.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scaleIn flex flex-col max-h-[80vh]">
                <div className={`p-4 border-b flex justify-between items-center flex-shrink-0 ${
                    event.type === 'error' ? 'bg-red-50 border-red-100' : event.type === 'warning' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                }`}>
                    <h3 className={`font-bold text-lg flex items-center gap-2 ${
                         event.type === 'error' ? 'text-red-700' : event.type === 'warning' ? 'text-orange-700' : 'text-blue-700'
                    }`}>
                        <Info size={20} />
                        事件详情
                    </h3>
                    <button onClick={onClose}><X size={20} className="opacity-50 hover:opacity-100" /></button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-sm font-bold text-slate-800 mb-2 leading-relaxed">{event.message}</p>
                    </div>
                    
                    {event.remark && (
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-1 uppercase">备注信息</span>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700">
                                {event.remark}
                            </div>
                        </div>
                    )}

                    {event.images && event.images.length > 0 && (
                        <div>
                            <span className="text-xs font-bold text-slate-500 block mb-2 uppercase">附带图片</span>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {event.images.map((img, i) => (
                                    <div key={i} className="w-16 h-16 rounded border border-slate-200 overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90">
                                        <img src={img} alt="event evidence" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1"><Clock size={12} /> {event.timestamp}</div>
                        <div className="flex items-center gap-1"><Wrench size={12} /> {event.operator || 'System'}</div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                    <button 
                        onClick={handleDelete}
                        className="w-full py-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <Trash2 size={16} />
                        删除事件
                    </button>
                </div>
             </div>
        </div>
    )
}

// --- Audit Management Modal ---

export const AuditManagementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { auditRecords, approveAudit, rejectAudit } = useApp();
    const [mainTab, setMainTab] = useState<'status' | 'inspection'>('status');
    const [subTab, setSubTab] = useState<'pending' | 'history'>('pending');
    
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const getFilteredRecords = () => {
        const typeFiltered = auditRecords.filter(r => 
            mainTab === 'status' ? r.type === AuditType.OPS_STATUS : r.type === AuditType.INSPECTION
        );
        return typeFiltered.filter(r => 
            subTab === 'pending' ? r.auditStatus === AuditStatus.PENDING : r.auditStatus !== AuditStatus.PENDING
        );
    };

    const displayRecords = getFilteredRecords();
    const pendingCountStatus = auditRecords.filter(r => r.type === AuditType.OPS_STATUS && r.auditStatus === AuditStatus.PENDING).length;
    const pendingCountInspection = auditRecords.filter(r => r.type === AuditType.INSPECTION && r.auditStatus === AuditStatus.PENDING).length;

    const handleRejectClick = (id: string) => {
        setRejectingId(id);
        setRejectReason('');
    };

    const confirmReject = () => {
        if (rejectingId && rejectReason.trim()) {
            rejectAudit(rejectingId, rejectReason);
            setRejectingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm">
            <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-sm h-[80vh] flex flex-col overflow-hidden">
                <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <ClipboardCheck size={20} className="text-blue-600" />
                        设备审核
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <div className="flex bg-slate-100 p-1 mx-3 mt-3 rounded-lg">
                    <button 
                        onClick={() => { setMainTab('status'); setSubTab('pending'); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mainTab === 'status' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        状态审核 {pendingCountStatus > 0 && <span className="bg-red-500 text-white px-1 rounded-full text-[9px] ml-1">{pendingCountStatus}</span>}
                    </button>
                    <button 
                        onClick={() => { setMainTab('inspection'); setSubTab('pending'); }}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mainTab === 'inspection' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        巡检审核 {pendingCountInspection > 0 && <span className="bg-red-500 text-white px-1 rounded-full text-[9px] ml-1">{pendingCountInspection}</span>}
                    </button>
                </div>

                <div className="flex bg-white border-b border-slate-200 mt-2">
                    <button 
                        onClick={() => setSubTab('pending')}
                        className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${subTab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                    >
                        待审核
                    </button>
                    <button 
                        onClick={() => setSubTab('history')}
                        className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${subTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                    >
                        历史记录
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {displayRecords.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <History size={32} className="mb-2 opacity-50" />
                            <p className="text-xs">暂无相关记录</p>
                        </div>
                    )}
                    {displayRecords.map(record => (
                        <div key={record.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">{record.deviceName}</span>
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">{record.deviceSn}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                       <span className="font-medium">{record.storeName || '未知门店'}</span>
                                       <span className="w-px h-2 bg-slate-300"></span>
                                       <span>{record.roomNumber ? `${record.roomNumber}房` : '无房号'}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">申请人: {record.requestUser} | {record.requestTime}</div>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold 
                                    ${record.auditStatus === AuditStatus.APPROVED ? 'bg-green-100 text-green-600' : 
                                      record.auditStatus === AuditStatus.REJECTED ? 'bg-red-100 text-red-600' : 
                                      record.auditStatus === AuditStatus.INVALID ? 'bg-slate-100 text-slate-400' : 'bg-orange-100 text-orange-600'}`}>
                                    {record.auditStatus}
                                </div>
                            </div>
                            
                            {record.type === AuditType.OPS_STATUS ? (
                                <div className="bg-slate-50 p-2 rounded border border-slate-100 mb-2 flex items-center justify-between text-xs">
                                    <div className="text-slate-500 font-medium">{record.prevOpsStatus}</div>
                                    <div className="text-slate-300">→</div>
                                    <div className="text-blue-600 font-bold">{record.targetOpsStatus}</div>
                                </div>
                            ) : (
                                <div className={`p-2 rounded border mb-2 flex items-center gap-2 text-xs ${record.testResult === 'Qualified' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                    <span className="font-bold">巡检结果:</span>
                                    <span>{record.testResult === 'Qualified' ? '合格' : '不合格'}</span>
                                </div>
                            )}

                            <div className="text-xs text-slate-600 bg-blue-50/50 p-2 rounded mb-2">
                                <span className="font-bold text-slate-500">备注:</span> {record.changeReason}
                            </div>
                            
                            {record.images && record.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                                    {record.images.map((img, idx) => (
                                        <div key={idx} className="w-12 h-12 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                                            <img src={img} alt="evidence" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {record.auditStatus !== AuditStatus.PENDING && record.rejectReason && (
                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-1">
                                    <span className="font-bold">拒绝原因:</span> {record.rejectReason}
                                </div>
                            )}

                            {subTab === 'pending' && (
                                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-50">
                                    {rejectingId === record.id ? (
                                        <div className="flex-1 flex gap-2 animate-fadeIn">
                                            <input 
                                                autoFocus
                                                placeholder="输入拒绝原因..."
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                className="flex-1 text-xs border border-red-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-300"
                                            />
                                            <button onClick={confirmReject} className="bg-red-500 text-white text-xs px-2 py-1 rounded">确认</button>
                                            <button onClick={() => setRejectingId(null)} className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded">取消</button>
                                        </div>
                                    ) : (
                                        <>
                                            <AuditGate type="device" className="flex-1">
                                                <button 
                                                    onClick={() => handleRejectClick(record.id)}
                                                    className="w-full py-1.5 border border-red-200 text-red-600 rounded hover:bg-red-50 text-xs font-bold transition-colors"
                                                >
                                                    拒绝
                                                </button>
                                            </AuditGate>
                                            <AuditGate type="device" className="flex-1">
                                                <button 
                                                    onClick={() => approveAudit(record.id)}
                                                    className="w-full py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-bold transition-colors shadow-sm"
                                                >
                                                    通过
                                                </button>
                                            </AuditGate>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Device Detail Card ---

interface DeviceDetailCardProps {
    device: Device;
    onEditImage: (device: Device) => void;
    onViewReport: (device: Device) => void;
    onViewEvent: (event: DeviceEvent, deviceId: string) => void;
    onOpenInspection: (deviceId: string) => void;
}

export const DeviceDetailCard: React.FC<DeviceDetailCardProps> = ({ device, onEditImage, onViewReport, onViewEvent, onOpenInspection }) => {
    const { updateDevice, auditRecords, deviceTypes, stores } = useApp();
    const [activeModule, setActiveModule] = useState<'info' | 'install' | 'aftersales' | 'inspection'>('info');

    const handleFieldUpdate = (field: keyof Device, value: string) => {
        let finalValue = value;
        const fromInputDate = (dateStr: string) => dateStr.replace('T', ' ');
        if (field === 'firstStartTime' || field === 'lastTestTime') finalValue = fromInputDate(value);
        updateDevice(device.id, { [field]: finalValue });
    };

    const getStoreName = (id: string) => stores.find(s => s.id === id)?.name || '-';
    const getTypeName = (id: string) => deviceTypes.find(t => t.id === id)?.name || '-';
    const toInputDate = (dateStr: string) => dateStr.replace(' ', 'T');
    
    const calculateDuration = (dateStr: string) => {
        if (!dateStr) return '-';
        const start = new Date(dateStr).getTime();
        const now = new Date().getTime();
        if (isNaN(start)) return '-';
        const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
        return days > 0 ? `${days}d` : '1d';
    };

    const typeOptions = deviceTypes.map(t => ({ label: t.name, value: t.id }));
    const storeOptions = stores.filter(s => !device.regionId || s.regionId === device.regionId).map(s => ({ label: s.name, value: s.id }));
    const currentTypeName = getTypeName(device.typeId);
    const detailSubTypeOptions = SUB_TYPE_MAPPING[currentTypeName]?.map(s => ({ label: s, value: s }));

    const pendingOpsRecord = auditRecords.find(r => r.deviceId === device.id && r.auditStatus === AuditStatus.PENDING && r.type === AuditType.OPS_STATUS);
    const pendingInspRecord = auditRecords.find(r => r.deviceId === device.id && r.auditStatus === AuditStatus.PENDING && r.type === AuditType.INSPECTION);

    const getFilteredEvents = () => {
        const keywords: Record<string, string[]> = {
            'info': ['添加', '名称', 'SN', 'MAC', '图片', '类型'],
            'install': ['门店', '房间', '软件', '启动'],
            'aftersales': ['运维', '维修', '客诉', '审核', '申请', '通过', '拒绝', '运行', '待机', '未联网'],
            'inspection': ['测试', 'CPU', '内存', '网络', '状态', '合格', '不合格', '巡检']
        };
        const targetKeywords = keywords[activeModule] || [];
        return device.events.filter(evt => {
            const msg = evt.message;
            if (activeModule === 'info') {
                 if (msg.includes('设备首次添加') || msg.includes('设备详情已修改')) return true;
                 return targetKeywords.some(k => msg.includes(k));
            }
            if (activeModule === 'aftersales') {
                if (msg.includes('巡检')) return false; 
                return targetKeywords.some(k => msg.includes(k));
            }
            if (activeModule === 'inspection') {
                if (msg.includes('状态变更为')) return false;
                return targetKeywords.some(k => msg.includes(k));
            }
            return targetKeywords.some(k => msg.includes(k));
        });
    };
    const filteredEvents = getFilteredEvents();

    return (
      <div className="bg-white border-t border-slate-100 animate-fadeIn shadow-inner flex flex-col">
        <div className="flex border-b border-slate-100 bg-slate-50">
            <button onClick={() => setActiveModule('info')} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors ${activeModule === 'info' ? 'text-blue-600 bg-white border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}><Info size={14} /> 信息</button>
            <button onClick={() => setActiveModule('install')} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors ${activeModule === 'install' ? 'text-blue-600 bg-white border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}><MapPin size={14} /> 安装</button>
            <button onClick={() => setActiveModule('aftersales')} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors ${activeModule === 'aftersales' ? 'text-blue-600 bg-white border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}><Wrench size={14} /> 状态</button>
            <button onClick={() => setActiveModule('inspection')} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 transition-colors ${activeModule === 'inspection' ? 'text-blue-600 bg-white border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}><Activity size={14} /> 巡检</button>
        </div>

        <div className="p-3 flex flex-col gap-4">
            <div className="space-y-3">
                {activeModule === 'info' && (
                    <div className="space-y-3 animate-fadeIn">
                        <div className="flex items-center gap-1 font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                            <EditableField value={device.name} type="text" onSave={(val) => handleFieldUpdate('name', val)} />
                        </div>
                        
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm group bg-slate-50">
                            {device.imageUrl ? (<img src={device.imageUrl} alt={device.name} className="w-full h-24 object-contain bg-slate-100" />) : (<div className="w-full h-24 bg-slate-100 flex items-center justify-center text-slate-300"><ImageIcon size={32} /></div>)}
                            <div onClick={() => onEditImage(device)} className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white text-[10px] text-center py-1 cursor-pointer hover:bg-blue-600 transition-colors">点击管理图片</div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex text-[10px] items-center"><span className="text-slate-500 w-12 flex-shrink-0">SN码</span><div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1 py-0.5 bg-slate-50 min-w-0"><EditableField value={device.sn} type="text" onSave={(val) => handleFieldUpdate('sn', val)} className="flex-1 min-w-0" /></div></div>
                            <div className="flex text-[10px] items-center"><span className="text-slate-500 w-12 flex-shrink-0">MAC</span><div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1 py-0.5 bg-slate-50 min-w-0"><EditableField value={device.mac || ''} type="text" onSave={(val) => handleFieldUpdate('mac', val)} className="flex-1 min-w-0" /></div></div>
                            <div className="flex text-[10px] items-center"><span className="text-slate-500 w-12 flex-shrink-0">类型</span><div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1 py-0.5 bg-slate-50 min-w-0"><EditableField value={device.typeId} displayValue={getTypeName(device.typeId)} type="select" options={typeOptions} onSave={(val) => handleFieldUpdate('typeId', val)} className="flex-1 min-w-0" /></div></div>
                            {detailSubTypeOptions && (
                                <div className="flex text-[10px] items-center"><span className="text-slate-500 w-12 flex-shrink-0">子类型</span><div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1 py-0.5 bg-slate-50 min-w-0"><EditableField value={device.subType || ''} type="select" options={detailSubTypeOptions} onSave={(val) => handleFieldUpdate('subType', val)} className="flex-1 min-w-0" /></div></div>
                            )}
                        </div>
                    </div>
                )}
                {activeModule === 'install' && (
                    <div className="space-y-3 animate-fadeIn">
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                            <h4 className="text-[10px] font-bold text-blue-800 mb-2 flex items-center gap-1"><MapPin size={10} /> 位置与软件</h4>
                            <div className="space-y-1.5">
                                <div className="flex text-[10px] items-center"><span className="text-slate-500 w-12 flex-shrink-0">门店</span><div className="flex-1 flex justify-between items-center border border-blue-200 rounded px-1 py-0.5 bg-white min-w-0"><EditableField value={device.storeId} displayValue={getStoreName(device.storeId)} type="select" options={storeOptions} onSave={(val) => handleFieldUpdate('storeId', val)} className="flex-1 min-w-0" /></div></div>
                                <div className="flex text-[10px] items-center"><span className="text-slate-500 w-12 flex-shrink-0">房间</span><div className="flex-1 flex justify-between items-center border border-blue-200 rounded px-1 py-0.5 bg-white min-w-0"><EditableField value={device.roomNumber || ''} type="text" onSave={(val) => handleFieldUpdate('roomNumber', val)} className="flex-1 min-w-0" /></div></div>
                                <div className="flex text-[10px] items-center"><span className="text-slate-500 w-12 flex-shrink-0">软件</span><div className="flex-1 flex justify-between items-center border border-blue-200 rounded px-1 py-0.5 bg-white min-w-0"><EditableField value={device.softwareName || ''} type="text" onSave={(val) => handleFieldUpdate('softwareName', val)} className="flex-1 min-w-0" /></div></div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                             <h4 className="text-[10px] font-bold text-slate-600 mb-2 flex items-center gap-1"><Clock size={10} /> 启动时间</h4>
                             <div className="flex text-[10px] items-center"><span className="text-slate-500 w-12 flex-shrink-0">首次启动</span><div className="flex-1 flex justify-between items-center border border-slate-200 rounded px-1 py-0.5 bg-white min-w-0"><EditableField value={toInputDate(device.firstStartTime)} displayValue={device.firstStartTime} type="datetime-local" onSave={(val) => handleFieldUpdate('firstStartTime', val)} className="flex-1 min-w-0" /></div></div>
                        </div>
                    </div>
                )}
                {activeModule === 'aftersales' && (
                    <div className="space-y-3 animate-fadeIn">
                        <div className={`py-2 px-3 rounded-lg border flex items-center justify-between ${
                            device.status === DeviceStatus.ONLINE ? 'bg-green-100 border-green-200 text-green-800' : 
                            device.status === DeviceStatus.OFFLINE ? 'bg-slate-100 border-slate-200 text-slate-600' : 
                            'bg-yellow-100 border-yellow-200 text-yellow-800'
                        }`}>
                            <span className="text-[10px] font-bold opacity-70 uppercase">运行状态</span>
                            <span className="text-sm font-bold flex items-center gap-1">
                                {device.status === DeviceStatus.ONLINE ? <Activity size={14} /> : device.status === DeviceStatus.OFFLINE ? <Moon size={14} /> : <AlertCircle size={14} />}
                                {STATUS_MAP[device.status]}
                            </span>
                        </div>

                        <div className="bg-slate-800 text-white rounded-lg p-3 shadow-md grid grid-cols-4 gap-2 text-center">
                            <div className="flex flex-col items-center"><span className="text-sm font-bold leading-none">{device.cpuUsage}%</span><span className="text-[8px] text-slate-400 mt-1">CPU</span></div>
                            <div className="flex flex-col items-center border-l border-slate-600"><span className="text-sm font-bold leading-none">{device.memoryUsage}%</span><span className="text-[8px] text-slate-400 mt-1">内存</span></div>
                            <div className="flex flex-col items-center border-l border-slate-600"><Wifi size={14} className={device.signalStrength > 50 ? 'text-green-400' : 'text-yellow-400'} /><span className="text-[8px] text-slate-400 mt-1">网络</span></div>
                            <div className="flex flex-col items-center border-l border-slate-600"><span className="text-sm font-bold leading-none">{device.currentRunDuration || 0}h</span><span className="text-[8px] text-slate-400 mt-1">运行时长</span></div>
                        </div>

                         <div className={`p-3 rounded-lg border flex items-center justify-between ${
                            device.opsStatus === OpsStatus.HOTEL_COMPLAINT ? 'bg-pink-50 border-pink-200 text-pink-700' :
                            device.opsStatus === OpsStatus.REPAIRING ? 'bg-purple-50 border-purple-200 text-purple-700' :
                            'bg-green-50 border-green-200 text-green-700'
                        }`}>
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${
                                    device.opsStatus === OpsStatus.HOTEL_COMPLAINT ? 'bg-pink-200 text-pink-700' :
                                    device.opsStatus === OpsStatus.REPAIRING ? 'bg-purple-200 text-purple-700' :
                                    'bg-green-200 text-green-700'
                                }`}>
                                    <Wrench size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase opacity-70 font-bold">运维状态</p>
                                    <p className="font-bold text-lg leading-none">{device.opsStatus}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase opacity-70 font-bold">持续时长</p>
                                <p className="font-bold text-lg leading-none">{calculateDuration(device.lastTestTime)}</p>
                            </div>
                        </div>

                        {pendingOpsRecord && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-orange-800">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-bold text-xs flex items-center gap-1"><History size={12} /> 正在审核中</h5>
                                    <span className="text-[10px] bg-orange-200 px-1.5 py-0.5 rounded text-orange-800 font-bold">申请: {pendingOpsRecord.targetOpsStatus}</span>
                                </div>
                                <div className="text-[10px] space-y-1 opacity-80">
                                    <p>提交时间: {pendingOpsRecord.requestTime}</p>
                                    <p>变更说明: {pendingOpsRecord.changeReason}</p>
                                    <p>操作人: {pendingOpsRecord.requestUser}</p>
                                </div>
                                {pendingOpsRecord.images && pendingOpsRecord.images.length > 0 && (
                                     <div className="flex gap-1 mt-2">
                                        {pendingOpsRecord.images.map((img, idx) => (
                                            <div key={idx} className="w-8 h-8 rounded border border-orange-200 overflow-hidden">
                                                <img src={img} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                     </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {activeModule === 'inspection' && (
                     <div className="space-y-3 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col items-center">
                                <span className="text-[10px] text-slate-500 uppercase">累计启动</span>
                                <span className="text-sm font-bold text-slate-800">{device.totalStartCount || 0}次</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col items-center">
                                <span className="text-[10px] text-slate-500 uppercase">累计运行</span>
                                <span className="text-sm font-bold text-slate-800">{device.totalRunDuration || 0}h</span>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-lg p-2 space-y-2 shadow-sm">
                             <div 
                                onClick={() => onViewReport(device)}
                                className="flex text-[10px] items-center cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors group"
                             >
                                 <span className="text-slate-500 w-12 flex-shrink-0">最近测试</span>
                                 <div className="flex-1 flex justify-between items-center pl-2">
                                    <span className="text-slate-700 font-medium">{device.lastTestTime}</span>
                                    <div className="flex items-center gap-1">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${device.lastTestResult === 'Qualified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {device.lastTestResult === 'Qualified' ? '合格' : '不合格'}
                                        </span>
                                        <Eye size={12} className="text-blue-400 group-hover:text-blue-600" />
                                    </div>
                                 </div>
                             </div>

                             {pendingInspRecord && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-800 text-[10px]">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold flex items-center gap-1"><ClipboardCheck size={10} /> 巡检报告审核中</span>
                                        <span className={`px-1 rounded ${pendingInspRecord.testResult === 'Qualified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {pendingInspRecord.testResult === 'Qualified' ? '合格' : '不合格'}
                                        </span>
                                    </div>
                                    <p className="opacity-80 truncate">{pendingInspRecord.changeReason}</p>
                                    <div className="flex justify-between items-center mt-1 text-[9px] opacity-70">
                                        <span>{pendingInspRecord.requestTime}</span>
                                        <span>操作人: {pendingInspRecord.requestUser}</span>
                                    </div>
                                </div>
                             )}

                             <button 
                                onClick={() => onOpenInspection(device.id)}
                                className="w-full py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded hover:bg-blue-100 transition-colors border border-blue-200 flex items-center justify-center gap-1"
                             >
                                <ClipboardList size={12} /> 提交巡检报告
                             </button>
                        </div>
                     </div>
                )}
            </div>
            
            <div className="border-t border-slate-100 pt-3">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <span className="w-1 h-3 bg-blue-400 rounded-full"></span>
                    相关日志
                </h5>
                <div className="space-y-3 pl-1">
                    {filteredEvents.length === 0 ? (
                        <div className="text-[10px] text-slate-300 text-center py-2">暂无相关事件</div>
                    ) : (
                        filteredEvents.map(event => (
                            <div key={event.id} className="relative pl-4 group cursor-pointer border-l border-slate-200 ml-1 pb-1 last:pb-0" onClick={() => onViewEvent(event, device.id)}>
                                <div className={`absolute left-0 top-1.5 w-2 h-2 rounded-full border-2 border-white shadow-sm z-10 -ml-[5px] ${
                                    event.type === 'error' ? 'bg-red-500' : event.type === 'warning' ? 'bg-orange-400' : 'bg-blue-400'
                                }`}></div>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 mr-2">
                                        <div className="text-[10px] text-slate-700 font-medium leading-tight group-hover:text-blue-600 transition-colors">{event.message}</div>
                                        <div className="text-[9px] text-slate-400 mt-0.5">{event.timestamp}</div>
                                    </div>
                                    <div className="text-[9px] text-slate-300 whitespace-nowrap">{event.operator || 'System'}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    );
};