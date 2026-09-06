import React from 'react';
import { AlertOctagon, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';

const RiskMeter = ({ score = 0, level = "LOW", factors = [] }) => {
  const getBadgeStyle = (l) => {
    switch (l) {
      case 'CRITICAL':
        return { bg: 'bg-red-600', text: 'text-white', border: 'border-red-700', icon: AlertOctagon };
      case 'HIGH':
        return { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-700', icon: ShieldAlert };
      case 'MEDIUM':
        return { bg: 'bg-amber-500', text: 'text-black', border: 'border-amber-600', icon: AlertTriangle };
      default:
        return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700', icon: CheckCircle };
    }
  };

  const style = getBadgeStyle(level);
  const Icon = style.icon;

  return (
    <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">AI Risk Index Calculation</span>
          <span className="text-2xl font-extrabold text-gray-900">{score} <span className="text-sm font-semibold text-gray-500">/ 100</span></span>
        </div>
        <div className={`px-3 py-1.5 rounded flex items-center space-x-1.5 font-bold text-xs ${style.bg} ${style.text}`}>
          <Icon className="w-4 h-4" />
          <span>{level} RISK</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-3 flex">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(score, 30)}%` }}></div>
        <div className="h-full bg-amber-500 transition-all" style={{ width: `${Math.max(0, Math.min(score - 30, 30))}%` }}></div>
        <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.max(0, Math.min(score - 60, 20))}%` }}></div>
        <div className="h-full bg-red-600 transition-all" style={{ width: `${Math.max(0, Math.min(score - 80, 20))}%` }}></div>
      </div>

      {/* Factors List */}
      {factors.length > 0 && (
        <div className="mt-3 bg-gray-50 p-2.5 rounded border border-gray-200 text-xs">
          <span className="font-bold text-gray-700 block mb-1">Risk Factors Contributed:</span>
          <ul className="space-y-1">
            {factors.map((f, idx) => (
              <li key={idx} className="flex items-start space-x-1.5 text-gray-600">
                <span className="text-amber-600 font-bold">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RiskMeter;
