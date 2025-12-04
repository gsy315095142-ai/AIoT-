
export type Region = {
  id: string;
  name: string;
};

export type Store = {
  id: string;
  regionId: string;
  name: string;
};

export type DeviceType = {
  id: string;
  name: string;
};

export enum DeviceStatus {
  ONLINE = 'Online',
  OFFLINE = 'Offline',
  STANDBY = 'Standby',
  IN_USE = 'In Use'
}

export enum OpsStatus {
  INSPECTED = '已巡检', // Inspected
  REPAIRING = '维修中', // Repairing
  ABNORMAL = '异常', // Abnormal
  PENDING = '待审核', // Pending Audit
}

export type DeviceEvent = {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  operator?: string; // New operator field
};

export type DeviceImage = {
  url: string;
  category: string; // '设备外观', '安装现场', '其他'
};

export type Device = {
  id: string;
  name: string;
  sn: string;
  mac?: string; // New MAC Address field
  regionId: string;
  storeId: string;
  typeId: string;
  
  // Hardware/Soft Details
  roomNumber: string;
  softwareName: string;
  imageUrl?: string; // Main thumbnail for list view
  images?: DeviceImage[]; // Multiple images support
  
  // Statuses
  status: DeviceStatus;
  opsStatus: OpsStatus;
  
  // Specs
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  signalStrength: number; // percentage (-dBm converted or simple 0-100)
  
  // Timestamps
  firstStartTime: string;
  lastTestTime: string;
  
  events: DeviceEvent[];
};
