

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Device, DeviceType, Region, Store, DeviceStatus, OpsStatus, DeviceEvent, AuditRecord, AuditStatus } from '../types';

// Initial Mock Data
const MOCK_REGIONS: Region[] = [
  { id: 'r1', name: '华东大区' },
  { id: 'r2', name: '华北大区' },
  { id: 'r3', name: '华南大区' },
];

const MOCK_STORES: Store[] = [
  { id: 's1', regionId: 'r1', name: '上海南京路店' },
  { id: 's2', regionId: 'r1', name: '杭州西湖店' },
  { id: 's3', regionId: 'r2', name: '北京三里屯店' },
  { id: 's4', regionId: 'r3', name: '广州天河城店' },
];

const MOCK_DEVICE_TYPES: DeviceType[] = [
  { id: 't1', name: '桌显' },
  { id: 't2', name: '地投' },
  { id: 't3', name: 'YVR' },
];

const MOCK_DEVICES: Device[] = [
  {
    id: 'd1',
    name: '桌显01号',
    sn: 'D2H412121212',
    mac: '00:1A:2B:3C:4D:5E',
    regionId: 'r1',
    storeId: 's1',
    typeId: 't1',
    roomNumber: '2101',
    softwareName: '爱丽丝主题V1.3.0',
    status: DeviceStatus.ONLINE,
    opsStatus: OpsStatus.INSPECTED,
    cpuUsage: 15,
    memoryUsage: 43,
    signalStrength: 95,
    firstStartTime: '2025-08-02 14:00',
    lastTestTime: '2025-08-25 11:00',
    imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=300&auto=format&fit=crop',
    images: [{ url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=300&auto=format&fit=crop', category: '设备外观' }],
    events: [
      { id: 'e1', type: 'info', message: '设备添加成功', timestamp: '2025-08-25 11:00', operator: '张晓梦' },
      { id: 'e2', type: 'info', message: '设备状态修改: 维修', timestamp: '2025-08-25 11:00', operator: '张晓梦' },
      { id: 'e3', type: 'info', message: '设备测试: 合格', timestamp: '2025-08-25 11:00', operator: '张晓梦' },
      { id: 'e4', type: 'info', message: '安装体验软件: 爱丽丝3.0', timestamp: '2025-08-25 11:00', operator: '张晓梦' },
    ]
  },
  {
    id: 'd2',
    name: '地投01号',
    sn: 'DT-2023-9999',
    mac: 'AA:BB:CC:DD:EE:FF',
    regionId: 'r1',
    storeId: 's1',
    typeId: 't2',
    roomNumber: '102',
    softwareName: 'Floor Interactive',
    status: DeviceStatus.OFFLINE,
    opsStatus: OpsStatus.REPAIRING,
    cpuUsage: 89,
    memoryUsage: 75,
    signalStrength: 40,
    firstStartTime: '2023-02-20T10:00:00',
    lastTestTime: '2023-10-26T10:00:00',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=300&auto=format&fit=crop',
    images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=300&auto=format&fit=crop', category: '设备外观' }],
    events: []
  },
  {
    id: 'd3',
    name: 'YVR-Lite',
    sn: 'SN-2023-7777',
    mac: '11:22:33:44:55:66',
    regionId: 'r2',
    storeId: 's3',
    typeId: 't3',
    roomNumber: 'Lobby',
    softwareName: 'VR World',
    status: DeviceStatus.STANDBY,
    opsStatus: OpsStatus.PENDING,
    cpuUsage: 15,
    memoryUsage: 30,
    signalStrength: 100,
    firstStartTime: '2023-03-10T08:00:00',
    lastTestTime: '2023-10-26T09:00:00',
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269fb1ac?q=80&w=300&auto=format&fit=crop',
    images: [{ url: 'https://images.unsplash.com/photo-1622979135225-d2ba269fb1ac?q=80&w=300&auto=format&fit=crop', category: '设备外观' }],
    events: []
  }
];

interface AppContextType {
  currentUser: string | null;
  login: (username: string) => void;
  logout: () => void;
  regions: Region[];
  stores: Store[];
  deviceTypes: DeviceType[];
  devices: Device[];
  auditRecords: AuditRecord[];
  addRegion: (name: string) => void;
  removeRegion: (id: string) => void;
  addStore: (name: string, regionId: string) => void;
  removeStore: (id: string) => void;
  addDeviceType: (name: string) => void;
  removeDeviceType: (id: string) => void;
  addDevice: (device: Omit<Device, 'id' | 'events' | 'status' | 'opsStatus' | 'cpuUsage' | 'memoryUsage' | 'signalStrength' | 'firstStartTime' | 'lastTestTime'>) => void;
  updateDevice: (id: string, data: Partial<Device>, customEventMessage?: string) => void;
  submitOpsStatusChange: (deviceId: string, targetStatus: OpsStatus, reason: string) => void;
  approveAudit: (recordId: string) => void;
  rejectAudit: (recordId: string, reason: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>(MOCK_REGIONS);
  const [stores, setStores] = useState<Store[]>(MOCK_STORES);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>(MOCK_DEVICE_TYPES);
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);

  const login = (username: string) => {
    setCurrentUser(username);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addRegion = (name: string) => {
    setRegions([...regions, { id: `r${Date.now()}`, name }]);
  };

  const removeRegion = (id: string) => {
    setRegions(regions.filter(r => r.id !== id));
  };

  const addStore = (name: string, regionId: string) => {
    setStores([...stores, { id: `s${Date.now()}`, regionId, name }]);
  };

  const removeStore = (id: string) => {
    setStores(stores.filter(s => s.id !== id));
  };

  const addDeviceType = (name: string) => {
    setDeviceTypes([...deviceTypes, { id: `t${Date.now()}`, name }]);
  };

  const removeDeviceType = (id: string) => {
    setDeviceTypes(deviceTypes.filter(t => t.id !== id));
  };

  const addDevice = (deviceData: Omit<Device, 'id' | 'events' | 'status' | 'opsStatus' | 'cpuUsage' | 'memoryUsage' | 'signalStrength' | 'firstStartTime' | 'lastTestTime'>) => {
    const timestamp = new Date().toLocaleString(); // Simple format for demo
    const newDevice: Device = {
      ...deviceData,
      id: `d${Date.now()}`,
      status: DeviceStatus.STANDBY,
      opsStatus: OpsStatus.PENDING,
      events: [
        {
            id: `evt-init-${Date.now()}`,
            type: 'info',
            message: '设备首次添加',
            timestamp: timestamp,
            operator: currentUser || 'System'
        }
      ],
      // Simulate hardware specs
      cpuUsage: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100),
      signalStrength: Math.floor(Math.random() * 100),
      firstStartTime: timestamp,
      lastTestTime: timestamp,
    };
    setDevices([newDevice, ...devices]);
  };

  const updateDevice = (id: string, data: Partial<Device>, customEventMessage?: string) => {
    setDevices(prevDevices => prevDevices.map(d => {
      if (d.id === id) {
        const currentEvents = d.events || [];
        const newEvents: DeviceEvent[] = [];
        const timestamp = new Date().toLocaleString();

        // 1. Handle Custom Message Event (Priority for manual log inputs)
        if (customEventMessage) {
             let type: 'info' | 'warning' | 'error' = 'info';
             if (data.opsStatus === OpsStatus.ABNORMAL || data.opsStatus === OpsStatus.HOTEL_COMPLAINT) type = 'error';
             else if (data.opsStatus === OpsStatus.REPAIRING) type = 'warning';

             newEvents.push({
                id: `evt-custom-${Date.now()}-${Math.random()}`,
                type: type,
                message: customEventMessage,
                timestamp: timestamp,
                operator: currentUser || 'System'
            });
        }
        // 2. Handle Automatic Ops Status Logging (if no custom message)
        else if (data.opsStatus && data.opsStatus !== d.opsStatus) {
            let type: 'info' | 'warning' | 'error' = 'info';
            if (data.opsStatus === OpsStatus.ABNORMAL || data.opsStatus === OpsStatus.HOTEL_COMPLAINT) type = 'error';
            if (data.opsStatus === OpsStatus.REPAIRING) type = 'warning';
            newEvents.push({
                id: `evt-ops-${Date.now()}-${Math.random()}`,
                type: type,
                message: `运维状态变更为: ${data.opsStatus}`,
                timestamp: timestamp,
                operator: currentUser || 'System'
            });
        }

        // 3. Handle Status Changes (Run/Sleep/Restart) - Auto log if no custom message covers it
        if (!customEventMessage && data.status && data.status !== d.status) {
             const statusMap = {
                 [DeviceStatus.ONLINE]: '运行中',
                 [DeviceStatus.STANDBY]: '待机中',
                 [DeviceStatus.OFFLINE]: '未联网',
                 [DeviceStatus.IN_USE]: '使用中',
             };
             newEvents.push({
                id: `evt-status-${Date.now()}-${Math.random()}`,
                type: 'info',
                message: `设备状态变更为: ${statusMap[data.status] || data.status}`,
                timestamp: timestamp,
                operator: currentUser || 'System'
            });
        }
        
        // 4. Check for Detail Changes (only if not covered above, though they can coexist)
        const relevantKeys: (keyof Device)[] = ['name', 'sn', 'roomNumber', 'softwareName', 'imageUrl', 'mac'];
        const hasDetailChanges = relevantKeys.some(key => data[key] !== undefined && data[key] !== d[key]);
        
        if (hasDetailChanges) {
             newEvents.push({
                id: `evt-detail-${Date.now()}-${Math.random()}`,
                type: 'info',
                message: '设备详情已修改',
                timestamp: timestamp,
                operator: currentUser || 'System'
            });
        }

        return { 
            ...d, 
            ...data,
            events: [...newEvents, ...currentEvents] 
        };
      }
      return d;
    }));
  };

  // --- Audit Workflow ---

  const submitOpsStatusChange = (deviceId: string, targetStatus: OpsStatus, reason: string) => {
    const timestamp = new Date().toLocaleString();
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    if (device.opsStatus === targetStatus) return; // No change needed

    // 1. Invalidate any existing PENDING records for this device
    setAuditRecords(prev => prev.map(rec => {
        if (rec.deviceId === deviceId && rec.auditStatus === AuditStatus.PENDING) {
            return { ...rec, auditStatus: AuditStatus.INVALID, auditTime: timestamp };
        }
        return rec;
    }));

    // 2. Find correct previous status to record
    // If current status is PENDING, we try to find the previous status from the pending record that we just invalidated
    // OR just use the current one if we assume "Pending" is a transition state. 
    // Simplified: We always record the device's *current* status as previous status. 
    // If the device was already 'Pending', then the prev status in record is 'Pending'.
    // Better UX: If device is Pending, look up the last stable status? 
    // For now, let's stick to simple state transition.
    
    // 3. Create New Record
    const newRecord: AuditRecord = {
        id: `aud-${Date.now()}`,
        deviceId,
        deviceName: device.name,
        deviceSn: device.sn,
        prevOpsStatus: device.opsStatus,
        targetOpsStatus: targetStatus,
        changeReason: reason,
        auditStatus: AuditStatus.PENDING,
        requestTime: timestamp,
        requestUser: currentUser || 'System'
    };

    setAuditRecords(prev => [newRecord, ...prev]);

    // 4. Update Device to PENDING
    updateDevice(deviceId, { opsStatus: OpsStatus.PENDING }, `提交审核: ${targetStatus} (原因: ${reason})`);
  };

  const approveAudit = (recordId: string) => {
      const timestamp = new Date().toLocaleString();
      const record = auditRecords.find(r => r.id === recordId);
      if (!record || record.auditStatus !== AuditStatus.PENDING) return;

      // Update Record
      setAuditRecords(prev => prev.map(r => 
        r.id === recordId 
            ? { ...r, auditStatus: AuditStatus.APPROVED, auditTime: timestamp, auditUser: currentUser || 'Admin' } 
            : r
      ));

      // Update Device
      updateDevice(record.deviceId, { 
          opsStatus: record.targetOpsStatus,
          lastTestTime: timestamp.replace(' ', 'T').replace(/\//g, '-') // Reset Timer: Update lastTestTime to now
      }, `审核通过: 状态变更为 ${record.targetOpsStatus}`);
  };

  const rejectAudit = (recordId: string, rejectReason: string) => {
    const timestamp = new Date().toLocaleString();
    const record = auditRecords.find(r => r.id === recordId);
    if (!record || record.auditStatus !== AuditStatus.PENDING) return;

    // Update Record
    setAuditRecords(prev => prev.map(r => 
        r.id === recordId 
            ? { ...r, auditStatus: AuditStatus.REJECTED, auditTime: timestamp, auditUser: currentUser || 'Admin', rejectReason } 
            : r
    ));

    // Revert Device Status
    // We revert to prevOpsStatus. Note: If prevOpsStatus was also PENDING (chain), this might be weird, 
    // but usually you can't manually set to PENDING, so prev should be stable.
    const revertStatus = record.prevOpsStatus === OpsStatus.PENDING ? OpsStatus.INSPECTED : record.prevOpsStatus;

    updateDevice(record.deviceId, { 
        opsStatus: revertStatus 
    }, `审核拒绝: ${rejectReason} (回退至 ${revertStatus})`);
  };

  return (
    <AppContext.Provider value={{ 
      currentUser,
      login,
      logout,
      regions, stores, deviceTypes, devices, auditRecords,
      addRegion, removeRegion, 
      addStore, removeStore, 
      addDeviceType, removeDeviceType,
      addDevice, updateDevice,
      submitOpsStatusChange, approveAudit, rejectAudit
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};