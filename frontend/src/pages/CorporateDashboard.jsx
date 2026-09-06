import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import {
  Pickaxe, AlertTriangle, ShieldAlert, CheckCircle2, Clock, Flame,
  Cpu, ArrowUpRight, BarChart2, PieChart, TrendingUp, ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RePieChart, Pie, Cell } from 'recharts';

const CorporateDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await API.get('/dashboard/corporate');
      setData(res.data);
    } catch (e) {
      console.error("Dashboard error", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Corporate Compliance Dashboard...</div>;
  }

  const categoryChartData = data?.categoryPerformance ? [
    { name: 'Safety', count: data.categoryPerformance.SAFETY },
    { name: 'Environment', count: data.categoryPerformance.ENVIRONMENT },
    { name: 'Production', count: data.categoryPerformance.PRODUCTION },
    { name: 'Labour', count: data.categoryPerformance.LABOUR },
  ] : [];

  const riskPieData = data?.riskDistribution ? [
    { name: 'Low', value: data.riskDistribution.LOW, color: '#16A34A' },
    { name: 'Medium', value: data.riskDistribution.MEDIUM, color: '#D97706' },
    { name: 'High', value: data.riskDistribution.HIGH, color: '#EA580C' },
    { name: 'Critical', value: data.riskDistribution.CRITICAL, color: '#DC2626' },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">Enterprise Coal Governance Dashboard</h1>
          <p className="text-xs text-gray-600">Centralized Statutory Monitoring Across All Operational Pit Locations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/inspections/create"
            className="bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded shadow transition flex items-center space-x-1.5"
          >
            <span>+ Mobile Field Inspection</span>
          </Link>
          <button
            onClick={fetchDashboard}
            className="bg-gray-800 text-white font-bold text-xs px-3 py-2 rounded hover:bg-gray-700 transition"
          >
            Refresh Analytics
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overall Compliance</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-gray-900">{data?.overallCompliance}%</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">✓ DGMS Statutory Baseline</span>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Monitored Mines</span>
            <Pickaxe className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-gray-900">{data?.totalMines}</span>
            <span className="text-[10px] text-gray-500 font-medium block mt-1">Odisha, JH, CG, WB</span>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Open Violations</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-amber-600">{data?.openViolationsCount}</span>
            <span className="text-[10px] text-amber-700 font-bold block mt-1">Pending Corrective Action</span>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overdue Actions</span>
            <Clock className="w-5 h-5 text-red-600" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-red-600">{data?.overdueActionsCount}</span>
            <span className="text-[10px] text-red-600 font-bold block mt-1">Escalated to Management</span>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Incidents</span>
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-gray-900">{data?.activeIncidentsCount}</span>
            <span className="text-[10px] text-orange-600 font-bold block mt-1">Under AI Investigation</span>
          </div>
        </div>
      </div>

      {/* AI Critical Risk Alert Banner */}
      {data?.aiAlerts && data.aiAlerts.length > 0 && (
        <div className="bg-[#252525] text-white border-l-4 border-[#F47C20] rounded-md p-4 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="bg-red-600 text-white p-2 rounded shrink-0 font-bold text-xs flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">AI CRITICAL ALERT</span>
                  <span className="font-extrabold text-sm text-white">{data.aiAlerts[0].mineName}</span>
                </div>
                <p className="text-xs text-gray-300 font-semibold mt-1">{data.aiAlerts[0].title}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[11px] text-amber-400 font-extrabold">Risk Score: {data.aiAlerts[0].riskScore} / 100</span>
                  <span className="text-[11px] text-gray-400">| Factors: {data.aiAlerts[0].factors.join(', ')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <Link
                to="/violations/VIO-2026-0001"
                className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded transition"
              >
                View Evidence
              </Link>
              <Link
                to="/ai-investigation/VIO-2026-0001"
                className="bg-[#F47C20] hover:bg-orange-600 text-slate-950 text-xs font-extrabold px-3.5 py-1.5 rounded transition flex items-center space-x-1"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Investigate AI</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance Bar Chart */}
        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-amber-600" />
              <span>Violations by Category</span>
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#252525" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Level Distribution Pie */}
        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-amber-600" />
              <span>Enterprise Risk Level Breakdown</span>
            </h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={riskPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mine Risk Ranking Table */}
      <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-300 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
            Mine Governance Ranking & Compliance Performance
          </h3>
          <Link to="/mines" className="text-xs text-amber-600 font-bold hover:underline flex items-center space-x-1">
            <span>View All Mines ({data?.mineRanking?.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#252525] text-white uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Mine Name</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Compliance</th>
                <th className="py-2.5 px-4">Risk Level</th>
                <th className="py-2.5 px-4 text-center">Open Violations</th>
                <th className="py-2.5 px-4 text-center">Overdue Actions</th>
                <th className="py-2.5 px-4">Trend</th>
                <th className="py-2.5 px-4">Last Inspection</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium">
              {data?.mineRanking?.map((m) => (
                <tr key={m.mineId} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 font-bold text-gray-900">{m.name}</td>
                  <td className="py-3 px-4 text-gray-600">{m.location}</td>
                  <td className="py-3 px-4">
                    <span className="font-extrabold text-gray-900">{m.compliance}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                      m.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                      m.riskLevel === 'HIGH' ? 'bg-orange-600' :
                      m.riskLevel === 'MEDIUM' ? 'bg-amber-600' : 'bg-emerald-600'
                    }`}>
                      {m.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-700">{m.openViolations}</td>
                  <td className="py-3 px-4 text-center font-bold text-red-600">{m.overdueActions}</td>
                  <td className="py-3 px-4 text-emerald-700 font-semibold">{m.trend}</td>
                  <td className="py-3 px-4 text-gray-500">{m.lastInspection?.split('T')[0]}</td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/mines/${m.mineId}`}
                      className="text-amber-600 hover:text-orange-700 font-bold hover:underline text-[11px]"
                    >
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CorporateDashboard;
