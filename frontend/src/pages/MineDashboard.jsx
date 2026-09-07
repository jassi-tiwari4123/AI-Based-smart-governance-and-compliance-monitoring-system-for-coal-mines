import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Pickaxe, AlertTriangle, CheckCircle2, Clock, ClipboardCheck,
  ChevronRight, ChevronLeft, Cpu, BarChart2, MapPin, Users
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const RISK_BG = {
  CRITICAL: 'bg-red-600', HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500', LOW: 'bg-emerald-600',
};

const StatusBadge = ({ status }) => {
  const map = {
    OPEN: 'bg-red-100 text-red-800', ASSIGNED: 'bg-blue-100 text-blue-800',
    CLOSED: 'bg-emerald-100 text-emerald-800', ESCALATED: 'bg-orange-100 text-orange-800',
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

// ── Mine cards grid (Corporate Admin only) ───────────────────────────────────
const MineCards = ({ mines, onSelect }) => (
  <div className="p-6 space-y-5">
    <div className="border-b border-gray-300 pb-4">
      <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
        <Pickaxe className="w-5 h-5 text-[#F47C20]" />Mine Dashboard
      </h1>
      <p className="text-xs text-gray-500 mt-0.5">Select a mine to view its operational insights</p>
    </div>

    {/* Summary strip */}
    <div className="grid grid-cols-4 gap-4">
      {[
        { label: 'Total Mines',  value: mines.length },
        { label: 'Operational',  value: mines.filter(m => m.operationalStatus === 'Operational').length },
        { label: 'High / Critical Risk', value: mines.filter(m => ['HIGH','CRITICAL'].includes(m.riskLevel)).length },
        { label: 'Avg Compliance', value: mines.length ? Math.round(mines.reduce((s, m) => s + (m.complianceScore || 0), 0) / mines.length) + '%' : '—' },
      ].map((s, i) => (
        <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{s.label}</p>
          <p className="text-3xl font-black text-gray-800 mt-0.5">{s.value}</p>
        </div>
      ))}
    </div>

    {/* Mine cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {mines.map(mine => (
        <button
          key={mine.mineId}
          onClick={() => onSelect(mine.mineId)}
          className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-amber-400 transition overflow-hidden text-left w-full"
        >
          {/* Risk colour bar */}
          <div className={`${RISK_BG[mine.riskLevel] || 'bg-gray-500'} px-4 py-2.5 flex items-center justify-between`}>
            <span className="text-white font-mono text-[11px] font-bold">{mine.mineId}</span>
            <span className="text-white text-[11px] font-extrabold">{mine.riskLevel} RISK</span>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <p className="font-extrabold text-gray-900 text-sm leading-tight">{mine.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />{mine.location}, {mine.state}
              </p>
            </div>

            {/* Compliance bar */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-gray-500 font-semibold">Compliance</span>
                <span className="font-extrabold text-gray-800">{mine.complianceScore}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${mine.complianceScore >= 85 ? 'bg-emerald-500' : mine.complianceScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${mine.complianceScore}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-xs pt-1">
              <span className="text-gray-500 flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span className="font-semibold text-gray-700">{mine.manager || 'No Manager'}</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mine.operationalStatus === 'Operational' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {mine.operationalStatus}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between bg-gray-50">
            <span className="text-[11px] text-gray-400">{mine.district}, {mine.state}</span>
            <span className="text-[11px] text-amber-600 font-bold flex items-center gap-0.5">
              View Insights <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </button>
      ))}
    </div>
  </div>
);

// ── Single mine detail dashboard ─────────────────────────────────────────────
const MineDetail = ({ mineId, onBack, isManager }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/dashboard/mine/${mineId}`);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [mineId]);

  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [mineId]);

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading Mine Dashboard...</div>;

  const mine = data?.mine || {};
  const riskBg = RISK_BG[mine.riskLevel] || 'bg-gray-500';

  const compliancePie = [
    { name: 'Compliant',     value: mine.complianceScore || 70, color: '#16A34A' },
    { name: 'Non-Compliant', value: 100 - (mine.complianceScore || 70), color: '#DC2626' },
  ];
  const categoryData = [
    { name: 'Safety',  val: (data?.recentViolations || []).filter(v => v.category === 'SAFETY').length },
    { name: 'Env',     val: (data?.recentViolations || []).filter(v => v.category === 'ENVIRONMENT').length },
    { name: 'Prod',    val: (data?.recentViolations || []).filter(v => v.category === 'PRODUCTION').length },
    { name: 'Labour',  val: (data?.recentViolations || []).filter(v => v.category === 'LABOUR').length },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div className="flex items-center gap-3">
          {!isManager && (
            <button onClick={onBack}
              className="p-1.5 rounded hover:bg-gray-200 transition">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <Pickaxe className="w-5 h-5 text-[#F47C20]" />Mine Operations Dashboard
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{mine.name} — {mine.location}, {mine.state}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs px-3 py-2 rounded transition">
            ↻ Refresh
          </button>
          <span className={`${riskBg} text-white text-xs font-extrabold px-3 py-2 rounded`}>
            Risk: {mine.riskLevel || 'N/A'}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Compliance Score', value: `${mine.complianceScore || '—'}%`, icon: CheckCircle2, color: 'text-emerald-600', sub: 'DGMS Baseline' },
          { label: 'Total Inspections', value: data?.inspectionsCount || 0, icon: ClipboardCheck, color: 'text-blue-600', sub: 'All time' },
          { label: 'Open Violations',  value: data?.openViolationsCount || 0, icon: AlertTriangle, color: 'text-amber-600', sub: 'Pending action' },
          { label: 'Corrective Actions', value: data?.correctiveActionsCount || 0, icon: Clock, color: 'text-red-600', sub: 'Total assigned' },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wide">{k.label}</span>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <span className={`text-3xl font-black ${k.color}`}>{k.value}</span>
            <span className="text-[10px] text-gray-400 font-medium mt-0.5">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1">
            <BarChart2 className="w-4 h-4 text-amber-600" />Compliance Score
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={compliancePie} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {compliancePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 text-xs mt-2">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />Compliant {mine.complianceScore}%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" />Non-Compliant {(100 - (mine.complianceScore || 70)).toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Violations by Category</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="val" fill="#F47C20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Violations */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Active Violations</h3>
          <Link to="/violations" className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Violation ID</th>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Risk Score</th>
                <th className="px-4 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.recentViolations || []).map(v => (
                <tr key={v.violationId} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5 font-mono font-bold text-gray-700">{v.violationId}</td>
                  <td className="px-4 py-2.5 text-gray-800 font-medium max-w-xs truncate">{v.title}</td>
                  <td className="px-4 py-2.5 text-gray-600">{v.category}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${v.severity === 'CRITICAL' ? 'bg-red-600' : v.severity === 'MAJOR' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                      {v.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-2.5 font-extrabold text-gray-800">{v.riskScore}/100</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/ai-investigation/${v.violationId}`} className="text-[#F47C20] font-bold hover:underline flex items-center gap-0.5">
                      <Cpu className="w-3 h-3" />AI
                    </Link>
                  </td>
                </tr>
              ))}
              {(!data?.recentViolations || data.recentViolations.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No violations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Recent Inspections</h3>
          <Link to="/inspections" className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {(data?.recentInspections || []).map(ins => (
            <Link key={ins.inspectionId} to={`/inspections/${ins.inspectionId}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
              <div>
                <p className="text-xs font-bold text-gray-800">{ins.inspectionId}</p>
                <p className="text-[11px] text-gray-500">{ins.zone} — {ins.category} — {ins.inspectionDate?.split('T')[0]}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${ins.severity === 'CRITICAL' ? 'bg-red-600' : ins.severity === 'MAJOR' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                {ins.severity}
              </span>
            </Link>
          ))}
          {(!data?.recentInspections || data.recentInspections.length === 0) && (
            <p className="px-4 py-6 text-center text-xs text-gray-400">No recent inspections</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Root component ────────────────────────────────────────────────────────────
const MineDashboard = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'MINE_MANAGER';

  const [mines, setMines] = useState([]);
  const [selectedMineId, setSelectedMineId] = useState(isManager ? user?.mineId : null);
  const [loadingMines, setLoadingMines] = useState(!isManager);

  useEffect(() => {
    if (!isManager) {
      API.get('/mines')
        .then(r => setMines(r.data || []))
        .catch(console.error)
        .finally(() => setLoadingMines(false));
    }
  }, []);

  if (!isManager && loadingMines) {
    return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading mines...</div>;
  }

  // Mine Manager — go straight to their mine detail
  if (isManager) {
    return <MineDetail mineId={user?.mineId} onBack={null} isManager={true} />;
  }

  // Corporate Admin — show cards first, then detail on selection
  if (!selectedMineId) {
    return <MineCards mines={mines} onSelect={setSelectedMineId} />;
  }

  return <MineDetail mineId={selectedMineId} onBack={() => setSelectedMineId(null)} isManager={false} />;
};

export default MineDashboard;
