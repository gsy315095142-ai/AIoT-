

export type Region = {
  id: string;
  name: string;
};

export type UserRole = 'admin' | 'product_director' | 'hardware' | 'procurement' | 'local' | 'ops_manager' | 'business_manager' | 'artist' | 'area_manager' | 'area_assistant';

export type AssignableUser = {
  id: string;
  name: string;
  account: string;
  role: string;
};

export type RoomImageCategory = string;

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
  checklistValues?: Record<string, string | boolean>; // Key is param.id, Value is input
  status?: RoomMeasurementStatus; // Audit Status
  rejectReason?: string;
  operator?: string; // New: Operator name
  operateTime?: string; // New: Operation timestamp
};

// New Checklist Types
export type ChecklistParamType = 'text' | 'boolean';

export type ChecklistParam = {
  id: string;
  label: string;
  type: ChecklistParamType;
};

// New Type for Dynamic Room Configuration
export type RoomTypeConfig = {
  id: string;
  name: string;
  // Config fields (exampleImages, etc.) are moved to StoreModuleConfig, but kept here for fallback or data migration if needed, 
  // though primarily we will use Store level config for definitions.
  // Data fields remain:
  images?: RoomImage[]; // Actual Measurement Images for this Room Type
  measurements?: RoomMeasurement[]; // Measurement Data for this Room Type
  
  // Deprecated/Legacy fields (kept for type compatibility during migration if necessary, but UI will look at Store)
  modules?: string[]; 
  exampleImages?: Record<string, string>; 
  exampleRequirements?: Record<string, string>; 
  checklistConfigs?: Record<string, ChecklistParam[]>; 
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
  operator?: string; // New: Operator who completed the step
};

export type StoreInstallation = {
  status: InstallStatus;
  nodes: InstallNode[];
  rejectReason?: string;
  appointmentTime?: string; // Shortcut for display
};
// --------------------------

export type ModuleType = 'measurement' | 'installation';
export type InstallationParamKey = 'deviceSn' | 'powerOnBoot';

// Store-level Module Configuration (Universal for all room types in the store)
export type StoreModuleConfig = {
  activeModules: string[];
  moduleTypes: Record<string, ModuleType>; // Define the type of each module
  exampleImages: Record<string, string>;
  exampleRequirements: Record<string, string>;
  checklistConfigs: Record<string, ChecklistParam[]>;
  installationParams?: Record<string, InstallationParamKey[]>; // Key: Module Name, Value: Array of enabled keys
};

// New Measurement Task Type
export type MeasurementTask = {
  status: 'published' | 'completed';
  deadline: string;
  publishTime: string;
  assignee?: string; // New field: Assigned User
};

// New Installation Task Type
export type InstallationTask = {
  status: 'published' | 'completed';
  deadline: string;
  publishTime: string;
  assignee?: string; // New field: Assigned User
};

export type Store = {
  id: string;
  regionId: string;
  name: string;
  roomTypeConfigs: RoomTypeConfig[]; // New: Per-store room types
  rooms: Room[];
  installation?: StoreInstallation;
  moduleConfig: StoreModuleConfig; // New: Store-wide module configuration
  measurementTask?: MeasurementTask; // New: Measurement Task for the store
  installationTask?: InstallationTask; // New: Installation Task for the store
};

export type DeviceType = {
  id: string;
  name: string;
};

