import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import {
  ShieldCheck, AlertTriangle, History, BarChart2, Download,
  CheckCircle2, XCircle, ChevronRight, Filter
} from 'lucide-react';

const RegulatorDashboard = () => {
  const [data, setData] = useState(null);
  const [violations, setViolations] = useState([]);
  const [audit, setAudit] = useState([]);
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ severity: '', category: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [regRes, vioRes, auditRes, minesRes] = await Promise.all([
        API.get('/dashboard/regulator'),
        API.get('/violations'),
        API.get('/audit'),
        API.get('/mines'),
      ]);
      setData(regRes.data);
      setViolations(vioRes.data);
      setAudit(auditRes.data?.slice(0, 20) || []);
      setMines(minesRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filteredViolations = violations.filter(v => {
    if (filter.severity && v.severity !== filter.severity) return false;
    if (filter.category && v.category !== filter.category) return false;
    return true;
  });

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading Regulatory Dashboard...</div>;

  const totalMines = mines.length;
  const compliantMines = mines.filter(m => m.riskLevel === 'LOW').length;
  const criticalMines = mines.filter(m => m.riskLevel === 'CRITICAL').length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#F47C20]" />
            Regulatory Oversight Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Ministry of Coal — Statutory Compliance Monitoring Authority</p>
        </div>
        <div className="flex items-center space-x-2">
          <a href="/api/reports/export/violations" target="_blank"
            className="flex items-center gap-1.5 bg-[#252525] text-white font-bold text-xs px-3 py-2 rounded shadow hover:bg-gray-700 transition">
            <Download className="w-3.5 h-3.5" /><span>Export CSV</span>
          </a>
          <a href="/api/reports/compliance" target="_blank"
            className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-3 py-2 rounded shadow transition">
            <BarChart2 className="w-3.5 h-3.5" /><span>Compliance Report</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Monitored Mines', value: totalMines, icon: ShieldCheck, color: 'text-blue-600', sub: 'Pan India Coverage' },
          { label: 'Compliant (Low Risk)', value: compliantMines, icon: CheckCircle2, color: 'text-emerald-600', sub: 'Statutory baseline met' },
          { label: 'Critical Violations', value: data?.criticalViolations?.length || 0, icon: AlertTriangle, color: 'text-red-600', sub: 'Require immediate action' },
          { label: 'Audit Log Entries', value: data?.auditLogsTotal || 0, icon: History, color: 'text-purple-600', sub: 'Tamper-proof trail' },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{k.label}</span>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <span className={`text-3xl font-black ${k.color}`}>{k.value}</span>
            <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* All Mines Compliance Table */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Mine-wise Statutory Compliance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Mine ID</th>
                <th className="px-4 py-2.5">Mine Name</th>
                <th className="px-4 py-2.5">State</th>
                <th className="px-4 py-2.5">Manager</th>
                <th className="px-4 py-2.5">Compliance %</th>
                <th className="px-4 py-2.5">Risk Level</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mines.map(m => (
                <tr key={m.mineId} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5 font-mono font-bold text-gray-600">{m.mineId}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{m.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{m.state}</td>
                  <td className="px-4 py-2.5 text-gray-600">{m.manager}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${m.complianceScore >= 85 ? 'bg-emerald-500' : m.complianceScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${m.complianceScore}%` }} />
                      </div>
                      <span className="font-extrabold text-gray-800">{m.complianceScore}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                      m.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                      m.riskLevel === 'HIGH' ? 'bg-orange-600' :
                      m.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}>{m.riskLevel}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1 text-xs">
                      {m.complianceScore >= 80
                        ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600"/><span className="text-emerald-700 font-bold">Compliant</span></>
                        : <><XCircle className="w-3.5 h-3.5 text-red-600"/><span className="text-red-700 font-bold">Non-Compliant</span></>
                      }
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link to={`/mines/${m.mineId}`} className="text-amber-600 font-bold hover:underline text-[11px]">
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Violations with filter */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />Violation Registry
          </h3>
          <div className="flex items-center space-x-2">
            <select value={filter.severity} onChange={e => setFilter(f => ({...f, severity: e.target.value}))}
              className="text-[11px] border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-amber-400">
              <option value="">All Severities</option>
              <option>CRITICAL</option><option>MAJOR</option><option>MINOR</option>
            </select>
            <select value={filter.category} onChange={e => setFilter(f => ({...f, category: e.target.value}))}
              className="text-[11px] border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-amber-400">
              <option value="">All Categories</option>
              <option>SAFETY</option><option>ENVIRONMENT</option><option>PRODUCTION</option><option>LABOUR</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Violation ID</th>
                <th className="px-4 py-2.5">Mine</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Risk</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Detected</th>
                <th className="px-4 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredViolations.slice(0, 20).map(v => (
                <tr key={v.violationId} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5 font-mono font-bold text-gray-600">{v.violationId}</td>
                  <td className="px-4 py-2.5 text-gray-700 font-medium">{v.mineId}</td>
                  <td className="px-4 py-2.5 text-gray-600">{v.category}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${v.severity === 'CRITICAL' ? 'bg-red-600' : v.severity === 'MAJOR' ? 'bg-amber-500' : 'bg-emerald-500'}`}>{v.severity}</span>
                  </td>
                  <td className="px-4 py-2.5 font-bold text-gray-800">{v.riskScore || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' : v.status === 'OPEN' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{v.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{v.detectedDate?.split('T')[0]}</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/violations/${v.violationId}`} className="text-amber-600 font-bold hover:underline">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1">
            <History className="w-3.5 h-3.5" />Immutable Audit Trail (Read-Only)
          </h3>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">TAMPER-PROOF</span>
        </div>
        <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
          {audit.map((a, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
              <div>
                <p className="text-xs font-bold text-gray-800">{a.action}</p>
                <p className="text-[11px] text-gray-500">{a.userEmail} · {a.module} · Record: {a.recordId}</p>
              </div>
              <span className="text-[11px] text-gray-400 font-mono shrink-0 ml-4">{a.timestamp?.split('T')[0]} {a.timestamp?.split('T')[1]?.slice(0,5)}</span>
            </div>
          ))}
          {audit.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No audit events found</p>}
        </div>
      </div>
    </div>
  );
};

export default RegulatorDashboard;
