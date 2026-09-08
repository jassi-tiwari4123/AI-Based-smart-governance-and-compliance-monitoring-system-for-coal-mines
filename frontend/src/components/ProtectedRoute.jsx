import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route-level permission map.
 * If a path isn't listed, all authenticated roles can access it.
 */
const ROUTE_ROLES = {
  '/dashboard':             ['CORPORATE_ADMIN', 'SUPER_ADMIN', 'REGULATOR'],
  '/dashboard/inspector':   ['INSPECTOR', 'SUPER_ADMIN'],
  '/dashboard/mine':        ['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/dashboard/contractor':  ['CONTRACTOR', 'SUPER_ADMIN'],
  '/dashboard/regulator':   ['REGULATOR', 'SUPER_ADMIN'],
  '/mine-management':       ['CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/manager-management':    ['CORPORATE_ADMIN', 'SUPER_ADMIN'],
  '/team':                  ['MINE_MANAGER', 'SUPER_ADMIN'],
  '/workers':               ['CONTRACTOR', 'SUPER_ADMIN'],
  '/attendance':            ['CONTRACTOR', 'SUPER_ADMIN'],
  '/attendance/report':     ['MINE_MANAGER', 'CONTRACTOR', 'CORPORATE_ADMIN', 'SUPER_ADMIN'],
};

/**
 * Get the home path for a given role.
 */
const roleHome = (role) => {
  switch (role) {
    case 'INSPECTOR':       return '/dashboard/inspector';
    case 'MINE_MANAGER':    return '/dashboard/mine';
    case 'CONTRACTOR':      return '/dashboard/contractor';
    case 'REGULATOR':       return '/dashboard/regulator';
    case 'CORPORATE_ADMIN': return '/dashboard';
    case 'SUPER_ADMIN':     return '/dashboard';
    default:                return '/dashboard';
  }
};

const ProtectedRoute = ({ path, children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const allowedRoles = ROUTE_ROLES[path];

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own dashboard instead of showing a blank page
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
