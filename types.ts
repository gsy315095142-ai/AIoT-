

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
  HOTEL_COMPLAINT = '酒店客诉', // Hotel Customer Complaint
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

export enum AuditStatus {
  PENDING = '待审核',
  APPROVED = '已通过',
  REJECTED = '已拒绝',
  INVALID = '已失效'
}

export type AuditRecord = {
  id: string;
  deviceId: string;
  deviceName: string; // Snapshot for display
  deviceSn: string; // Snapshot for display
  prevOpsStatus: OpsStatus;
  targetOpsStatus: OpsStatus;
  changeReason: string;
  
  auditStatus: AuditStatus;
  requestTime: string;
  requestUser: string;
  
  auditTime?: string;
  auditUser?: string;
  rejectReason?: string;
};