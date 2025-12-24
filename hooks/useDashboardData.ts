import { useMemo } from 'react';
import { Device, DeviceStatus, OpsStatus } from '../types';

export const useDashboardData = (
  devices: Device[],
  selectedRegion: string,
  selectedStore: string,
  selectedType: string,
  startDate: string,
  endDate: string
) => {
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
        if (!startDate && !endDate) return true; // If no date, assume all
        const deviceDateStr = d.firstStartTime.split(' ')[0] || d.firstStartTime.split('T')[0];
        if (startDate && deviceDateStr < startDate) return false;
        if (endDate && deviceDateStr > endDate) return false;
        return true;
    }).length;

    // B. Running Devices: Status is ONLINE or IN_USE
    const runningCount = scopedDevices.filter(d => d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.IN_USE).length;

    // C. Complaint Devices
    const complaintCount = scopedDevices.filter(d => d.opsStatus === OpsStatus.HOTEL_COMPLAINT).length;
    
    // Total Faults (Complaint Only now)
    const totalFaults = complaintCount;

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
        // Calculate date range for the week
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (weeks - 1 - i) * 7);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        
        const startStr = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
        const endStr = `${endDate.getMonth() + 1}/${endDate.getDate()}`;
        const dateRange = `(${startStr}-${endStr})`;

        return {
            week: `W${i + 1} ${dateRange}`,
            weeklyFailureRate: Math.max(0, stats.deviceFailureRate + (Math.random() * 10 - 5)),
            weeklyStartupFailRate: Math.max(0, stats.startupFailureRate + (Math.random() * 2 - 1)),
            weeklyDurationFailRate: Math.max(0, stats.durationFailureRate + (Math.random() * 1 - 0.5)),
        }
    });

    return { dailyData, weeklyData };
  }, [stats]);

  return { scopedDevices, stats, chartData };
};