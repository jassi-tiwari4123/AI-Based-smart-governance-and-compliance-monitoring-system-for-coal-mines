import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Defines which roles can access each route path
const ROUTE_PERMISSIONS = {
  '/dashboard':            ['CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/dashboard/inspector':  ['INSPECTOR', 'SUPER_ADMIN'],
  '/dashboard/mine':       ['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/dashboard/contractor': ['CONTRACTOR', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],

  '/mines':                ['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/mines/:id':            ['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],

  '/inspections':          ['INSPECTOR', 'MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/inspections/create':   ['INSPECTOR', 'MINE_MANAGER', 'SUPER_ADMIN'],
  '/inspections/:id':      ['INSPECTOR', 'MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],

  '/violations':           ['INSPECTOR', 'MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/violations/:id':       ['INSPECTOR', 'MINE_MANAGER', 'CORPORATE_ADMIN', 'CONTRACTOR', 'SUPER_ADMIN'],

  '/ai-insights':          ['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/ai-investigation/:id': ['INSPECTOR', 'MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],

  '/incidents':            ['INSPECTOR', 'MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/incidents/report':     ['INSPECTOR', 'SUPER_ADMIN'],
  '/incidents/mine':       ['INSPECTOR', 'SUPER_ADMIN'],
  '/incidents/:id':        ['INSPECTOR', 'MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],

  '/corrective-actions':   ['MINE_MANAGER', 'CORPORATE_ADMIN', 'CONTRACTOR', 'SUPER_ADMIN'],
  '/workflows':            ['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/contractors':          ['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/team':                 ['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/mine-management':      ['CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/manager-management':   ['CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/workers':              ['CONTRACTOR', 'SUPER_ADMIN'],
  '/attendance':           ['CONTRACTOR', 'SUPER_ADMIN'],
  '/attendance/report':    ['MINE_MANAGER', 'CORPORATE_ADMIN', 'CONTRACTOR', 'SUPER_ADMIN'],

  '/gis':                  ['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/documents':            ['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/reports':              ['CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/audit-trail':          ['CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/settings':             ['CORPORATE_ADMIN', 'SUPER_ADMIN'],
};

// Get the default home page for each role
const ROLE_HOME = {
  INSPECTOR:       '/dashboard/inspector',
  MINE_MANAGER:    '/dashboard/mine',
  CORPORATE_ADMIN: '/dashboard',
  CONTRACTOR:      '/dashboard/contractor',
  SUPER_ADMIN:     '/dashboard',
};

// Match a pathname against permission keys (handles dynamic :id segments)
const getPermissionsForPath = (pathname) => {
  if (ROUTE_PERMISSIONS[pathname]) return ROUTE_PERMISSIONS[pathname];

  for (const pattern of Object.keys(ROUTE_PERMISSIONS)) {
    if (!pattern.includes(':')) continue;
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
    if (regex.test(pathname)) return ROUTE_PERMISSIONS[pattern];
  }

  return null;
};

const ProtectedRoute = ({ children, path }) => {
  const { user } = useAuth();
  const role = user?.role;

  if (!user) return <Navigate to="/login" replace />;

  const allowedRoles = getPermissionsForPath(path);

  if (!allowedRoles) return children;

  if (!allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME[role] || '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
