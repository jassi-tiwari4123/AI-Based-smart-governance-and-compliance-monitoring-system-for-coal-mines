import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { History, Shield, Search, Filter } from 'lucide-react';

const moduleColors = {
  INSPECTION: 'bg-blue-100 text-blue-800',
  VIOLATION: 'bg-red-100 text-red-800',
  AI_ENGINE: 'bg-purple-100 text-purple-800',
  AI_RISK: 'bg-indigo-100 text-indigo-800',
  AI_AGENT: 'bg-violet-100 text-violet-800',
  WORKFLOW: 'bg-amber-100 text-amber-800',
  GOVERNANCE: 'bg-gray-100 text-gray-700',
  AUTH: 'bg-emerald-100 text-emerald-800',
};

const roleColors = {
  INSPECTOR: 'bg-blue-600',
  MINE_MANAGER: 'bg-amber-600',
  CORPORATE_ADMIN: 'bg-purple-600',
  REGULATOR: 'bg-emerald-600',
  CONTRACTOR: 'bg-orange-600',
  SUPER_ADMIN: 'bg-red-600',
};

const AuditTrailPage = () => {
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    API.get('/audit')
      .then(r => setAudit(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = audit.filter(a => {
    if (search && !JSON.stringify(a).toLowerCase().includes(search.toLowerCase())) return false;
    if (filterModule && a.module !== filterModule) return false;
    if (filterRole && a.role !== filterRole) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading audit trail...</div>;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#F47C20]" />
            Immutable Audit Trail
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Tamper-proof log of every governance action — {audit.length} total events</p>
        </div>
        <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1.5 rounded flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />IMMUTABLE LOG
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="flex items-center space-x-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search actions, users, record IDs..."
            className="w-full text-xs border-0 focus:ring-0 outline-none text-gray-700"
          />
        </div>
        <select value={filterModule} onChange={e => { setFilterModule(e.target.value); setPage(1); }}
          className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-400">
          <option value="">All Modules</option>
          {['INSPECTION','VIOLATION','AI_ENGINE','AI_RISK','AI_AGENT','WORKFLOW','GOVERNANCE','AUTH'].map(m => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}
          className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-400">
          <option value="">All Roles</option>
          {['INSPECTOR','MINE_MANAGER','CORPORATE_ADMIN','REGULATOR','CONTRACTOR','SUPER_ADMIN'].map(r => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 font-semibold">{filtered.length} results</span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Module</th>
                <th className="px-4 py-2.5">Record ID</th>
                <th className="px-4 py-2.5">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {paginated.map((a, i) => (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-[11px]">
                    <span className="text-gray-700">{a.timestamp?.split('T')[0]}</span>
                    <span className="text-gray-400 ml-1">{a.timestamp?.split('T')[1]?.slice(0,8)}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-gray-700 font-bold font-sans">{a.userEmail}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${roleColors[a.role] || 'bg-gray-500'}`}>
                      {a.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-sans font-semibold text-gray-800">{a.action}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${moduleColors[a.module] || 'bg-gray-100 text-gray-600'}`}>
                      {a.module}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{a.recordId}</td>
                  <td className="px-4 py-2.5 text-gray-400">{a.ipAddress || 'N/A'}</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400 font-sans">No audit events found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
            <span className="text-xs text-gray-500">Page {page} of {totalPages} — {filtered.length} events</span>
            <div className="flex space-x-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-100 transition">← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-100 transition">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrailPage;
