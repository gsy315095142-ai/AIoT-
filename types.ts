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
};

export type Device = {
  id: string;
  name: string;
  sn: string;
  regionId: string;
  storeId: string;
  typeId: string;
  
  // Hardware/Soft Details
  roomNumber: string;
  softwareName: string;
  imageUrl?: string;
  
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
