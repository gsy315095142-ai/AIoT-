// 标记：本次更新了客房建档详情页全屏展示及复尺评估显示，优化了客房安装进度条样式，并升级采购进度详情为全屏页且支持确认接收和环节翻页
import React from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Dashboard } from './pages/Dashboard';
import { DeviceManagement } from './pages/DeviceManagement';
import { Settings } from './pages/Settings';
import { RoomManagement } from './pages/RoomManagement';
import { ProcurementManagement } from './pages/ProcurementManagement';
import { Login } from './pages/Login';
import { LayoutDashboard, Monitor, Settings as SettingsIcon, LogOut, BedDouble, ShoppingCart } from 'lucide-react';

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
  const { headerRightAction, logout } = useApp();
  
  const getTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return '数据总览';
      case '/devices': return '设备管理';
      case '/rooms': return '客房管理';
      case '/procurement': return '采购管理';
      case '/settings': return '后台配置';
      default: return 'DeviceMaster';
    }
  };

  return (
    <div className="bg-white border-b border-slate-100 p-4 sticky top-0 z-20 flex items-center justify-center shadow-sm h-14 relative">
      {location.pathname === '/dashboard' && (
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

  return (
    <>
        <div className="mt-0">
            <MobileHeader />
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 relative pb-20">
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/devices" element={<DeviceManagement />} />
                <Route path="/rooms" element={<RoomManagement />} />
                <Route path="/procurement" element={<ProcurementManagement />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </main>

        <nav className="bg-white border-t border-slate-200 h-16 absolute bottom-0 left-0 right-0 flex justify-around items-center z-20 pb-safe md:pb-2">
            {location.pathname === '/settings' ? (
                <BottomNavLink to="/settings" icon={SettingsIcon} label="配置" />
            ) : (
                <>
                    <BottomNavLink to="/dashboard" icon={LayoutDashboard} label="总览" />
                    <BottomNavLink to="/devices" icon={Monitor} label="设备" />
                    <BottomNavLink to="/rooms" icon={BedDouble} label="客房" />
                    <BottomNavLink to="/procurement" icon={ShoppingCart} label="采购" />
                </>
            )}
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