export type Supplier = {
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
  REPAIRING = '维修', // Changed from '维修中' to '维修'
  // Abnormal status removed as per requirement
  PENDING = '待审核', // Pending Audit - Kept for legacy/fallback, but logic moves to AuditRecord
  HOTEL_COMPLAINT = '客诉', // Changed from '酒店客诉' to '客诉'
  RETURN_FACTORY = '返厂', // New: Returned to Factory
  SCRAPPED = '报废', // New: Scrapped
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
  supplierId?: string; // New Supplier field
  orderId?: string; // New Order ID field
  
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

// --- Feedback Types ---
export type FeedbackStatus = 'pending_receive' | 'processing' | 'pending_audit' | 'resolved' | 'false_alarm';
export type FeedbackMethod = 'remote' | 'onsite' | 'self';

export type FeedbackStepMeta = {
    completed: boolean;
    completionTime: string;
    operator: string;
};

export type FeedbackDiagnosisCategory = '人为损坏' | '设备故障' | '其他情况';
export type FeedbackResolutionStatus = '已解决' | '需二次处理' | '无法解决';

export type FeedbackProcessData = {
    // Order Taking
    receiveTime?: string;
    receiver?: string;

    // Common
    result?: string;
    resultImages?: string[]; 
    resolutionStatus?: FeedbackResolutionStatus; // New: Resolution Result
    
    problemAnalysis?: string; 
    problemAnalysisImages?: string[]; 
    diagnosisCategory?: FeedbackDiagnosisCategory; // New: Diagnosis Category (For Analysis/Site Assessment)
    
    // Remote
    connectionTime?: string;
    
    // On-site
    appointmentTime?: string;
    checkInTime?: string;
    checkInLocation?: string;
    siteImages?: string[];
    
    // Step Tracking (Step ID -> Meta)
    stepsMeta?: Record<number, FeedbackStepMeta>;
};

export type DeviceFeedback = {
  id: string;
  deviceId: string;
  content: string; // The feedback issue description
  createTime: string;
  status: FeedbackStatus;
  images?: string[]; // Feedback images
  
  // Process Info
  processMethod?: FeedbackMethod;
  processData?: FeedbackProcessData;
  assignee?: string; // New: Task Assignee
  
  // Audit Info
  auditStatus?: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;

  // Resolution Info
  resolveTime?: string;
  resolver?: string;
  
  // Snapshot data for listing
  deviceSn: string;
  deviceName: string;
  storeName: string;
  roomNumber: string;
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
  monthlyRent?: number; // New field for Monthly Rent
  imageUrl?: string;
  supplierId?: string; // New field for Supplier
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
    logisticsItems?: { id: string; name: string; url: string; images?: string[] }[]; // New: Multiple links with images
    completionTime?: string; // New field for step completion timestamp
    artAuditEntered?: boolean; // Legacy field (can be kept or removed)
    artAuditCompleted?: boolean; // Legacy field (can be kept or removed)
};

// Updated Statuses for Inbound/Outbound Split
export type ProcurementOrderStatus = 
  | 'pending_receive'        // 待接收 (Step 1 Pending)
  | 'inbound_processing'     // 入库进行中 (Steps 1-3)
  | 'pending_inbound_audit'  // 入库待审核 (Wait for Inbound Audit)
  | 'outbound_processing'    // 出库进行中 (Steps 4-5)
  | 'pending_outbound_audit' // 出库待审核 (收货审核 - Wait for Receipt Audit)
  | 'completed';             // 完成 (Archived)

// Procurement Process Steps (Redefined): 
// 1: Confirm Order (确认订单)
// 2: Stocking (备货)
// 3: Outbound (出库) -> Followed by Inbound Audit
// 4: Logistics (物流)
// 5: Confirm Receipt (确认收货) -> Followed by Outbound Audit
export type ProcurementOrder = {
  id: string;
  storeId: string;
  storeName: string;
  items: ProcurementOrderItem[];
  totalPrice: number;
  orderType?: 'purchase' | 'rent'; // New field for Purchase or Rent
  rentDuration?: number; // New field for Rent Duration (Months)
  remark: string;
  expectDeliveryDate?: string; // New field
  status: ProcurementOrderStatus; // Updated Type
  currentStep: number; // 1 to 5
  createTime: string;
  stepData?: Record<number, ProcurementStepData>; // Stores images/links for each step
  auditStatus?: 'pending' | 'approved' | 'rejected'; // Tracks current pending audit result
  rejectReason?: string; // New: Reason for rejection
};