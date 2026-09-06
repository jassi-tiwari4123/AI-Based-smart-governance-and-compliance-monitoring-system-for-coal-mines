import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Shield, User, ChevronDown, LogOut, Activity, Smartphone, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout, switchRoleDemo } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const navigate = useNavigate();

  const demoAccounts = [
    { role: 'INSPECTOR', label: 'Inspector (Ananya Sharma)', email: 'inspector@mineguard.gov.in', color: 'bg-blue-600' },
    { role: 'MINE_MANAGER', label: 'Mine Manager (Subhashish Panda)', email: 'manager@mineguard.gov.in', color: 'bg-amber-600' },
    { role: 'CORPORATE_ADMIN', label: 'Corporate Admin (Rajesh Kumar)', email: 'admin@mineguard.gov.in', color: 'bg-slate-800' },
    { role: 'REGULATOR', label: 'Coal Regulator (Dr. V. K. Singh)', email: 'regulator@mineguard.gov.in', color: 'bg-purple-700' },
    { role: 'CONTRACTOR', label: 'Contractor (Vikram Heavy Infra)', email: 'contractor@mineguard.gov.in', color: 'bg-emerald-600' },
    { role: 'SUPER_ADMIN', label: 'Super Admin', email: 'superadmin@mineguard.gov.in', color: 'bg-red-700' }
  ];

  const handleRoleSwitch = async (email) => {
    await switchRoleDemo(email);
    setShowRoleMenu(false);
    navigate('/dashboard');
  };

  return (
    <header className="bg-[#252525] text-white border-b border-gray-800 sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between shadow-md">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <Link to="/dashboard" className="flex items-center space-x-2.5 group">
          <div className="bg-[#F47C20] p-1.5 rounded-sm text-black font-extrabold text-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-wider text-white uppercase block leading-none">MINEGUARD</span>
            <span className="text-[10px] tracking-widest text-amber-500 font-semibold uppercase block">AI Coal Governance Platform</span>
          </div>
        </Link>

        {/* Demo Scenario Shortcut */}
        <Link
          to="/inspections/create"
          className="hidden md:flex items-center space-x-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 px-3 py-1.5 rounded text-xs font-bold transition shadow-sm"
        >
          <Smartphone className="w-4 h-4" />
          <span>Mobile Inspection Flow</span>
        </Link>
      </div>

      {/* Right Navbar Controls */}
      <div className="flex items-center space-x-4">
        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded text-xs transition"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-gray-200">{user?.role || 'Role'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-[#252525] border border-gray-700 rounded-md shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-gray-700 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Switch Demo User Role
              </div>
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => handleRoleSwitch(acc.email)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-800 flex items-center justify-between transition ${
                    user?.role === acc.role ? 'bg-gray-800 text-amber-400 font-bold' : 'text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${acc.color}`}></span>
                    <span>{acc.label}</span>
                  </div>
                  {user?.role === acc.role && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full relative transition"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white text-slate-900 border border-gray-300 rounded-md shadow-2xl z-50 overflow-hidden">
              <div className="bg-[#252525] text-white px-4 py-2.5 flex items-center justify-between border-b border-gray-800">
                <span className="text-xs font-bold uppercase tracking-wider">System Notifications</span>
                <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">{notifications.length} alerts</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">No active alerts</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.notificationId || n._id}
                      onClick={() => {
                        markAsRead(n.notificationId || n._id);
                        if (n.link) navigate(n.link);
                        setShowNotifs(false);
                      }}
                      className={`p-3 text-xs cursor-pointer hover:bg-gray-50 transition ${!n.isRead ? 'bg-amber-50/70 border-l-4 border-amber-500' : ''}`}
                    >
                      <div className="font-bold text-gray-900 flex items-center justify-between">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-gray-400 font-normal">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-2 pl-2 border-l border-gray-800">
          <div className="w-8 h-8 rounded bg-gray-700 text-amber-400 font-bold flex items-center justify-center text-xs">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-gray-200">{user?.name}</div>
            <div className="text-[10px] text-gray-400">{user?.department || user?.role}</div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
