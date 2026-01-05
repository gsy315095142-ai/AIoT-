import React, { useState, ChangeEvent } from 'react';
import { Ruler, Store, ChevronDown, ChevronUp, Plus, X, Upload, ClipboardList, Edit3, Check, Save, Filter, BedDouble, HelpCircle, Image as ImageIcon, Send, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Settings, ListChecks, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoomImageCategory, RoomImage, RoomMeasurement, MeasurementType, RoomMeasurementStatus, RoomTypeConfig, ChecklistParam, Region } from '../../types';
import { AuditGate } from '../DeviceComponents';

// --- Constants ---
const DEFAULT_MODULES: RoomImageCategory[] = [
    '地投环境',
    '桌显桌子形状尺寸',
    '床头背景墙尺寸',
    '桌显处墙面宽高',
    '浴室镜面形状和尺寸',
    '电视墙到床尾距离',
    '照片墙处墙面宽高',
    '玩乐活动区域长宽'
];

const EXAMPLE_IMAGES: Record<string, string> = {
    '地投环境': 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=600&auto=format&fit=crop',
    '桌显桌子形状尺寸': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=600&auto=format&fit=crop',
    '床头背景墙尺寸': 'https://images.unsplash.com/photo-1505693416388-b0346ef4174d?q=80&w=600&auto=format&fit=crop',
    '桌显处墙面宽高': 'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=600&auto=format&fit=crop',
    '浴室镜面形状和尺寸': 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=600&auto=format&fit=crop',
    '电视墙到床尾距离': 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=600&auto=format&fit=crop',
    '照片墙处墙面宽高': 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600&auto=format&fit=crop',
    '玩乐活动区域长宽': 'https://images.unsplash.com/photo-1596178065887-1198b6148b2e?q=80&w=600&auto=format&fit=crop'
};

// --- Interfaces for Sub-components ---
interface EditFormState {
    type: MeasurementType;
    remark: string;
    checklistValues: Record<string, string | boolean>;
}

interface EvaluationPanelProps {
    moduleName: RoomImageCategory;
    hasImages: boolean;
    isEditing: boolean;
    measurement?: RoomMeasurement;
    checklistParams: ChecklistParam[];
    editForm: EditFormState;
    rejectingCategory: string | null;
    rejectReason: string;
    // Actions
    onStartEditing: () => void;
    onCancelEditing: () => void;
    onSave: (status?: RoomMeasurementStatus) => void;
    onUpdateChecklist: (id: string, val: string | boolean) => void;
    onSetForm: (form: Partial<EditFormState>) => void;
    onSubmitAudit: () => void;
    onStartReject: () => void;
    onCancelReject: () => void;
    onConfirmReject: () => void;
    onSetRejectReason: (reason: string) => void;
    onApprove: (status: RoomMeasurementStatus) => void;
}

