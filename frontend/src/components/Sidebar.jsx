import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Pickaxe, ClipboardCheck, AlertTriangle, Flame,
  FileCheck, GitPullRequest, MapPin, Users, FileText, BarChart3,
  History, Settings, Cpu, Smartphone, ShieldCheck, Building2, UserCheck,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Define which nav items each role can see
const NAV_CONFIG = {
  INSPECTOR: [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Inspector Dashboard', path: '/dashboard/inspector', icon: Building2 },
      ]
    },
    {
      title: 'Field Work',
      items: [
        { label: 'Mobile Inspection', path: '/inspections/create', icon: Smartphone, highlight: true },
        { label: 'My Inspections',   path: '/inspections',        icon: ClipboardCheck, end: true },
        { label: 'My Incidents',     path: '/incidents/mine',     icon: Flame, end: true },
      ]
    },
  ],

  MINE_MANAGER: [
    {
      title: 'My Dashboard',
      items: [
        { label: 'Mine Dashboard', path: '/dashboard/mine', icon: Building2 },
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Inspections',     path: '/inspections',       icon: ClipboardCheck },
        { label: 'Incidents',       path: '/incidents',         icon: Flame },
        { label: 'Team Management', path: '/team',              icon: Users },
      ]
    },
    {
      title: 'Compliance',
      items: [
        { label: 'Violations Log',          path: '/violations',         icon: AlertTriangle },
        { label: 'AI Investigations',        path: '/ai-insights',        icon: Cpu },
        { label: 'Corrective Actions',       path: '/corrective-actions', icon: FileCheck },
        { label: 'Workflows & Escalations',  path: '/workflows',          icon: GitPullRequest },
        { label: 'Contractor Compliance',    path: '/contractors',        icon: Users },
        { label: 'Statutory Documents',      path: '/documents',          icon: FileText },
        { label: 'Attendance Report',        path: '/attendance/report',  icon: ClipboardCheck },
      ]
    },
  ],

  CORPORATE_ADMIN: [
    {
      title: 'Dashboards',
      items: [
        { label: 'Corporate Dashboard', path: '/dashboard',            icon: LayoutDashboard, end: true },
        { label: 'Mine Dashboard',      path: '/dashboard/mine',       icon: Building2 },
        { label: 'Contractor Portal',   path: '/dashboard/contractor', icon: UserCheck },
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Mine Management',    path: '/mine-management',    icon: Pickaxe },
        { label: 'Manager Management', path: '/manager-management', icon: Users },
        { label: 'Inspections',        path: '/inspections',        icon: ClipboardCheck },
        { label: 'Incidents',          path: '/incidents',          icon: Flame },
      ]
    },
    {
      title: 'Risk & AI',
      items: [
        { label: 'Violations Log', path: '/violations', icon: AlertTriangle },
        { label: 'AI Risk & Insights', path: '/ai-insights', icon: Cpu },
      ]
    },
    {
      title: 'Compliance & Analytics',
      items: [
        { label: 'Corrective Actions', path: '/corrective-actions', icon: FileCheck },
        { label: 'Workflows & Escalations', path: '/workflows', icon: GitPullRequest },
        { label: 'Contractor Compliance', path: '/contractors', icon: Users },
        { label: 'GIS Spatial Map', path: '/gis', icon: MapPin },
        { label: 'Statutory Documents', path: '/documents', icon: FileText },
        { label: 'Statutory Reports', path: '/reports', icon: BarChart3 },
        { label: 'Audit Trail Log', path: '/audit-trail', icon: History },
        { label: 'System Settings', path: '/settings', icon: Settings },
      ]
    },
  ],

  CONTRACTOR: [
    {
      title: 'My Portal',
      items: [
        { label: 'My Tasks', path: '/dashboard/contractor', icon: UserCheck },
      ]
    },
    {
      title: 'Attendance',
      items: [
        { label: 'Mark Attendance', path: '/attendance',        icon: ClipboardCheck, highlight: true, end: true },
        { label: 'View Attendance', path: '/attendance/report', icon: CalendarDays },
        { label: 'My Workers',      path: '/workers',           icon: Users },
      ]
    },
  ],

  SUPER_ADMIN: [
    {
      title: 'Dashboards',
      items: [
        { label: 'Corporate Dashboard', path: '/dashboard',            icon: LayoutDashboard, end: true },
        { label: 'Mine Dashboard',      path: '/dashboard/mine',       icon: Building2 },
        { label: 'Contractor Portal',   path: '/dashboard/contractor', icon: UserCheck },
      ]
    },
    {
      title: 'All Features',
      items: [
        { label: 'Coal Mines Index', path: '/mines', icon: Pickaxe },
        { label: 'Mobile Inspection', path: '/inspections/create', icon: Smartphone, highlight: true },
        { label: 'Inspections', path: '/inspections', icon: ClipboardCheck },
        { label: 'Violations Log', path: '/violations', icon: AlertTriangle },
        { label: 'AI Risk & Insights', path: '/ai-insights', icon: Cpu },
        { label: 'Incidents', path: '/incidents', icon: Flame },
        { label: 'Corrective Actions', path: '/corrective-actions', icon: FileCheck },
        { label: 'Workflows & Escalations', path: '/workflows', icon: GitPullRequest },
        { label: 'Contractor Compliance', path: '/contractors', icon: Users },
        { label: 'GIS Spatial Map', path: '/gis', icon: MapPin },
        { label: 'Statutory Documents', path: '/documents', icon: FileText },
        { label: 'Statutory Reports', path: '/reports', icon: BarChart3 },
        { label: 'Audit Trail Log', path: '/audit-trail', icon: History },
        { label: 'System Settings', path: '/settings', icon: Settings },
      ]
    },
  ],
};

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'INSPECTOR';
  const navGroups = NAV_CONFIG[role] || NAV_CONFIG['INSPECTOR'];

  return (
    <aside className="w-64 bg-[#252525] text-gray-300 border-r border-gray-800 flex flex-col shrink-0 min-h-[calc(100vh-53px)] sticky top-[53px] self-stretch">
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
                    end={!!item.end}
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
      <div className="p-3 bg-gray-900 border-t border-gray-800 text-[11px]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-400 font-semibold">RBAC Active</span>
          </div>
          <span className="bg-gray-800 text-amber-400 px-1.5 py-0.5 rounded font-mono text-[10px]">{role}</span>
        </div>
        <p className="text-gray-500 text-[10px] truncate">{user?.email}</p>
      </div>
    </aside>
  );
};

export default Sidebar;
