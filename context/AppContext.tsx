import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Device, DeviceType, Region, Store, DeviceStatus, OpsStatus, DeviceEvent } from '../types';

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
    name: 'ZX-001',
    sn: 'SN-2023-8888',
    regionId: 'r1',
    storeId: 's1',
    typeId: 't1',
    roomNumber: '101',
    softwareName: 'Magic Table v2.0',
    status: DeviceStatus.STANDBY,
    opsStatus: OpsStatus.INSPECTED,
    cpuUsage: 45,
    memoryUsage: 60,
    signalStrength: 95,
    firstStartTime: '2023-01-15T09:00:00',
    lastTestTime: '2023-10-25T14:30:00',
    imageUrl: 'https://picsum.photos/200/200?random=1',
    events: [
      { id: 'e1', type: 'info', message: '系统启动成功', timestamp: '2023-10-25T09:00:00' },
      { id: 'e2', type: 'warning', message: '网络延迟较高', timestamp: '2023-10-25T11:20:00' }
    ]
  },
  {
    id: 'd2',
    name: 'DT-Pro',
    sn: 'SN-2023-9999',
    regionId: 'r1',
    storeId: 's1',
    typeId: 't2',
    roomNumber: '102',
    softwareName: 'Floor Interactive',
    status: DeviceStatus.IN_USE,
    opsStatus: OpsStatus.ABNORMAL,
    cpuUsage: 89,
    memoryUsage: 75,
    signalStrength: 40,
    firstStartTime: '2023-02-20T10:00:00',
    lastTestTime: '2023-10-26T10:00:00',
    imageUrl: 'https://picsum.photos/200/200?random=2',
    events: []
  },
  {
    id: 'd3',
    name: 'YVR-Lite',
    sn: 'SN-2023-7777',
    regionId: 'r2',
    storeId: 's3',
    typeId: 't3',
    roomNumber: 'Lobby',
    softwareName: 'VR World',
    status: DeviceStatus.ONLINE,
    opsStatus: OpsStatus.PENDING,
    cpuUsage: 15,
    memoryUsage: 30,
    signalStrength: 100,
    firstStartTime: '2023-03-10T08:00:00',
    lastTestTime: '2023-10-26T09:00:00',
    imageUrl: 'https://picsum.photos/200/200?random=3',
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
  addRegion: (name: string) => void;
  removeRegion: (id: string) => void;
  addStore: (name: string, regionId: string) => void;
  removeStore: (id: string) => void;
  addDeviceType: (name: string) => void;
  removeDeviceType: (id: string) => void;
  addDevice: (device: Omit<Device, 'id' | 'events' | 'status' | 'opsStatus' | 'cpuUsage' | 'memoryUsage' | 'signalStrength' | 'firstStartTime' | 'lastTestTime'>) => void;
  updateDevice: (id: string, data: Partial<Device>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>(MOCK_REGIONS);
  const [stores, setStores] = useState<Store[]>(MOCK_STORES);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>(MOCK_DEVICE_TYPES);
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);

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
    const timestamp = new Date().toISOString();
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
            timestamp: timestamp
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

  const updateDevice = (id: string, data: Partial<Device>) => {
    setDevices(prevDevices => prevDevices.map(d => {
      if (d.id === id) {
        const currentEvents = d.events || [];
        const newEvents: DeviceEvent[] = [];
        const timestamp = new Date().toISOString();

        // Check for OpsStatus Change
        if (data.opsStatus && data.opsStatus !== d.opsStatus) {
            let type: 'info' | 'warning' | 'error' = 'info';
            if (data.opsStatus === OpsStatus.ABNORMAL) type = 'error';
            if (data.opsStatus === OpsStatus.REPAIRING) type = 'warning';
            newEvents.push({
                id: `evt-ops-${Date.now()}`,
                type: type,
                message: `运维状态变更为: ${data.opsStatus}`,
                timestamp: timestamp
            });
        }
        
        // Check for Detail Changes (Name, SN, Room, Software, Image)
        const relevantKeys: (keyof Device)[] = ['name', 'sn', 'roomNumber', 'softwareName', 'imageUrl'];
        const hasDetailChanges = relevantKeys.some(key => data[key] !== undefined && data[key] !== d[key]);
        
        if (hasDetailChanges) {
             newEvents.push({
                id: `evt-detail-${Date.now()}`,
                type: 'info',
                message: '设备详情已修改',
                timestamp: timestamp
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

  return (
    <AppContext.Provider value={{ 
      currentUser,
      login,
      logout,
      regions, stores, deviceTypes, devices, 
      addRegion, removeRegion, 
      addStore, removeStore, 
      addDeviceType, removeDeviceType,
      addDevice, updateDevice
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
