import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { FilterBar } from '../components/FilterBar';
import { StatCard, CustomXAxisTick } from '../components/DashboardWidgets';
import { useDashboardData } from '../hooks/useDashboardData';
import { DeviceStatus } from '../types';
import { Calendar, Play, Download, Settings2, Zap, Clock, AlertTriangle, Activity, AlertOctagon, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const { devices, regions, stores, deviceTypes, setHeaderRightAction } = useApp();
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // Date Range State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Chart Navigation State
  const [currentChartIndex, setCurrentChartIndex] = useState(0);

  // Use Custom Hook for Data Logic
  const { scopedDevices, stats, chartData } = useDashboardData(
    devices,
    selectedRegion,
    selectedStore,
    selectedType,
    startDate,
    endDate
  );

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

  const handleExport = useCallback(() => {
    const headers = ['设备名称', 'SN号', 'MAC地址', '大区', '门店', '设备类型', '运行状态', '运维状态', '首次启动时间', '累计运行时长(h)', '累计启动次数'];
    const csvContent = [
      headers.join(','),
      ...scopedDevices.map(d => {
        const regionName = regions.find(r => r.id === d.regionId)?.name || '';
        const storeName = stores.find(s => s.id === d.storeId)?.name || '';
        const typeName = deviceTypes.find(t => t.id === d.typeId)?.name || '';
        const statusMap: Record<string, string> = {
            [DeviceStatus.ONLINE]: '运行中',
            [DeviceStatus.OFFLINE]: '未联网',
            [DeviceStatus.STANDBY]: '待机中',
            [DeviceStatus.IN_USE]: '使用中'
        };
        return [
          d.name,
          d.sn,
          d.mac || '',
          regionName,
          storeName,
          typeName,
          statusMap[d.status] || d.status,
          d.opsStatus,
          d.firstStartTime,
          d.totalRunDuration || 0,
          d.totalStartCount || 0
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); // Handle commas in data
      })
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `设备数据导出_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [scopedDevices, regions, stores, deviceTypes]);

  useEffect(() => {
    setHeaderRightAction(
        <button 
            onClick={handleExport} 
            className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1.5 rounded hover:bg-blue-100 transition-colors"
        >
            <Download size={14} />
            导出
        </button>
    );
    return () => setHeaderRightAction(null);
  }, [handleExport, setHeaderRightAction]);

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
                        tick={<CustomXAxisTick />}
                        axisLine={false} 
                        tickLine={false} 
                        interval={0}
                        height={60}
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