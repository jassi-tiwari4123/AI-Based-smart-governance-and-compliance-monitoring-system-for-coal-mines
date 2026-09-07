import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Bell, Shield, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ROLE_HOME = {
  INSPECTOR:       '/dashboard/inspector',
  MINE_MANAGER:    '/dashboard/mine',
  CORPORATE_ADMIN: '/dashboard',
  CONTRACTOR:      '/dashboard/contractor',
  SUPER_ADMIN:     '/dashboard',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="bg-[#252525] text-white border-b border-gray-800 sticky top-0 z-40 px-4 py-2.5 flex items-center justify-between shadow-md">

      {/* Brand */}
      <Link to={ROLE_HOME[user?.role] || '/dashboard'} className="flex items-center space-x-2.5">
        <div className="bg-[#F47C20] p-1.5 rounded-sm flex items-center justify-center">
          <Shield className="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-wider text-white uppercase block leading-none">MINEGUARD</span>
          <span className="text-[10px] tracking-widest text-amber-500 font-semibold uppercase block">AI Coal Governance Platform</span>
        </div>
      </Link>

      {/* Right controls */}
      <div className="flex items-center space-x-4">

        {/* Role badge */}
        <div className="flex items-center space-x-1.5 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-gray-200">{user?.role || 'Role'}</span>
        </div>

        {/* Notifications */}
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
                <span className="text-xs font-bold uppercase tracking-wider">Notifications</span>
                <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">{notifications.length}</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">No notifications</div>
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
                        <span className="text-[10px] text-gray-400 font-normal">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User info + logout */}
        <div className="flex items-center space-x-2 pl-2 border-l border-gray-800">
          <div className="w-8 h-8 rounded bg-gray-700 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
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
