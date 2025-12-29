

export type Region = {
  id: string;
  name: string;
};

export type UserRole = 'admin' | 'product_director' | 'hardware' | 'procurement' | 'local' | 'ops_manager' | 'business_manager' | 'artist' | 'area_manager' | 'area_assistant';

export type RoomImageCategory = '玄关' | '桌面' | '床';

export type RoomImage = {
  url: string;
  category: RoomImageCategory;
};

export type MeasurementType = '正常安装' | '特殊安装';

export type RoomMeasurementStatus = 'pending_stage_1' | 'pending_stage_2' | 'approved' | 'rejected';

export type RoomMeasurement = {
  category: RoomImageCategory;
  type: MeasurementType;
  remark: string;
  status?: RoomMeasurementStatus; // Audit Status
  rejectReason?: string;
};

// New Type for Dynamic Room Configuration
export type RoomTypeConfig = {
  id: string;
  name: string;
  exampleImages?: Record<string, string>; // Maps RoomImageCategory to URL
  
  // Moved from Room to RoomTypeConfig
  images?: RoomImage[]; // Actual Measurement Images for this Room Type
  measurements?: RoomMeasurement[]; // Measurement Data for this Room Type
};

export type Room = {
  number: string;
  type: string; // Changed from '样板房' | '普通房' union to string for dynamic types
  // measurements removed from here as they are now on Type level
  // images removed from here as they are now on Type level (for measurement)
  // However, for Installation, images are stored in the Node Data key-value pairs
};

// --- Installation Types ---
export type InstallStatus = 
  | 'unstarted' 
  | 'in_progress' 
  | 'pending_review_1' // 初审
  | 'pending_review_2' // 二审
  | 'pending_review_3' // 三审
  | 'pending_review_4' // 终审
  | 'approved' 
  | 'rejected';

export type InstallNode = {
  name: string;
  completed: boolean;
  data?: any; // Changed from string to any to support string (time), string[] (images), or object (complex room images)
  completionTime?: string; // New field for completion timestamp
};

export type StoreInstallation = {
  status: InstallStatus;
  nodes: InstallNode[];
  rejectReason?: string;
  appointmentTime?: string; // Shortcut for display
};
// --------------------------

export type Store = {
  id: string;
  regionId: string;
  name: string;
  roomTypeConfigs: RoomTypeConfig[]; // New: Per-store room types
  rooms: Room[];
  installation?: StoreInstallation; 
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
  INSPECTED = '正常', // Changed from '已巡检' to '正常'
  REPAIRING = '维修中', // Repairing
  // Abnormal status removed as per requirement
  PENDING = '待审核', // Pending Audit - Kept for legacy/fallback, but logic moves to AuditRecord
  HOTEL_COMPLAINT = '酒店客诉', // Hotel Customer Complaint
}

export type DeviceEvent = {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  operator?: string; // New operator field
  remark?: string; // Additional remark details
  images?: string[]; // Attached images
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
  subType?: string; // New Sub-type field
  
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
  currentRunDuration?: number; // hours
  
  // Timestamps
  firstStartTime: string;
  lastTestTime: string;
  lastTestResult?: 'Qualified' | 'Unqualified'; // Result of the last approved inspection
  
  // Cumulative Stats
  totalStartCount?: number;
  totalRunDuration?: number; // hours
  
  events: DeviceEvent[];
};

export enum AuditStatus {
  PENDING = '待审核',
  APPROVED = '已通过',
  REJECTED = '已拒绝',
  INVALID = '已失效'
}

export enum AuditType {
  OPS_STATUS = '运维状态变更',
  INSPECTION = '巡检报告'
}

export type AuditRecord = {
  id: string;
  deviceId: string;
  deviceName: string; // Snapshot for display
  deviceSn: string; // Snapshot for display
  storeName?: string; // Snapshot
  roomNumber?: string; // Snapshot
  
  type: AuditType; // New field to distinguish audit type

  // Fields for OPS_STATUS type
  prevOpsStatus?: OpsStatus;
  targetOpsStatus?: OpsStatus;
  
  // Fields for INSPECTION type
  testResult?: 'Qualified' | 'Unqualified';

  changeReason: string; // Shared: Reason for change OR Remark for inspection
  images?: string[]; // Evidence images for the request
  
  auditStatus: AuditStatus;
  requestTime: string;
  requestUser: string;
  
  auditTime?: string;
  auditUser?: string;
  rejectReason?: string;
};

// --- Procurement Types ---
export type ProductType = '物料' | '硬件';
export type ProductSubType = '桌显' | '地投' | '头显' | '床帏巾' | '帐篷';

export type Product = {
  id: string;
  name: string;
  type: ProductType;
  subType: ProductSubType;
  price: number;
  imageUrl?: string;
};

export type ProcurementOrderItem = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

export type ProcurementStepData = {
    images?: string[];
    logisticsLink?: string; // Legacy: Single string support
    logisticsItems?: { id: string; name: string; url: string; }[]; // New: Multiple links
    completionTime?: string; // New field for step completion timestamp
};

// Procurement Process Steps: 
// 0: Pending Receive (Not started in progress flow yet)
// 1: Confirmed (确认订单)
// 2: Stocking (备货)
// 3: Packing (出库打包)
// 4: Logistics (物流)
// 5: Signed (签收)
export type ProcurementOrder = {
  id: string;
  storeId: string;
  storeName: string;
  items: ProcurementOrderItem[];
  totalPrice: number;
  remark: string;
  expectDeliveryDate?: string; // New field
  status: 'pending_receive' | 'purchasing' | 'completed';
  currentStep: number; // 0 to 5
  createTime: string;
  stepData?: Record<number, ProcurementStepData>; // Stores images/links for each step
  auditStatus?: 'pending' | 'approved' | 'rejected'; // New: Audit after signing
  rejectReason?: string; // New: Reason for rejection
};