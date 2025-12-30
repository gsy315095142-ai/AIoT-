import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Device, DeviceType, Region, Store, DeviceStatus, OpsStatus, DeviceEvent, AuditRecord, AuditStatus, AuditType, StoreInstallation, InstallNode, Product, RoomTypeConfig, ProcurementOrder, ProductSubType, UserRole, StoreModuleConfig } from '../types';

// Initial Mock Data
const MOCK_REGIONS: Region[] = [
  { id: 'r1', name: '鲲鹏大区' },
  { id: 'r2', name: '腾龙大区' },
  { id: 'r3', name: '麒麟大区' },
];

const DEFAULT_NODES: InstallNode[] = [
    { name: '预约安装时间', completed: false, data: '' },
    { name: '到店打卡', completed: false, data: [] }, // Renamed from 打卡
    { name: '清点货物', completed: false, data: [] },
    { name: '安装', completed: false, data: {} }, 
    { name: '调试', completed: false, data: [] }, 
    { name: '交付', completed: false, data: [] }, 
];

const createMockInstallation = (status: any = 'unstarted'): StoreInstallation => ({
    status,
    nodes: JSON.parse(JSON.stringify(DEFAULT_NODES)), // Deep copy
    appointmentTime: undefined
});

const DEFAULT_ROOM_TYPES: RoomTypeConfig[] = [
    { id: 'rt1', name: '普通房', images: [], measurements: [] },
    { id: 'rt2', name: '样板房', images: [], measurements: [] },
];

// Measurement Modules
const DEFAULT_MEASUREMENT_MODULES = [
    '地投环境',
    '桌显桌子形状尺寸',
    '床头背景墙尺寸',
    '桌显处墙面宽高',
    '浴室镜面形状和尺寸',
    '电视墙到床尾距离',
    '照片墙处墙面宽高',
    '玩乐活动区域长宽'
];

// Installation Modules
const DEFAULT_INSTALLATION_MODULES = [
    '地投',
    '桌显'
];

const createDefaultModuleConfig = (): StoreModuleConfig => {
    const moduleTypes: Record<string, 'measurement' | 'installation'> = {};
    
    // Set Measurement Types
    DEFAULT_MEASUREMENT_MODULES.forEach(m => moduleTypes[m] = 'measurement');
    
    // Set Installation Types
    DEFAULT_INSTALLATION_MODULES.forEach(m => moduleTypes[m] = 'installation');

    return {
        activeModules: [...DEFAULT_MEASUREMENT_MODULES, ...DEFAULT_INSTALLATION_MODULES],
        moduleTypes: moduleTypes,
        exampleImages: {
            '地投环境': 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=600&auto=format&fit=crop',
            '桌显桌子形状尺寸': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=600&auto=format&fit=crop',
            '床头背景墙尺寸': 'https://images.unsplash.com/photo-1505693416388-b0346ef4174d?q=80&w=600&auto=format&fit=crop',
            '桌显处墙面宽高': 'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=600&auto=format&fit=crop',
            '浴室镜面形状和尺寸': 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=600&auto=format&fit=crop',
            '电视墙到床尾距离': 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=600&auto=format&fit=crop',
            '照片墙处墙面宽高': 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600&auto=format&fit=crop',
            '玩乐活动区域长宽': 'https://images.unsplash.com/photo-1596178065887-1198b6148b2e?q=80&w=600&auto=format&fit=crop',
            // Default Installation Examples
            '地投': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=600&auto=format&fit=crop',
            '桌显': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=600&auto=format&fit=crop'
        },
        exampleRequirements: {},
        checklistConfigs: {}
    };
};

