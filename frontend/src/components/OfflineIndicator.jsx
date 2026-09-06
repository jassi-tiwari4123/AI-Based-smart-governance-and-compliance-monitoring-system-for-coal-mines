import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

const OfflineIndicator = ({ isOnline = true, pendingSyncCount = 0 }) => {
  if (isOnline && pendingSyncCount === 0) {
    return (
      <div className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded text-xs font-bold shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>SYNCED</span>
      </div>
    );
  }

  if (isOnline && pendingSyncCount > 0) {
    return (
      <div className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded text-xs font-bold shadow-sm animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin" />
        <span>SYNC PENDING ({pendingSyncCount})</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-1.5 bg-red-600 text-white px-2.5 py-1 rounded text-xs font-bold shadow-sm">
      <WifiOff className="w-3.5 h-3.5" />
      <span>OFFLINE MODE</span>
    </div>
  );
};

export default OfflineIndicator;