// --- Sub-component: Evaluation Panel ---
// Separated to clean up main render loop and fix JSX syntax issues with nested logic
const EvaluationPanel: React.FC<EvaluationPanelProps> = (props) => {
    const { 
        moduleName, hasImages, isEditing, measurement, checklistParams, editForm, 
        rejectingCategory, rejectReason,
        onStartEditing, onCancelEditing, onSave, onUpdateChecklist, onSetForm,
        onSubmitAudit, onStartReject, onCancelReject, onConfirmReject, onSetRejectReason, onApprove 
    } = props;

    // 1. If no images uploaded, show prompt
    if (!hasImages) {
        return (
            <div className="py-2 px-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400 italic">
                请先上传图片，再进行复尺评估
            </div>
        );
    }

    // 2. Editing Mode Form
    if (isEditing) {
        return (
            <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 animate-fadeIn space-y-3">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500">安装类型</label>
                    <select 
                        className="border border-slate-300 rounded p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editForm.type}
                        onChange={(e) => onSetForm({ type: e.target.value as MeasurementType })}
                    >
                        <option value="正常安装">正常安装</option>
                        <option value="特殊安装">特殊安装</option>
                    </select>
                </div>

                {/* Dynamic Checklist Inputs */}
                {checklistParams.length > 0 && (
                    <div className="space-y-2 bg-white/50 p-2 rounded border border-blue-100">
                        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <ListChecks size={10} /> 必填清单
                        </label>
                        {checklistParams.map(param => (
                            <div key={param.id} className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-600">{param.label}</label>
                                {param.type === 'boolean' ? (
                                    <div className="flex gap-2">
                                        <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name={`checklist-${param.id}`}
                                                checked={editForm.checklistValues[param.id] === true}
                                                onChange={() => onUpdateChecklist(param.id, true)}
                                            /> 是
                                        </label>
                                        <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name={`checklist-${param.id}`}
                                                checked={editForm.checklistValues[param.id] === false}
                                                onChange={() => onUpdateChecklist(param.id, false)}
                                            /> 否
                                        </label>
                                    </div>
                                ) : (
                                    <input 
                                        type="text" 
                                        className="border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-full"
                                        placeholder="填写数值或描述..."
                                        value={(editForm.checklistValues[param.id] as string) || ''}
                                        onChange={(e) => onUpdateChecklist(param.id, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500">备注说明</label>
                    <textarea 
                        className="border border-slate-300 rounded p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none h-16"
                        value={editForm.remark}
                        onChange={(e) => onSetForm({ remark: e.target.value })}
                        placeholder="请输入复尺相关的详细说明..."
                    />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                    <button onClick={onCancelEditing} className="px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-200 transition-colors">取消</button>
                    <button onClick={() => onSave(measurement?.status)} className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1">
                        <Save size={12} /> 保存
                    </button>
                </div>
            </div>
        );
    }

    // 3. View Mode (Has Measurement)
    if (measurement) {
        const status = measurement.status;
        const isRejected = status === 'rejected';
        const isPending = status === 'pending_stage_1' || status === 'pending_stage_2';
        const isApproved = status === 'approved';
        const isRejectingThis = rejectingCategory === moduleName;

        // Calculate missing checklist items for UI hint
        const missingCount = checklistParams.filter(p => {
            const val = measurement.checklistValues?.[p.id];
            if (p.type === 'boolean') return val === undefined;
            return !val || (val as string).trim() === '';
        }).length;

        return (
            <div className="space-y-3">
                <div className={`rounded-lg p-3 border flex flex-col gap-2 group ${
                    measurement.type === '特殊安装' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'
                }`}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    measurement.type === '特殊安装' 
                                        ? 'bg-orange-100 text-orange-700 border-orange-200' 
                                        : 'bg-green-100 text-green-700 border-green-200'
                                }`}>
                                    {measurement.type}
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {measurement.remark || '无备注说明'}
                            </p>
                        </div>
                        {/* Edit button only if not approved/pending, or if admin/manager overrides (simplified here to always allow edit for user flow smoothness, though normally locked) */}
                        <button 
                            onClick={onStartEditing}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Edit3 size={16} />
                        </button>
                    </div>

                    {/* Display Checklist Values */}
                    {checklistParams.length > 0 && (
                        <div className="border-t border-slate-200 pt-2 mt-1 grid grid-cols-2 gap-2">
                            {checklistParams.map(p => {
                                const val = measurement.checklistValues?.[p.id];
                                const displayVal = p.type === 'boolean' 
                                    ? (val === true ? '是' : val === false ? '否' : '-') 
                                    : (val || '-');
                                return (
                                    <div key={p.id} className="text-[10px] flex flex-col">
                                        <span className="text-slate-400 scale-90 origin-left">{p.label}</span>
                                        <span className={`font-bold pl-1 ${displayVal === '-' ? 'text-red-400' : 'text-slate-700'}`}>{displayVal}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Rejection Reason Display */}
                {isRejected && measurement.rejectReason && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-2 text-xs text-red-700 flex items-start gap-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">驳回原因:</span> {measurement.rejectReason}
                        </div>
                    </div>
                )}

                {/* Audit Actions */}
                <div className="flex gap-2">
                    {!status || isRejected ? (
                        <button 
                            onClick={onSubmitAudit}
                            className={`flex-1 py-2 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm ${missingCount > 0 ? 'bg-slate-400 cursor-pointer opacity-90' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            <Send size={12} /> {isRejected ? '重新提交初审' : '提交初审'}
                            {missingCount > 0 && <span className="ml-1 text-[9px] bg-red-500/80 px-1.5 rounded-full">{missingCount}项未填</span>}
                        </button>
                    ) : isPending ? (
                        isRejectingThis ? (
                            <div className="flex-1 flex gap-2 animate-fadeIn">
                                <input 
                                    autoFocus
                                    placeholder="驳回原因..." 
                                    className="flex-1 border border-red-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-red-300 outline-none"
                                    value={rejectReason}
                                    onChange={e => onSetRejectReason(e.target.value)}
                                />
                                <button onClick={onConfirmReject} className="bg-red-500 text-white px-3 rounded text-xs">确认</button>
                                <button onClick={onCancelReject} className="bg-slate-200 text-slate-600 px-3 rounded text-xs">取消</button>
                            </div>
                        ) : (
                            <>
                                <AuditGate type="measurement" stage={status === 'pending_stage_1' ? 1 : 2} className="flex-1">
                                    <button onClick={onStartReject} className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">
                                        驳回
                                    </button>
                                </AuditGate>
                                <AuditGate type="measurement" stage={status === 'pending_stage_1' ? 1 : 2} className="flex-1">
                                    <button onClick={() => onApprove(status)} className="w-full py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm">
                                        {status === 'pending_stage_1' ? '初审通过' : '终审通过'}
                                    </button>
                                </AuditGate>
                            </>
                        )
                    ) : (
                        <div className="flex-1 py-2 bg-slate-50 border border-slate-100 text-green-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-default">
                            <CheckCircle size={14} /> 已通过审核并归档
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 4. Default: Button to add
    return (
        <button 
            onClick={onStartEditing}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs font-bold hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
        >
            <Plus size={16} />
            添加复尺评估
        </button>
    );
};

// --- Main Component ---
export const RoomMeasure: React.FC = () => {
  const { regions, stores, updateStore } = useApp();
  
  // Navigation State
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  
  // Detail View State
  const [activeRoomTypeName, setActiveRoomTypeName] = useState('');
  const [expandedModules, setExpandedModules] = useState<string[]>([DEFAULT_MODULES[0]]);

  // Editing state
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    type: '正常安装',
    remark: '',
    checklistValues: {}
  });

  // Rejection State
  const [rejectingCategory, setRejectingCategory] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Example Image Modal State
  const [viewingExample, setViewingExample] = useState<{ title: string; url: string } | null>(null);

  // Computed Data
  // FILTER MODIFICATION: Only show stores with 'published' measurement task
  const filteredStores = (selectedRegion 
    ? stores.filter(s => s.regionId === selectedRegion) 
    : stores).filter(s => s.measurementTask?.status === 'published');

  const currentStore = stores.find(s => s.id === selectedStoreId);
  const currentRoomTypeConfig = currentStore?.roomTypeConfigs.find(rt => rt.name === activeRoomTypeName);
  
  // Use Store-Level Module Config and filter by type 'measurement'
  const activeModules = (currentStore?.moduleConfig.activeModules || DEFAULT_MODULES)
    .filter(m => (currentStore?.moduleConfig.moduleTypes?.[m] || 'measurement') === 'measurement');

  // Helper for Region Label with Status Counts
  const getRegionLabel = (region: Region) => {
      const regionStores = filteredStores.filter(s => s.regionId === region.id);
      const total = regionStores.length;
      
      let p1 = 0; // pending_stage_1
      let p2 = 0; // pending_stage_2 (Final)
      let completed = 0;

      regionStores.forEach(s => {
          // Count Pending
          let hasP1 = false;
          let hasP2 = false;
          (s.roomTypeConfigs || []).forEach(rt => {
              if (rt.measurements?.some(m => m.status === 'pending_stage_1')) hasP1 = true;
              if (rt.measurements?.some(m => m.status === 'pending_stage_2')) hasP2 = true;
          });
          if (hasP1) p1++;
          if (hasP2) p2++;

          // Count Completed
          const roomTypes = s.roomTypeConfigs || [];
          const activeMods = s.moduleConfig.activeModules || DEFAULT_MODULES;
          const measurementMods = activeMods.filter((m: any) => (s.moduleConfig.moduleTypes?.[m] || 'measurement') === 'measurement');
          
          if (roomTypes.length > 0 && measurementMods.length > 0) {
              const completedTypes = roomTypes.filter(rt => {
                   const measurementCount = rt.measurements ? rt.measurements.filter(m => m.status === 'approved' && measurementMods.includes(m.category)).length : 0;
                   return measurementCount >= measurementMods.length;
              }).length;
              if (completedTypes === roomTypes.length) completed++;
          }
      });

      let label = `${region.name} (总:${total}`;
      if (p1 > 0) label += ` 待初审:${p1}`;
      if (p2 > 0) label += ` 待终审:${p2}`;
      if (completed > 0) label += ` 完成:${completed}`;
      label += `)`;
      return label;
  };

  const getAllRegionsLabel = () => {
      const total = filteredStores.length;
      let p1 = 0;
      let p2 = 0;
      let completed = 0;

      filteredStores.forEach(s => {
          // Same logic as getRegionLabel but accumulating globally
          let hasP1 = false;
          let hasP2 = false;
          (s.roomTypeConfigs || []).forEach(rt => {
              if (rt.measurements?.some(m => m.status === 'pending_stage_1')) hasP1 = true;
              if (rt.measurements?.some(m => m.status === 'pending_stage_2')) hasP2 = true;
          });
          if (hasP1) p1++;
          if (hasP2) p2++;

          const roomTypes = s.roomTypeConfigs || [];
          const activeMods = s.moduleConfig.activeModules || DEFAULT_MODULES;
          const measurementMods = activeMods.filter((m: any) => (s.moduleConfig.moduleTypes?.[m] || 'measurement') === 'measurement');
          
          if (roomTypes.length > 0 && measurementMods.length > 0) {
              const completedTypes = roomTypes.filter(rt => {
                   const measurementCount = rt.measurements ? rt.measurements.filter(m => m.status === 'approved' && measurementMods.includes(m.category)).length : 0;
                   return measurementCount >= measurementMods.length;
              }).length;
              if (completedTypes === roomTypes.length) completed++;
          }
      });

      let label = `全部大区 (总:${total}`;
      if (p1 > 0) label += ` 待初审:${p1}`;
      if (p2 > 0) label += ` 待终审:${p2}`;
      if (completed > 0) label += ` 完成:${completed}`;
      label += `)`;
      return label;
  };

  // Handlers
  const handleStoreClick = (storeId: string) => {
      setSelectedStoreId(storeId);
      const store = stores.find(s => s.id === storeId);
      if (store && store.roomTypeConfigs.length > 0) {
          setActiveRoomTypeName(store.roomTypeConfigs[0].name);
      } else {
          setActiveRoomTypeName('');
      }
  };

  const handleBackToStores = () => {
      setSelectedStoreId('');
      setActiveRoomTypeName('');
  };

  const toggleModule = (moduleName: string) => {
      setExpandedModules(prev => 
          prev.includes(moduleName) 
              ? prev.filter(m => m !== moduleName) 
              : [...prev, moduleName]
      );
  };

  const isRoomTypeCompleted = (config: RoomTypeConfig, store: any) => {
      const activeMods = store.moduleConfig.activeModules || DEFAULT_MODULES;
      // Only count measurement modules for completion here
      const measurementMods = activeMods.filter((m: string) => (store.moduleConfig.moduleTypes?.[m] || 'measurement') === 'measurement');
      const measurementCount = config.measurements ? config.measurements.filter(m => m.status === 'approved' && measurementMods.includes(m.category)).length : 0;
      return measurementCount >= measurementMods.length;
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, category: RoomImageCategory) => {
      if (!currentStore || !activeRoomTypeName || !e.target.files?.[0]) return;
      
      const url = URL.createObjectURL(e.target.files[0]);
      const newImage: RoomImage = { url, category };
      
      const updatedTypeConfigs = currentStore.roomTypeConfigs.map(rt => {
          if (rt.name === activeRoomTypeName) {
              return { ...rt, images: [...(rt.images || []), newImage] };
          }
          return rt;
      });

      updateStore(currentStore.id, { roomTypeConfigs: updatedTypeConfigs });
      e.target.value = '';
  };

  const handleRemoveImage = (imageToRemove: RoomImage) => {
      if (!currentStore || !activeRoomTypeName) return;

      const updatedTypeConfigs = currentStore.roomTypeConfigs.map(rt => {
          if (rt.name === activeRoomTypeName) {
              return { ...rt, images: (rt.images || []).filter(img => img !== imageToRemove) };
          }
          return rt;
      });

      updateStore(currentStore.id, { roomTypeConfigs: updatedTypeConfigs });
  };

  const startEditing = (category: RoomImageCategory, existing?: RoomMeasurement) => {
    setEditingCategory(category);
    if (existing) {
        setEditForm({ type: existing.type, remark: existing.remark, checklistValues: existing.checklistValues || {} });
    } else {
        setEditForm({ type: '正常安装', remark: '', checklistValues: {} });
    }
  };

  const updateChecklistValue = (paramId: string, value: string | boolean) => {
      setEditForm(prev => ({
          ...prev,
          checklistValues: { ...prev.checklistValues, [paramId]: value }
      }));
  };

  const saveMeasurement = (category: RoomImageCategory, currentStatus?: RoomMeasurementStatus) => {
      if (!currentStore || !activeRoomTypeName) return;

      const newMeasurement: RoomMeasurement = {
          category,
          type: editForm.type,
          remark: editForm.remark,
          checklistValues: editForm.checklistValues,
          status: currentStatus, // Preserve status on edit unless explicitly changing flow
          rejectReason: currentStatus === 'rejected' ? currentRoomTypeConfig?.measurements?.find(m => m.category === category)?.rejectReason : undefined
      };

      const updatedTypeConfigs = currentStore.roomTypeConfigs.map(rt => {
          if (rt.name === activeRoomTypeName) {
              const existing = rt.measurements || [];
              const others = existing.filter(m => m.category !== category);
              return { ...rt, measurements: [...others, newMeasurement] };
          }
          return rt;
      });

      updateStore(currentStore.id, { roomTypeConfigs: updatedTypeConfigs });
      setEditingCategory(null);
  };

  const submitAudit = (category: RoomImageCategory) => {
      if (!currentStore || !activeRoomTypeName) return;
      
      // Use Store-Level Checklist Config
      const configParams = currentStore.moduleConfig.checklistConfigs?.[category] || [];
      const measurement = currentRoomTypeConfig?.measurements?.find(m => m.category === category);
      const values = measurement?.checklistValues || {};

      const missingParams = configParams.filter(p => {
          const val = values[p.id];
          if (p.type === 'boolean') return val === undefined;
          return !val || (val as string).trim() === '';
      });

      if (missingParams.length > 0) {
          alert(`无法提交：还有 ${missingParams.length} 项清单参数未录入。\n未填项: ${missingParams.map(p => p.label).join(', ')}`);
          return;
      }

      const updatedTypeConfigs = currentStore.roomTypeConfigs.map(rt => {
          if (rt.name === activeRoomTypeName) {
              const existing = rt.measurements || [];
              const target = existing.find(m => m.category === category);
              if (!target) return rt;

              const updatedMeasurement = { ...target, status: 'pending_stage_1' as RoomMeasurementStatus, rejectReason: undefined };
              const others = existing.filter(m => m.category !== category);
              return { ...rt, measurements: [...others, updatedMeasurement] };
          }
          return rt;
      });

      updateStore(currentStore.id, { roomTypeConfigs: updatedTypeConfigs });
  };

  const handleApprove = (category: RoomImageCategory, currentStatus: RoomMeasurementStatus) => {
      if (!currentStore || !activeRoomTypeName) return;

      let nextStatus: RoomMeasurementStatus = 'approved';
      if (currentStatus === 'pending_stage_1') nextStatus = 'pending_stage_2';
      else if (currentStatus === 'pending_stage_2') nextStatus = 'approved';

      const updatedTypeConfigs = currentStore.roomTypeConfigs.map(rt => {
          if (rt.name === activeRoomTypeName) {
              const existing = rt.measurements || [];
              const target = existing.find(m => m.category === category);
              if (!target) return rt;

              const updatedMeasurement = { ...target, status: nextStatus };
              const others = existing.filter(m => m.category !== category);
              return { ...rt, measurements: [...others, updatedMeasurement] };
          }
          return rt;
      });

      updateStore(currentStore.id, { roomTypeConfigs: updatedTypeConfigs });
  };

  const handleReject = (category: RoomImageCategory) => {
      if (!currentStore || !activeRoomTypeName || !rejectReason.trim()) return;

      const updatedTypeConfigs = currentStore.roomTypeConfigs.map(rt => {
          if (rt.name === activeRoomTypeName) {
              const existing = rt.measurements || [];
              const target = existing.find(m => m.category === category);
              if (!target) return rt;

              const updatedMeasurement = { ...target, status: 'rejected' as RoomMeasurementStatus, rejectReason };
              const others = existing.filter(m => m.category !== category);
              return { ...rt, measurements: [...others, updatedMeasurement] };
          }
          return rt;
      });

      updateStore(currentStore.id, { roomTypeConfigs: updatedTypeConfigs });
      setRejectingCategory(null);
      setRejectReason('');
  };

  const openExample = (moduleName: string) => {
      // Use Store-Level Example
      let exampleUrl = currentStore?.moduleConfig.exampleImages?.[moduleName] || EXAMPLE_IMAGES[moduleName];
      if (exampleUrl) {
          setViewingExample({ title: `${moduleName}示例`, url: exampleUrl });
      }
  };

  // --- VIEW 1: Store List ---
  if (!currentStore) {
      return (
        <div className="h-full flex flex-col">
            {/* Header / Filter */}
            <div className="bg-white p-4 shrink-0 shadow-sm border-b border-slate-100 z-10">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                    <Store size={12} /> 大区筛选
                </h3>
                <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                    >
                        <option value="">{getAllRegionsLabel()}</option>
                        {regions.map(r => <option key={r.id} value={r.id}>{getRegionLabel(r)}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>

            {/* Store List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredStores.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs">没有找到符合条件的门店</div>
                )}
                {filteredStores.map(store => {
                    const roomTypes = store.roomTypeConfigs || [];
                    const completedTypes = roomTypes.filter(rt => isRoomTypeCompleted(rt, store)).length;
                    const totalTypes = roomTypes.length;
                    const percent = totalTypes > 0 ? Math.round((completedTypes / totalTypes) * 100) : 0;

                    return (
                        <div 
                            key={store.id} 
                            onClick={() => handleStoreClick(store.id)}
                            className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{store.name}</h4>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {regions.find(r => r.id === store.regionId)?.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {totalTypes} 种房型
                                            </span>
                                        </div>
                                        {/* Show Task Deadline */}
                                        {store.measurementTask && (
                                            <div className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-1 self-start">
                                                <Calendar size={10} /> 期望完成: {store.measurementTask.deadline}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            
                            {/* Progress */}
                            <div className="mt-3">
                                <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                                    <span>房型复尺进度</span>
                                    <span className={percent === 100 ? 'text-green-600' : 'text-blue-600'}>{completedTypes}/{totalTypes} ({percent}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      );
  }

  // --- VIEW 2: Store Detail (Room Type Measurement) ---
  const availableRoomTypes = currentStore.roomTypeConfigs || [];

  return (
    <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white p-4 border-b border-slate-100 flex justify-between items-center shadow-sm sticky top-0 z-20">
            <div className="flex items-center gap-2">
                <button onClick={handleBackToStores} className="p-1 -ml-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Store size={14} className="text-blue-600" /> {currentStore.name}
                    </h3>
                    <p className="text-[10px] text-slate-500">门店房型复尺</p>
                </div>
            </div>
        </div>

        {/* Room Type Tabs */}
        <div className="flex px-4 border-b border-slate-100 overflow-x-auto no-scrollbar gap-6 bg-slate-50 pt-2">
            {availableRoomTypes.map(rt => (
                <button
                    key={rt.id}
                    onClick={() => setActiveRoomTypeName(rt.name)}
                    className={`py-3 text-sm font-bold whitespace-nowrap relative transition-colors ${
                        activeRoomTypeName === rt.name ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    {rt.name}
                    {activeRoomTypeName === rt.name && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
                </button>
            ))}
            {availableRoomTypes.length === 0 && <div className="py-3 text-xs text-slate-400">暂无房型</div>}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {currentRoomTypeConfig ? (
                activeModules.map(moduleName => {
                    // Data Extraction
                    const images = currentRoomTypeConfig.images?.filter(img => img.category === moduleName) || [];
                    const measurement = currentRoomTypeConfig.measurements?.find(m => m.category === moduleName);
                    
                    // Use Store-Level Configs
                    const requirement = currentStore.moduleConfig.exampleRequirements?.[moduleName];
                    const checklistParams = currentStore.moduleConfig.checklistConfigs?.[moduleName] || [];
                    
                    const isEditing = editingCategory === moduleName;
                    const hasImages = images.length > 0;
                    const status = measurement?.status;
                    const isExpanded = expandedModules.includes(moduleName);

                    return (
                        <div key={moduleName} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all ${
                            status === 'rejected' ? 'border-red-200 ring-2 ring-red-50' : 
                            status === 'approved' ? 'border-green-200' : 
                            'border-slate-100'
                        }`}>
                            {/* Module Header - Clickable for Accordion */}
                            <div 
                                onClick={() => toggleModule(moduleName)}
                                className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center cursor-pointer select-none hover:bg-slate-100 transition-colors"
                            >
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <div className={`w-2 h-4 rounded-full ${
                                        status === 'approved' ? 'bg-green-500' : 
                                        status === 'rejected' ? 'bg-red-500' : 
                                        (status === 'pending_stage_1' || status === 'pending_stage_2') ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}></div>
                                    {moduleName}
                                </h4>
                                <div className="flex items-center gap-2">
                                    {status && (
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                            status === 'approved' ? 'bg-green-100 text-green-700' : 
                                            status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                            'bg-orange-100 text-orange-700'
                                        }`}>
                                            {status === 'pending_stage_1' ? '待初审' : 
                                                status === 'pending_stage_2' ? '待终审' :
                                                status === 'approved' ? '已通过' : '已驳回'}
                                        </span>
                                    )}
                                    <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-mono">共 {images.length} 张图</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); openExample(moduleName); }}
                                        className="flex items-center gap-1 text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 font-bold transition-colors"
                                    >
                                        <HelpCircle size={10} /> 示例
                                    </button>
                                    <div className="pl-1 text-slate-400">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="animate-fadeIn">
                                    {/* Requirement Display */}
                                    {requirement && (
                                        <div className="px-4 pt-3 pb-0">
                                            <div className="bg-yellow-50 text-yellow-800 text-[10px] p-2 rounded border border-yellow-100 flex items-start gap-1">
                                                <div className="font-bold shrink-0">需求:</div>
                                                <div className="whitespace-pre-wrap">{requirement}</div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Part 1: Images Grid */}
                                    <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 content-start">
                                        {/* Upload Button */}
                                        <div className="aspect-square border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center relative hover:bg-blue-50 transition-colors cursor-pointer group">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={(e) => handleImageUpload(e, moduleName)} 
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" 
                                            />
                                            <Upload className="text-blue-400 mb-1 group-hover:scale-110 transition-transform" size={20} />
                                            <span className="text-[10px] text-blue-500 font-bold">上传</span>
                                        </div>

                                        {/* Image List */}
                                        {images.map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-xl border border-slate-200 relative group overflow-hidden bg-white shadow-sm">
                                                <img src={img.url} alt={`${moduleName}-${idx}`} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button 
                                                        onClick={() => handleRemoveImage(img)}
                                                        className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transform scale-90 hover:scale-100 transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Divider */}
                                    <div className="h-px bg-slate-100 mx-4"></div>

                                    {/* Part 2: Evaluation & Audit - Refactored to separate component */}
                                    <div className="p-4">
                                        <h5 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                                            <ClipboardList size={12} /> 复尺评估
                                        </h5>
                                        
                                        <EvaluationPanel 
                                            moduleName={moduleName}
                                            hasImages={hasImages}
                                            isEditing={isEditing}
                                            measurement={measurement}
                                            checklistParams={checklistParams}
                                            editForm={editForm}
                                            rejectingCategory={rejectingCategory}
                                            rejectReason={rejectReason}
                                            // Handlers
                                            onStartEditing={() => startEditing(moduleName, measurement)}
                                            onCancelEditing={() => setEditingCategory(null)}
                                            onSave={(st) => saveMeasurement(moduleName, st)}
                                            onUpdateChecklist={updateChecklistValue}
                                            onSetForm={(form) => setEditForm(prev => ({...prev, ...form}))}
                                            onSubmitAudit={() => submitAudit(moduleName)}
                                            onStartReject={() => setRejectingCategory(moduleName)}
                                            onCancelReject={() => setRejectingCategory(null)}
                                            onConfirmReject={() => handleReject(moduleName)}
                                            onSetRejectReason={setRejectReason}
                                            onApprove={(st) => handleApprove(moduleName, st)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-20 text-slate-400 text-xs">
                    请先在「客房建档」或「房型配置」中添加房型
                </div>
            )}
        </div>

        {/* Example Image Modal */}
        {viewingExample && (
            <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setViewingExample(null)}>
                <div className="bg-transparent w-full max-w-lg flex flex-col items-center animate-scaleIn" onClick={e => e.stopPropagation()}>
                    <div className="bg-white rounded-t-lg px-4 py-2 w-full flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <ImageIcon size={16} className="text-blue-500"/> {viewingExample.title}
                        </span>
                        <button onClick={() => setViewingExample(null)} className="p-1 hover:bg-slate-100 rounded-full">
                            <X size={16} className="text-slate-500"/>
                        </button>
                    </div>
                    <div className="bg-black rounded-b-lg overflow-hidden w-full border-t border-slate-100"><img src={viewingExample.url} alt="Example" className="w-full max-h-[70vh] object-contain" /></div>
                </div>
            </div>
        )}
    </div>
  );
};