const MOCK_STORES: Store[] = [
  { 
    id: 's1', 
    regionId: 'r1', 
    name: '上海南京路店', 
    roomTypeConfigs: DEFAULT_ROOM_TYPES.map(rt => ({
        ...rt
    })),
    // Define store-specific module config overriding defaults for S1
    moduleConfig: {
        ...createDefaultModuleConfig(),
        exampleRequirements: {
            '地投环境': `进入房间，对着门拍一张照片
1.玄关定位（标记距离门2m处天花板的位置）
2.图片能看清玄关地板颜色/纹路（确保投影画面清晰）
3.门两边宽度`
        },
        checklistConfigs: {
            '地投环境': [
                { id: 'cp-def-1', label: '玄关高度（cm）', type: 'text' },
                { id: 'cp-def-2', label: '玄关宽度（cm）', type: 'text' },
                { id: 'cp-def-3', label: '橱柜/门板干涉', type: 'boolean' },
                { id: 'cp-def-4', label: '电箱可拉电', type: 'boolean' },
                { id: 'cp-def-5', label: '电源有备用220V插座', type: 'boolean' },
                { id: 'cp-def-6', label: '满足安装', type: 'boolean' },
            ]
        }
    },
    rooms: [
        { number: '2101', type: '普通房' },
        { number: '2102', type: '普通房' },
        { number: '2103', type: '样板房' }
    ],
    installation: createMockInstallation()
  },
  { 
    id: 's2', 
    regionId: 'r1', 
    name: '杭州西湖店', 
    roomTypeConfigs: JSON.parse(JSON.stringify(DEFAULT_ROOM_TYPES)),
    moduleConfig: createDefaultModuleConfig(),
    rooms: [
        { number: '101', type: '普通房' },
        { number: '102', type: '样板房' }
    ],
    installation: createMockInstallation() 
  },
  { 
    id: 's3', 
    regionId: 'r2', 
    name: '北京三里屯店', 
    roomTypeConfigs: JSON.parse(JSON.stringify(DEFAULT_ROOM_TYPES)),
    moduleConfig: createDefaultModuleConfig(),
    rooms: [
        { number: 'Lobby', type: '普通房' },
        { number: '301', type: '普通房' },
        { number: '302', type: '普通房' }
    ],
    installation: createMockInstallation()
  },
  { 
    id: 's4', 
    regionId: 'r3', 
    name: '广州天河城店', 
    roomTypeConfigs: JSON.parse(JSON.stringify(DEFAULT_ROOM_TYPES)),
    moduleConfig: createDefaultModuleConfig(),
    rooms: [
        { number: '501', type: '普通房' },
        { number: '505', type: '普通房' }
    ],
    installation: createMockInstallation()
  },
];

const MOCK_DEVICE_TYPES: DeviceType[] = [
  { id: 't1', name: '桌显' },
  { id: 't2', name: '地投' },
  { id: 't3', name: '头显' },
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
    subType: '桌显2.0',
    roomNumber: '2101',
    softwareName: '爱丽丝主题V1.3.0',
    status: DeviceStatus.ONLINE,
    opsStatus: OpsStatus.INSPECTED,
    cpuUsage: 15,
    memoryUsage: 43,
    signalStrength: 95,
    currentRunDuration: 12,
    totalStartCount: 45,
    totalRunDuration: 1200,
    firstStartTime: '2025-08-02 14:00',
    lastTestTime: '2025-08-25 11:00',
    lastTestResult: 'Qualified',
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
    // subType: undefined for Floor Projector
    roomNumber: '102',
    softwareName: 'Floor Interactive',
    status: DeviceStatus.OFFLINE,
    opsStatus: OpsStatus.REPAIRING,
    cpuUsage: 89,
    memoryUsage: 75,
    signalStrength: 40,
    currentRunDuration: 0,
    totalStartCount: 102,
    totalRunDuration: 3400,
    firstStartTime: '2023-02-20T10:00:00',
    lastTestTime: '2023-10-26T10:00:00',
    lastTestResult: 'Unqualified',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=300&auto=format&fit=crop',
    images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?q=80&w=300&auto=format&fit=crop', category: '设备外观' }],
    events: []
  },
  {
    id: 'd3',
    name: '头显-Lite',
    sn: 'SN-2023-7777',
    mac: '11:22:33:44:55:66',
    regionId: 'r2',
    storeId: 's3',
    typeId: 't3',
    subType: '大堂头显',
    roomNumber: 'Lobby',
    softwareName: 'VR World',
    status: DeviceStatus.STANDBY,
    opsStatus: OpsStatus.INSPECTED, // Changed from PENDING for demo consistency
    cpuUsage: 15,
    memoryUsage: 30,
    signalStrength: 100,
    currentRunDuration: 4,
    totalStartCount: 23,
    totalRunDuration: 560,
    firstStartTime: '2023-03-10T08:00:00',
    lastTestTime: '2023-10-26T09:00:00',
    lastTestResult: 'Qualified',
    imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269fb1ac?q=80&w=300&auto=format&fit=crop',
    images: [{ url: 'https://images.unsplash.com/photo-1622979135225-d2ba269fb1ac?q=80&w=300&auto=format&fit=crop', category: '设备外观' }],
    events: []
  }
];

