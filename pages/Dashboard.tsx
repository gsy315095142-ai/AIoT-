import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FilterBar } from '../components/FilterBar';
import { DeviceStatus, OpsStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { devices, regions, stores, deviceTypes } = useApp();
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [timeRange, setTimeRange] = useState('7d'); // Mock time range state

  // Filter Logic
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (selectedRegion && d.regionId !== selectedRegion) return false;
      if (selectedStore && d.storeId !== selectedStore) return false;
      if (selectedType && d.typeId !== selectedType) return false;
      return true;
    });
  }, [devices, selectedRegion, selectedStore, selectedType]);

  // Stats Calculation
  const stats = useMemo(() => {
    return {
      total: filteredDevices.length,
      online: filteredDevices.filter(d => d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.IN_USE).length,
      abnormal: filteredDevices.filter(d => d.opsStatus === OpsStatus.ABNORMAL).length,
      repairing: filteredDevices.filter(d => d.opsStatus === OpsStatus.REPAIRING).length,
    };
  }, [filteredDevices]);

  // Chart Data: Device Status Distribution
  const statusData = useMemo(() => {
    const counts = {
      [DeviceStatus.ONLINE]: 0,
      [DeviceStatus.OFFLINE]: 0,
      [DeviceStatus.STANDBY]: 0,
      [DeviceStatus.IN_USE]: 0,
    };
    filteredDevices.forEach(d => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key as DeviceStatus] }));
  }, [filteredDevices]);

  // Chart Data: Ops Status
  const opsData = useMemo(() => {
    const counts = {
      [OpsStatus.INSPECTED]: 0,
      [OpsStatus.REPAIRING]: 0,
      [OpsStatus.ABNORMAL]: 0,
      [OpsStatus.PENDING]: 0,
    };
    filteredDevices.forEach(d => {
      counts[d.opsStatus] = (counts[d.opsStatus] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key as OpsStatus] }));
  }, [filteredDevices]);

  const COLORS = ['#22c55e', '#64748b', '#3b82f6', '#f59e0b'];
  const OPS_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#64748b'];

  return (
    <div className="p-4">
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
        extraFilters={
           <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">时间段</label>
            <select 
              className="border border-slate-200 rounded-lg px-2 py-2 text-xs bg-slate-50 focus:ring-1 focus:ring-primary focus:outline-none w-full"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="24h">近24小时</option>
              <option value="7d">近7天</option>
              <option value="30d">近30天</option>
            </select>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="p-2 rounded-full bg-blue-50 text-blue-600 mb-2">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">设备总数</p>
            <p className="text-xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="p-2 rounded-full bg-green-50 text-green-600 mb-2">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">在线/使用</p>
            <p className="text-xl font-bold text-slate-800">{stats.online}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="p-2 rounded-full bg-red-50 text-red-600 mb-2">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">异常状态</p>
            <p className="text-xl font-bold text-slate-800">{stats.abnormal}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="p-2 rounded-full bg-yellow-50 text-yellow-600 mb-2">
            <Wrench size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">维修中</p>
            <p className="text-xl font-bold text-slate-800">{stats.repairing}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="flex flex-col gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-4">设备状态分布</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={5}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-4">运维状态统计</h3>
          <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={opsData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={10} />
                <YAxis dataKey="name" type="category" width={50} fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" name="数量" radius={[0, 4, 4, 0]}>
                    {opsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={OPS_COLORS[index % OPS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};