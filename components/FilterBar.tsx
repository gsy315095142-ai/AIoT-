import React from 'react';
import { Region, Store, DeviceType } from '../types';

interface FilterBarProps {
  regions: Region[];
  stores: Store[];
  deviceTypes: DeviceType[];
  selectedRegion: string;
  selectedStore: string;
  selectedType: string;
  onRegionChange: (val: string) => void;
  onStoreChange: (val: string) => void;
  onTypeChange: (val: string) => void;
  extraFilters?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  regions,
  stores,
  deviceTypes,
  selectedRegion,
  selectedStore,
  selectedType,
  onRegionChange,
  onStoreChange,
  onTypeChange,
  extraFilters
}) => {
  // Filter stores based on selected region
  const availableStores = selectedRegion 
    ? stores.filter(s => s.regionId === selectedRegion)
    : stores;

  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 mb-4 grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1 col-span-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase">大区</label>
        <select 
          className="border border-slate-200 rounded-lg px-2 py-2 text-xs bg-slate-50 focus:ring-1 focus:ring-primary focus:outline-none w-full"
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
        >
          <option value="">全部大区</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1 col-span-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase">门店</label>
        <select 
          className="border border-slate-200 rounded-lg px-2 py-2 text-xs bg-slate-50 focus:ring-1 focus:ring-primary focus:outline-none w-full"
          value={selectedStore}
          onChange={(e) => onStoreChange(e.target.value)}
        >
          <option value="">全部门店</option>
          {availableStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1 col-span-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase">设备类型</label>
        <select 
          className="border border-slate-200 rounded-lg px-2 py-2 text-xs bg-slate-50 focus:ring-1 focus:ring-primary focus:outline-none w-full"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <option value="">全部类型</option>
          {deviceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {extraFilters && (
        <div className="col-span-2">
           {extraFilters}
        </div>
      )}
    </div>
  );
};