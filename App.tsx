// 标记：本次更新货物建档功能，新增供应商字段录入与编辑，优化删除确认提示。
import React from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Dashboard } from './pages/Dashboard';
import { DeviceManagement } from './pages/DeviceManagement';
import { DeviceAudit } from './pages/DeviceAudit';
import { DeviceFeedback } from './pages/DeviceFeedback';
import { Settings } from './pages/Settings';
import { RoomManagement } from './pages/RoomManagement';
import { ProcurementManagement } from './pages/ProcurementManagement';
import { Login } from './pages/Login';
import { AddDevice } from './pages/AddDevice';
import { AddStore } from './pages/AddStore';
import { EditStore } from './pages/EditStore';
import { DeviceProcessFlow } from './pages/DeviceProcessFlow';
import { OrderProcessGuidePage } from './pages/OrderProcessGuidePage';
import { LayoutDashboard, Monitor, Settings as SettingsIcon, LogOut, BedDouble, ShoppingCart } from 'lucide-react';
import { UserRole } from './types';

// Define accessible routes per role for main navigation
const getAccessibleRoutes = (role: UserRole | null): string[] => {
    switch (role) {
        case 'admin':
        case 'product_director':
            // Removed /dashboard, merged into /devices
            return ['/devices', '/audit', '/device-feedback', '/rooms', '/procurement', '/order-guide', '/settings'];
        case 'hardware': // Project Manager
            return ['/devices', '/rooms', '/procurement', '/order-guide'];
        case 'procurement':
            return ['/procurement', '/order-guide'];
        case 'local': // Install Engineer
            return ['/rooms', '/procurement', '/order-guide'];
        case 'ops_manager':
            // Ops Manager needs access to audit and feedback
            return ['/devices', '/audit', '/device-feedback', '/rooms', '/procurement', '/order-guide'];
        case 'business_manager':
            return ['/devices', '/device-feedback', '/rooms', '/procurement', '/order-guide'];
        case 'artist':
            return ['/rooms', '/procurement', '/order-guide'];
        case 'area_manager':
        case 'area_assistant':
            // Was ['/dashboard', '/rooms', '/procurement'], now giving access to /devices container
            return ['/devices', '/device-feedback', '/rooms', '/procurement', '/order-guide'];
        default:
            return [];
    }
};

const BottomNavLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
        isActive
          ? 'text-primary'
          : 'text-slate-400 hover:text-slate-600'
      }`
    }
  >
    <Icon size={24} />
    <span className="text-[10px] font-medium">{label}</span>
  </NavLink>
);

const MobileHeader = () => {
  const location = useLocation();
  const { headerRightAction, logout, userRole } = useApp();
  
  const getTitle = () => {
    if (location.pathname.startsWith('/devices/add')) return '添加设备';
    if (location.pathname.startsWith('/rooms/add')) return '新增门店';
    if (location.pathname.startsWith('/rooms/edit')) return '编辑门店';
    if (location.pathname.startsWith('/device-process')) return '处理流程';
    if (location.pathname === '/order-guide') return '流程说明';
    
    switch (location.pathname) {
      case '/dashboard': return '数据总览'; // Fallback if reached via url
      case '/devices': return '设备管理';
      case '/audit': return '设备审核';
      case '/device-feedback': return '设备反馈';
      case '/rooms': return '客房管理';
      case '/procurement': return '订单管理';
      case '/settings': return '后台配置';
      default: return 'DeviceMaster';
    }
  };

  const accessibleRoutes = getAccessibleRoutes(userRole);
  const isHomePage = location.pathname === accessibleRoutes[0];

  return (
    <div className="bg-white border-b border-slate-100 p-4 sticky top-0 z-20 flex items-center justify-center shadow-sm h-14 relative">
      {isHomePage && (
          <button 
            onClick={logout}
            className="absolute left-4 top-0 bottom-0 flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors"
          >
              <LogOut size={16} />
              <span className="text-xs font-bold">退出</span>
          </button>
      )}

      <h1 className="text-lg font-bold text-slate-800">{getTitle()}</h1>
      <div className="absolute right-4 top-0 bottom-0 flex items-center">
          {headerRightAction}
      </div>
    </div>
  );
};

const AuthenticatedApp: React.FC = () => {
  const location = useLocation();
  const { userRole } = useApp();
  const accessibleRoutes = getAccessibleRoutes(userRole);

  // Check permission allowing sub-paths (e.g., /devices/add is allowed if /devices is allowed)
  const isRouteAllowed = (path: string) => {
      // Special case: /device-process relies on /device-feedback permission
      if (path.startsWith('/device-process')) {
          return accessibleRoutes.includes('/device-feedback');
      }
      return accessibleRoutes.some(route => path === route || path.startsWith(route + '/'));
  };

  // Redirect to first accessible route if current path is root or unauthorized
  if (location.pathname === '/' || !isRouteAllowed(location.pathname)) {
      // Special handling: if trying to access old /dashboard, redirect to /devices if allowed
      if (location.pathname === '/dashboard' && accessibleRoutes.includes('/devices')) {
          return <Navigate to="/devices" replace />;
      }

      if (accessibleRoutes.length > 0) {
          // Explicitly prefer /devices if available to avoid feedback page default issue
          if (accessibleRoutes.includes('/devices')) {
              return <Navigate to="/devices" replace />;
          }
          return <Navigate to={accessibleRoutes[0]} replace />;
      }
  }

  return (
    <>
        <div className="mt-0">
            <MobileHeader />
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 relative pb-20">
            <Routes>
                {/* Dashboard route removed, now part of Devices */}
                {accessibleRoutes.includes('/devices') && <Route path="/devices" element={<DeviceManagement />} />}
                {accessibleRoutes.includes('/devices') && <Route path="/devices/add" element={<AddDevice />} />}
                
                {accessibleRoutes.includes('/audit') && <Route path="/audit" element={<DeviceAudit />} />}
                
                {accessibleRoutes.includes('/device-feedback') && <Route path="/device-feedback" element={<DeviceFeedback />} />}
                {accessibleRoutes.includes('/device-feedback') && <Route path="/device-process/:id" element={<DeviceProcessFlow />} />}
                
                {accessibleRoutes.includes('/rooms') && <Route path="/rooms" element={<RoomManagement />} />}
                {accessibleRoutes.includes('/rooms') && <Route path="/rooms/add" element={<AddStore />} />}
                {accessibleRoutes.includes('/rooms') && <Route path="/rooms/edit/:storeId" element={<EditStore />} />}
                
                {accessibleRoutes.includes('/procurement') && <Route path="/procurement" element={<ProcurementManagement />} />}
                {accessibleRoutes.includes('/order-guide') && <Route path="/order-guide" element={<OrderProcessGuidePage />} />}
                
                {accessibleRoutes.includes('/settings') && <Route path="/settings" element={<Settings />} />}
                
                <Route path="*" element={<Navigate to={accessibleRoutes[0] || '/'} replace />} />
            </Routes>
        </main>

        <nav className="bg-white border-t border-slate-200 h-16 absolute bottom-0 left-0 right-0 flex justify-around items-center z-20 pb-safe md:pb-2">
            {/* New Order: Order -> Rooms -> Devices -> Settings */}
            {accessibleRoutes.includes('/procurement') && <BottomNavLink to="/procurement" icon={ShoppingCart} label="订单" />}
            {accessibleRoutes.includes('/rooms') && <BottomNavLink to="/rooms" icon={BedDouble} label="客房" />}
            {accessibleRoutes.includes('/devices') && <BottomNavLink to="/devices" icon={Monitor} label="设备" />}
            {accessibleRoutes.includes('/settings') && <BottomNavLink to="/settings" icon={SettingsIcon} label="配置" />}
        </nav>
        
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full md:hidden"></div>
    </>
  );
};

const AppContent: React.FC = () => {
    const { currentUser } = useApp();

    return (
        <div className="min-h-screen bg-slate-900 flex justify-center items-center md:py-8 font-sans">
            {/* Phone Frame - Added transform scale-100 to create a new stacking context for fixed children */}
            <div className="bg-slate-50 w-full h-[100vh] md:h-[700px] md:max-w-[400px] md:rounded-[40px] md:border-[10px] md:border-slate-800 shadow-2xl overflow-hidden flex flex-col relative transition-all duration-500 transform scale-100">
                {currentUser ? <AuthenticatedApp /> : <Login />}
            </div>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
};

export default App;