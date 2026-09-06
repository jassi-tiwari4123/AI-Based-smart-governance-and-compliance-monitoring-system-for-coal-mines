import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Pickaxe, ClipboardCheck, AlertTriangle, Flame,
  FileCheck, GitPullRequest, MapPin, Users, FileText, BarChart3,
  History, Settings, Cpu, Smartphone, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  const navGroups = [
    {
      title: "Core Governance",
      items: [
        { label: "Corporate Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Coal Mines Index", path: "/mines", icon: Pickaxe },
        { label: "Mobile Inspection", path: "/inspections/create", icon: Smartphone, highlight: true },
        { label: "Safety Inspections", path: "/inspections", icon: ClipboardCheck },
      ]
    },
    {
      title: "Risk & AI Engine",
      items: [
        { label: "Violations Log", path: "/violations", icon: AlertTriangle },
        { label: "AI Risk & Investigation", path: "/ai-insights", icon: Cpu },
        { label: "Incidents Log", path: "/incidents", icon: Flame },
      ]
    },
    {
      title: "Workflows & Verification",
      items: [
        { label: "Corrective Actions", path: "/corrective-actions", icon: FileCheck },
        { label: "Workflows & Escalations", path: "/workflows", icon: GitPullRequest },
        { label: "Contractor Compliance", path: "/contractors", icon: Users },
      ]
    },
    {
      title: "Spatial & Analytics",
      items: [
        { label: "GIS Spatial Map", path: "/gis", icon: MapPin },
        { label: "Statutory Documents", path: "/documents", icon: FileText },
        { label: "Statutory Reports", path: "/reports", icon: BarChart3 },
        { label: "Audit Trail Log", path: "/audit-trail", icon: History },
        { label: "System Settings", path: "/settings", icon: Settings },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#252525] text-gray-300 border-r border-gray-800 flex flex-col shrink-0 h-[calc(100vh-53px)] sticky top-[53px]">
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium transition ${
                        isActive
                          ? 'bg-[#F47C20] text-slate-950 font-bold shadow-sm'
                          : item.highlight
                          ? 'bg-amber-950/40 text-amber-400 hover:bg-amber-900/50 border border-amber-600/30'
                          : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Status Footer */}
      <div className="p-3 bg-gray-900 border-t border-gray-800 text-[11px] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-gray-400 font-semibold">System RBAC Active</span>
        </div>
        <span className="bg-gray-800 text-amber-400 px-1.5 py-0.5 rounded font-mono text-[10px]">{user?.role}</span>
      </div>
    </aside>
  );
};

export default Sidebar;