// Initialize default products from device types
const INITIAL_PRODUCTS: Product[] = MOCK_DEVICE_TYPES.map(dt => ({
    id: `prod-auto-${dt.id}`,
    name: `${dt.name}`, // Standardized name
    type: '硬件',
    subType: dt.name as ProductSubType, // Assuming device type names align with product sub types
    price: 0,
    imageUrl: ''
}));

const MOCK_PRODUCTS: Product[] = [...INITIAL_PRODUCTS];

export type AuditPermissionType = 'procurement' | 'measurement' | 'installation' | 'device';

interface AppContextType {
  currentUser: string | null;
  userRole: UserRole | null;
  login: (username: string, role: UserRole) => void;
  logout: () => void;
  checkAuditPermission: (type: AuditPermissionType, stage?: number) => boolean;
  regions: Region[];
  stores: Store[];
  deviceTypes: DeviceType[];
  devices: Device[];
  auditRecords: AuditRecord[];
  
  // Procurement
  procurementProducts: Product[];
  addProcurementProduct: (product: Omit<Product, 'id'>) => void;
  updateProcurementProduct: (id: string, data: Partial<Product>) => void;
  removeProcurementProduct: (id: string) => void;
  
  procurementOrders: ProcurementOrder[];
  addProcurementOrder: (order: Omit<ProcurementOrder, 'id' | 'status' | 'currentStep' | 'createTime'>) => void;
  updateProcurementOrder: (id: string, data: Partial<ProcurementOrder>) => void;

  // Header Action
  headerRightAction: ReactNode;
  setHeaderRightAction: (node: ReactNode) => void;

