
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { FilterBar } from '../components/FilterBar';
import { DeviceStatus, OpsStatus, AuditStatus } from '../types';
import { Calendar, Play, Download, Settings2, Zap, Clock, AlertTriangle, Activity, AlertOctagon, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const Dashboard: React.FC = () => {
  const { devices, regions, stores, deviceTypes, auditRecords } = useApp();
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // Date Range State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Chart Navigation State
  const [currentChartIndex, setCurrentChartIndex] = useState(0);

  // Date Helper
  const formatDate = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  };

  const setQuickDate = (type: 'today' | 'yesterday' | 'week' | 'lastWeek' | 'all') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
        // Start and End are today
    } else if (type === 'yesterday') {
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
    } else if (type === 'week') {
        // Monday of this week
        const day = today.getDay() || 7; // Sunday is 0, make it 7
        if (day !== 1) start.setDate(today.getDate() - (day - 1));
        // End is today
    } else if (type === 'lastWeek') {
        const day = today.getDay() || 7;
        start.setDate(today.getDate() - day - 6); // Last Monday
        end.setDate(today.getDate() - day); // Last Sunday
    } else if (type === 'all') {
        start = new Date('2020-01-01'); // Arbitrary start of "all time"
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  // 1. Scoped Devices: Filtered by Region, Store, Type ONLY
  const scopedDevices = useMemo(() => {
    return devices.filter(d => {
      if (selectedRegion && d.regionId !== selectedRegion) return false;
      if (selectedStore && d.storeId !== selectedStore) return false;
      if (selectedType && d.typeId !== selectedType) return false;
      return true;
    });
  }, [devices, selectedRegion, selectedStore, selectedType]);

  // 2. Statistics Calculation
  const stats = useMemo(() => {
    // A. Installed in Period (using startDate/endDate filter on scopedDevices)
    const installedCount = scopedDevices.filter(d => {
        if (!startDate && !endDate) return true; // If no date, maybe all? Or 0? Usually "All". Let's assume all if no filter.
        const deviceDateStr = d.firstStartTime.split(' ')[0] || d.firstStartTime.split('T')[0];
        if (startDate && deviceDateStr < startDate) return false;
        if (endDate && deviceDateStr > endDate) return false;
        return true;
    }).length;

    // B. Running Devices: Status is ONLINE or IN_USE
    const runningCount = scopedDevices.filter(d => d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.IN_USE).length;

    // C. Complaint Devices
    const complaintCount = scopedDevices.filter(d => d.opsStatus === OpsStatus.HOTEL_COMPLAINT).length;
    
    // D. Abnormal Devices
    const abnormalCount = scopedDevices.filter(d => d.opsStatus === OpsStatus.ABNORMAL).length;
    
    // Total Faults (Abnormal + Complaint)
    const totalFaults = abnormalCount + complaintCount;

    // E. Total Start Count
    const totalStartCount = scopedDevices.reduce((acc, d) => acc + (d.totalStartCount || 0), 0);

    // F. Total Run Duration
    const totalRunDuration = scopedDevices.reduce((acc, d) => acc + (d.totalRunDuration || 0), 0);

    // Rates
    // G. Startup App Failure Rate = Total Faults / Total Start Count
    const startupFailureRate = totalStartCount > 0 ? (totalFaults / totalStartCount) * 100 : 0;

    // H. Work Duration Failure Rate = Total Faults / Total Run Duration
    const durationFailureRate = totalRunDuration > 0 ? (totalFaults / totalRunDuration) * 100 : 0;

    // I. Device Failure Rate = Total Faults / Running Devices
    const deviceFailureRate = runningCount > 0 ? (totalFaults / runningCount) * 100 : 0;

    // J. Device Complaint Rate = Complaint Count / Running Devices
    const complaintRate = runningCount > 0 ? (complaintCount / runningCount) * 100 : 0;

    return {
        installedCount,
        runningCount,
        complaintCount,
        totalStartCount,
        totalRunDuration,
        startupFailureRate,
        durationFailureRate,
        deviceFailureRate,
        complaintRate
    };
  }, [scopedDevices, startDate, endDate]);

  const StatCard = ({ label, value, unit, icon: Icon, colorClass, isRate = false }: any) => (
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-24 relative overflow-hidden">
          <div className={`absolute top-0 right-0 p-2 opacity-10 ${colorClass}`}>
              <Icon size={48} />
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase z-10">{label}</p>
          <div className="z-10">
              <span className={`text-2xl font-bold tracking-tight ${colorClass.replace('bg-', 'text-')}`}>
                  {isRate ? value.toFixed(2) : value}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">{unit}</span>
          </div>
      </div>
  );

  // --- MOCK CHART DATA GENERATOR ---
  // Since we don't have historical data in the context, we generate plausible trend data based on current stats
  const chartData = useMemo(() => {
    const days = 14;
    const dailyData = Array.from({ length: days }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        
        // Randomize around current stats to simulate history
        return {
            date: dateStr,
            installCount: Math.max(0, Math.floor(stats.installedCount / days + (Math.random() * 2 - 1))),
            complaintCount: Math.max(0, Math.floor(stats.complaintCount / days + (Math.random() * 1 - 0.2))),
            
            totalFailureRate: Math.max(0, stats.deviceFailureRate + (Math.random() * 5 - 2.5)),
            totalComplaintRate: Math.max(0, stats.complaintRate + (Math.random() * 2 - 1)),
            totalStartupFailRate: Math.max(0, stats.startupFailureRate + (Math.random() * 1 - 0.5)),
            totalDurationFailRate: Math.max(0, stats.durationFailureRate + (Math.random() * 0.5 - 0.25)),
        };
    });

    const weeks = 8;
    const weeklyData = Array.from({ length: weeks }).map((_, i) => {
        return {
            week: `W${i + 1}`,
            weeklyFailureRate: Math.max(0, stats.deviceFailureRate + (Math.random() * 10 - 5)),
            weeklyStartupFailRate: Math.max(0, stats.startupFailureRate + (Math.random() * 2 - 1)),
            weeklyDurationFailRate: Math.max(0, stats.durationFailureRate + (Math.random() * 1 - 0.5)),
        }
    });

    return { dailyData, weeklyData };
  }, [stats]);

  const chartConfigs = [
    {
        title: '安装与售后数量趋势',
        data: chartData.dailyData,
        xKey: 'date',
        lines: [
            { key: 'installCount', name: '安装数量', color: '#3b82f6' },
            { key: 'complaintCount', name: '售后数量', color: '#ec4899' }
        ]
    },
    {
        title: '每周设备故障率',
        data: chartData.weeklyData,
        xKey: 'week',
        lines: [
            { key: 'weeklyFailureRate', name: '故障率(%)', color: '#ef4444' }
        ]
    },
    {
        title: '总设备故障率趋势',
        data: chartData.dailyData,
        xKey: 'date',
        lines: [
            { key: 'totalFailureRate', name: '总故障率(%)', color: '#ef4444' }
        ]
    },
    {
        title: '总设备客诉率趋势',
        data: chartData.dailyData,
        xKey: 'date',
        lines: [
            { key: 'totalComplaintRate', name: '总客诉率(%)', color: '#ec4899' }
        ]
    },
    {
        title: '每周启动应用故障率',
        data: chartData.weeklyData,
        xKey: 'week',
        lines: [
            { key: 'weeklyStartupFailRate', name: '启动故障率(%)', color: '#f59e0b' }
        ]
    },
    {
        title: '总启动应用故障率趋势',
        data: chartData.dailyData,
        xKey: 'date',
        lines: [
            { key: 'totalStartupFailRate', name: '总启动故障率(%)', color: '#f59e0b' }
        ]
    },
    {
        title: '每周工作时长故障率',
        data: chartData.weeklyData,
        xKey: 'week',
        lines: [
            { key: 'weeklyDurationFailRate', name: '时长故障率(%)', color: '#8b5cf6' }
        ]
    },
    {
        title: '总工作时长故障率趋势',
        data: chartData.dailyData,
        xKey: 'date',
        lines: [
            { key: 'totalDurationFailRate', name: '总时长故障率(%)', color: '#8b5cf6' }
        ]
    }
  ];

  const handleNextChart = () => {
    setCurrentChartIndex((prev) => (prev + 1) % chartConfigs.length);
  };

  const handlePrevChart = () => {
    setCurrentChartIndex((prev) => (prev - 1 + chartConfigs.length) % chartConfigs.length);
  };

  const CurrentChart = chartConfigs[currentChartIndex];

  return (
    <div className="p-4 pb-20">
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
           <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Calendar size={10} /> 时间段筛选 (用于安装数量统计)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1">
                <button onClick={() => setQuickDate('today')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded transition-colors border border-slate-200">今日</button>
                <button onClick={() => setQuickDate('yesterday')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded transition-colors border border-slate-200">昨日</button>
                <button onClick={() => setQuickDate('week')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded transition-colors border border-slate-200">本周</button>
                <button onClick={() => setQuickDate('lastWeek')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded transition-colors border border-slate-200">上周</button>
                <button onClick={() => setQuickDate('all')} className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 rounded transition-colors border border-slate-200">全周期</button>
            </div>
            <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-slate-50 focus:ring-1 focus:ring-primary focus:outline-none min-w-0"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-slate-400 text-xs">至</span>
                <input 
                  type="date" 
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-slate-50 focus:ring-1 focus:ring-primary focus:outline-none min-w-0"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {/* Row 1: Counts */}
          <StatCard 
            label="运行设备数量" 
            value={stats.runningCount} 
            unit="台" 
            icon={Play} 
            colorClass="bg-green-500 text-green-600"
          />
          <StatCard 
            label="安装设备数量" 
            value={stats.installedCount} 
            unit="台" 
            icon={Download} 
            colorClass="bg-blue-500 text-blue-600"
          />
          <StatCard 
            label="售后设备数量" 
            value={stats.complaintCount} 
            unit="台" 
            icon={Settings2} 
            colorClass="bg-pink-500 text-pink-600"
          />
          
          {/* Row 2: Totals */}
          <StatCard 
            label="启动设备次数" 
            value={stats.totalStartCount} 
            unit="次" 
            icon={Zap} 
            colorClass="bg-yellow-500 text-yellow-600"
          />
          <StatCard 
            label="运行设备时长" 
            value={stats.totalRunDuration} 
            unit="h" 
            icon={Clock} 
            colorClass="bg-purple-500 text-purple-600"
          />

          {/* Spacer for 2-col grid alignment on mobile if needed, or just next card */}
          <div className="hidden md:block"></div> 

          {/* Row 3: Rates */}
          <StatCard 
            label="启动应用故障率" 
            value={stats.startupFailureRate} 
            unit="%" 
            icon={AlertTriangle} 
            colorClass="bg-red-500 text-red-600"
            isRate
          />
          <StatCard 
            label="工作时长故障率" 
            value={stats.durationFailureRate} 
            unit="%" 
            icon={Activity} 
            colorClass="bg-orange-500 text-orange-600"
            isRate
          />
          <StatCard 
            label="设备故障率" 
            value={stats.deviceFailureRate} 
            unit="%" 
            icon={AlertOctagon} 
            colorClass="bg-rose-500 text-rose-600"
            isRate
          />
          <StatCard 
            label="设备客诉率" 
            value={stats.complaintRate} 
            unit="%" 
            icon={Settings2} 
            colorClass="bg-pink-500 text-pink-600"
            isRate
          />
      </div>

      {/* Chart Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevChart} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={20} /></button>
            <div className="flex flex-col items-center">
                <h3 className="font-bold text-slate-800 text-sm">{CurrentChart.title}</h3>
                <div className="flex gap-1 mt-1">
                    {chartConfigs.map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx === currentChartIndex ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                    ))}
                </div>
            </div>
            <button onClick={handleNextChart} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={20} /></button>
        </div>
        
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={CurrentChart.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                        dataKey={CurrentChart.xKey} 
                        tick={{ fontSize: 10, fill: '#64748b' }} 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10}
                    />
                    <YAxis 
                        tick={{ fontSize: 10, fill: '#64748b' }} 
                        axisLine={false} 
                        tickLine={false} 
                        width={30}
                    />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    {CurrentChart.lines.map((line, idx) => (
                        <Line 
                            key={idx}
                            type="monotone" 
                            dataKey={line.key} 
                            name={line.name} 
                            stroke={line.color} 
                            strokeWidth={3} 
                            dot={{ r: 3, strokeWidth: 0, fill: line.color }}
                            activeDot={{ r: 5 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