  addRegion: (name: string) => void;
  updateRegion: (id: string, name: string) => void;
  removeRegion: (id: string) => void;
  addStore: (store: Store) => void;
  updateStore: (id: string, data: Partial<Store>) => void;
  updateStoreInstallation: (storeId: string, data: Partial<StoreInstallation>) => void;
  removeStore: (id: string) => void;
  addDeviceType: (name: string) => void;
  removeDeviceType: (id: string) => void;
  addDevice: (device: Omit<Device, 'id' | 'events' | 'status' | 'opsStatus' | 'cpuUsage' | 'memoryUsage' | 'signalStrength' | 'lastTestTime'>) => void;
  updateDevice: (id: string, data: Partial<Device>, customEventMessage?: string, eventMeta?: { remark?: string, images?: string[] }) => void;
  deleteDeviceEvent: (deviceId: string, eventId: string) => void;
  submitOpsStatusChange: (deviceId: string, targetStatus: OpsStatus, reason: string, images?: string[]) => void;
  submitInspectionReport: (deviceId: string, result: 'Qualified' | 'Unqualified', remark: string, images?: string[]) => void;
  approveAudit: (recordId: string) => void;
  rejectAudit: (recordId: string, reason: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [regions, setRegions] = useState<Region[]>(MOCK_REGIONS);
  const [stores, setStores] = useState<Store[]>(MOCK_STORES);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>(MOCK_DEVICE_TYPES);
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [procurementProducts, setProcurementProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [procurementOrders, setProcurementOrders] = useState<ProcurementOrder[]>([]);
  const [headerRightAction, setHeaderRightAction] = useState<ReactNode>(null);

  const login = (username: string, role: UserRole) => {
    setCurrentUser(username);
    setUserRole(role);
  };

  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
  };

  const checkAuditPermission = (type: AuditPermissionType, stage?: number) => {
      // 3.1: Admin & Product Director have all permissions
      if (userRole === 'admin' || userRole === 'product_director') return true;
      
      // 3.2: Local (Install Engineer) checks Procurement
      if (type === 'procurement' && userRole === 'local') return true;
      
      // Device audit fallback (Ops Manager)
      if (type === 'device' && userRole === 'ops_manager') return true;

      // 2.3 & 2.4: Room Measurement Multi-stage
      if (type === 'measurement') {
          // Stage 1 (初审): Ops Manager
          if (stage === 1 && userRole === 'ops_manager') return true;
          // Stage 2 (终审): Business Manager
          if (stage === 2 && userRole === 'business_manager') return true;
      }

      // 3.3 - 3.6: Installation Progress Multi-stage
      if (type === 'installation') {
          // Stage 1 (初审): Ops Manager
          if (stage === 1 && userRole === 'ops_manager') return true;
          // Stage 2 (二审): Artist
          if (stage === 2 && userRole === 'artist') return true;
          // Stage 3 (三审): Business Manager
          if (stage === 3 && userRole === 'business_manager') return true;
          // Stage 4 (终审): Area Manager
          if (stage === 4 && userRole === 'area_manager') return true;
      }
      
      return false;
  };

  const addRegion = (name: string) => {
    setRegions([...regions, { id: `r${Date.now()}`, name }]);
  };

  const updateRegion = (id: string, name: string) => {
    setRegions(prev => prev.map(r => r.id === id ? { ...r, name } : r));
  };

  const removeRegion = (id: string) => {
    setRegions(regions.filter(r => r.id !== id));
  };

  const addStore = (store: Store) => {
    // Ensure new stores have default installation data AND module config
    const newStore: Store = { 
        ...store, 
        installation: createMockInstallation(),
        moduleConfig: createDefaultModuleConfig()
    };
    setStores([...stores, newStore]);
  };

  const updateStore = (id: string, data: Partial<Store>) => {
    setStores(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const updateStoreInstallation = (storeId: string, data: Partial<StoreInstallation>) => {
    setStores(prev => prev.map(s => {
        if (s.id === storeId) {
            return {
                ...s,
                installation: { ...s.installation!, ...data }
            };
        }
        return s;
    }));
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

  const addDevice = (deviceData: Omit<Device, 'id' | 'events' | 'status' | 'opsStatus' | 'cpuUsage' | 'memoryUsage' | 'signalStrength' | 'lastTestTime'>) => {
    const timestamp = new Date().toLocaleString(); // Simple format for demo
    const newDevice: Device = {
      ...deviceData,
      id: `d${Date.now()}`,
      status: DeviceStatus.STANDBY,
      opsStatus: OpsStatus.INSPECTED, // Default to Inspected, not Pending
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
      currentRunDuration: 0,
      totalStartCount: 0,
      totalRunDuration: 0,
      // firstStartTime is now in deviceData
      lastTestTime: timestamp,
      lastTestResult: 'Qualified',
    };
    setDevices([newDevice, ...devices]);
  };

  const updateDevice = (id: string, data: Partial<Device>, customEventMessage?: string, eventMeta?: { remark?: string, images?: string[] }) => {
    setDevices(prevDevices => prevDevices.map(d => {
      if (d.id === id) {
        const currentEvents = d.events || [];
        const newEvents: DeviceEvent[] = [];
        const timestamp = new Date().toLocaleString();

        // 1. Handle Custom Message Event (Priority for manual log inputs)
        if (customEventMessage) {
             let type: 'info' | 'warning' | 'error' = 'info';
             // Determine type based on data.opsStatus if available, or just info
             if (data.opsStatus === OpsStatus.HOTEL_COMPLAINT) type = 'error';
             else if (data.opsStatus === OpsStatus.REPAIRING) type = 'warning';
             
             newEvents.push({
                id: `evt-custom-${Date.now()}-${Math.random()}`,
                type: type,
                message: customEventMessage,
                timestamp: timestamp,
                operator: currentUser || 'System',
                remark: eventMeta?.remark,
                images: eventMeta?.images
            });
        }
        // 2. Handle Automatic Ops Status Logging (if no custom message)
        else if (data.opsStatus && data.opsStatus !== d.opsStatus) {
            let type: 'info' | 'warning' | 'error' = 'info';
            if (data.opsStatus === OpsStatus.HOTEL_COMPLAINT) type = 'error';
            if (data.opsStatus === OpsStatus.REPAIRING) type = 'warning';
            newEvents.push({
                id: `evt-ops-${Date.now()}-${Math.random()}`,
                type: type,
                message: `运维状态变更为: ${data.opsStatus}`,
                timestamp: timestamp,
                operator: currentUser || 'System',
                remark: eventMeta?.remark,
                images: eventMeta?.images
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
                operator: currentUser || 'System',
                remark: eventMeta?.remark,
                images: eventMeta?.images
            });
        }
        
        // 4. Check for Detail Changes (only if not covered above, though they can coexist)
        const relevantKeys: (keyof Device)[] = ['name', 'sn', 'roomNumber', 'softwareName', 'imageUrl', 'mac', 'subType'];
        const hasDetailChanges = relevantKeys.some(key => data[key] !== undefined && data[key] !== d[key]);
        
        if (hasDetailChanges) {
             newEvents.push({
                id: `evt-detail-${Date.now()}-${Math.random()}`,
                type: 'info',
                message: '设备详情已修改',
                timestamp: timestamp,
                operator: currentUser || 'System',
                remark: eventMeta?.remark,
                images: eventMeta?.images
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

  const deleteDeviceEvent = (deviceId: string, eventId: string) => {
    setDevices(prev => prev.map(d => {
        if (d.id === deviceId) {
            return {
                ...d,
                events: d.events.filter(e => e.id !== eventId)
            };
        }
        return d;
    }));
  };

  // --- Audit Workflow ---

  const submitOpsStatusChange = (deviceId: string, targetStatus: OpsStatus, reason: string, images?: string[]) => {
    const timestamp = new Date().toLocaleString();
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    if (device.opsStatus === targetStatus) return; // No change needed
    
    // Find store name for snapshot
    const storeName = stores.find(s => s.id === device.storeId)?.name;

    // 1. Invalidate any existing PENDING records for this device
    setAuditRecords(prev => prev.map(rec => {
        if (rec.deviceId === deviceId && rec.auditStatus === AuditStatus.PENDING && rec.type === AuditType.OPS_STATUS) {
            return { ...rec, auditStatus: AuditStatus.INVALID, auditTime: timestamp };
        }
        return rec;
    }));
    
    // 2. Create New Record
    const newRecord: AuditRecord = {
        id: `aud-${Date.now()}`,
        deviceId,
        deviceName: device.name,
        deviceSn: device.sn,
        storeName: storeName, // Snapshot
        roomNumber: device.roomNumber, // Snapshot
        type: AuditType.OPS_STATUS,
        prevOpsStatus: device.opsStatus,
        targetOpsStatus: targetStatus,
        changeReason: reason,
        images: images,
        auditStatus: AuditStatus.PENDING,
        requestTime: timestamp,
        requestUser: currentUser || 'System'
    };

    setAuditRecords(prev => [newRecord, ...prev]);

    // 3. Log Event
    updateDevice(deviceId, {}, `提交审核: ${targetStatus}`, { remark: reason, images: images });
  };

  const submitInspectionReport = (deviceId: string, result: 'Qualified' | 'Unqualified', remark: string, images?: string[]) => {
    const timestamp = new Date().toLocaleString();
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    const storeName = stores.find(s => s.id === device.storeId)?.name;

    // 1. Invalidate any existing PENDING inspection records for this device
    setAuditRecords(prev => prev.map(rec => {
        if (rec.deviceId === deviceId && rec.auditStatus === AuditStatus.PENDING && rec.type === AuditType.INSPECTION) {
            return { ...rec, auditStatus: AuditStatus.INVALID, auditTime: timestamp };
        }
        return rec;
    }));

    const newRecord: AuditRecord = {
        id: `insp-${Date.now()}`,
        deviceId,
        deviceName: device.name,
        deviceSn: device.sn,
        storeName: storeName,
        roomNumber: device.roomNumber,
        type: AuditType.INSPECTION,
        testResult: result,
        changeReason: remark,
        images: images,
        auditStatus: AuditStatus.PENDING,
        requestTime: timestamp,
        requestUser: currentUser || 'System'
    };

    setAuditRecords(prev => [newRecord, ...prev]);

    updateDevice(deviceId, {}, `提交巡检报告: ${result === 'Qualified' ? '合格' : '不合格'}`, { remark: remark, images: images });
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

      if (record.type === AuditType.OPS_STATUS && record.targetOpsStatus) {
          // Update Device Status for Ops Change
          updateDevice(record.deviceId, { 
              opsStatus: record.targetOpsStatus,
              lastTestTime: timestamp.replace(' ', 'T').replace(/\//g, '-') // Reset Timer
          }, `审核通过: 状态变更为 ${record.targetOpsStatus}`);
      } else if (record.type === AuditType.INSPECTION) {
          // Update Last Test Time AND Result for Inspection
          updateDevice(record.deviceId, {
              lastTestTime: timestamp.replace(' ', 'T').replace(/\//g, '-'),
              lastTestResult: record.testResult
          }, `巡检报告审核通过: ${record.testResult === 'Qualified' ? '合格' : '不合格'}`);
      }
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

    // Log Rejection event on device (Status remains unchanged)
    if (record.type === AuditType.OPS_STATUS) {
        updateDevice(record.deviceId, {}, `审核拒绝: 申请变更至 ${record.targetOpsStatus} 被拒绝`, { remark: rejectReason });
    } else if (record.type === AuditType.INSPECTION) {
        updateDevice(record.deviceId, {}, `巡检报告审核拒绝: 报告被驳回`, { remark: rejectReason });
    }
  };

  // --- Procurement Handlers ---
  const addProcurementProduct = (product: Omit<Product, 'id'>) => {
      setProcurementProducts(prev => [
          { ...product, id: `prod-${Date.now()}` },
          ...prev
      ]);
  };

  const updateProcurementProduct = (id: string, data: Partial<Product>) => {
      setProcurementProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const removeProcurementProduct = (id: string) => {
      setProcurementProducts(prev => prev.filter(p => p.id !== id));
  };

  const addProcurementOrder = (orderData: Omit<ProcurementOrder, 'id' | 'status' | 'currentStep' | 'createTime'>) => {
      const newOrder: ProcurementOrder = {
          ...orderData,
          id: `po-${Date.now()}`,
          status: 'pending_receive',
          currentStep: 0,
          createTime: new Date().toLocaleString(),
          stepData: {} // Initialize empty step data
      };
      setProcurementOrders(prev => [newOrder, ...prev]);
  };

  const updateProcurementOrder = (id: string, data: Partial<ProcurementOrder>) => {
      setProcurementOrders(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
  };

  return (
    <AppContext.Provider value={{ 
      currentUser,
      userRole,
      login,
      logout,
      checkAuditPermission,
      regions, stores, deviceTypes, devices, auditRecords,
      procurementProducts, addProcurementProduct, updateProcurementProduct, removeProcurementProduct,
      procurementOrders, addProcurementOrder, updateProcurementOrder,
      headerRightAction, setHeaderRightAction,
      addRegion, updateRegion, removeRegion, 
      addStore, updateStore, updateStoreInstallation, removeStore, 
      addDeviceType, removeDeviceType, 
      addDevice, updateDevice, deleteDeviceEvent,
      submitOpsStatusChange, submitInspectionReport, approveAudit, rejectAudit
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