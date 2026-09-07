import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { AlertTriangle, Cpu, Search } from 'lucide-react';

const ViolationsList = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filters, setFilters]       = useState({ severity: '', category: '', status: '' });

  useEffect(() => {
    API.get('/violations')
      .then(res => setViolations(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = violations
    .filter(r => {
      if (filters.severity && r.severity !== filters.severity) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.status   && r.status   !== filters.status)   return false;
      if (search && !JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.detectedDate) - new Date(a.detectedDate));

  const riskColor = (score) => {
    if (score >= 81) return 'text-red-600';
    if (score >= 61) return 'text-orange-600';
    if (score >= 31) return 'text-amber-600';
    return 'text-emerald-600';
  };

  if (loading) return (
    <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading...</div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />Violations Log
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{violations.length} violations</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="flex items-center space-x-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search violations..."
            className="w-full text-xs border-0 focus:ring-0 outline-none" />
        </div>

        {[
          { key: 'severity', opts: ['CRITICAL','MAJOR','MINOR'] },
          { key: 'category', opts: ['SAFETY','ENVIRONMENT','PRODUCTION','LABOUR','EQUIPMENT','FIRE','STRUCTURAL'] },
          { key: 'status',   opts: ['OPEN','ASSIGNED','SUBMITTED','CLOSED','ESCALATED','REPORTED','UNDER_REVIEW','RESOLVED'] },
        ].map(f => (
          <select key={f.key} value={filters[f.key]}
            onChange={e => setFilters(x => ({ ...x, [f.key]: e.target.value }))}
            className="text-xs border border-gray-300 rounded px-2 py-1.5 capitalize focus:ring-1 focus:ring-amber-400">
            <option value="">All {f.key.charAt(0).toUpperCase() + f.key.slice(1)}</option>
            {f.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}

        <span className="text-xs text-gray-400 font-semibold">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Violation ID</th>
                <th className="px-4 py-2.5">Title / Observation</th>
                <th className="px-4 py-2.5">Mine</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Risk</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.violationId} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5 font-mono font-bold text-gray-600 whitespace-nowrap">{r.violationId}</td>

                  <td className="px-4 py-2.5 font-semibold text-gray-800 max-w-xs">
                    <p className="truncate">{r.title}</p>
                    {r.inspectionId && (
                      <p className="text-[10px] text-gray-400 font-normal">from {r.inspectionId}</p>
                    )}
                  </td>

                  <td className="px-4 py-2.5 text-gray-600">{r.mineId}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.category}</td>

                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                      r.severity === 'CRITICAL' ? 'bg-red-600' :
                      r.severity === 'MAJOR'    ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}>{r.severity}</span>
                  </td>

                  <td className="px-4 py-2.5">
                    {r.riskScore != null && r.riskScore > 0 ? (
                      <><span className={`font-extrabold text-sm ${riskColor(r.riskScore)}`}>{r.riskScore}</span>
                      <span className="text-gray-400 text-[10px]">/100</span></>
                    ) : (
                      <span className="text-gray-300 text-[10px]">—</span>
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'CLOSED' || r.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800' :
                      r.status === 'OPEN'
                        ? 'bg-red-100 text-red-800' :
                      r.status === 'ESCALATED'
                        ? 'bg-orange-100 text-orange-800' :
                      r.status === 'UNDER_REVIEW'
                        ? 'bg-purple-100 text-purple-800' :
                        'bg-amber-100 text-amber-800'
                    }`}>{r.status}</span>
                  </td>

                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                    {r.detectedDate?.split('T')[0]}
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="flex items-center space-x-2">
                      <Link to={`/violations/${r.violationId}`} className="text-amber-600 font-bold hover:underline text-[11px]">
                        Detail
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link to={`/ai-investigation/${r.violationId}`}
                        className="flex items-center gap-0.5 text-purple-600 font-bold hover:underline text-[11px]">
                        <Cpu className="w-3 h-3" />AI
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-gray-400">No violations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViolationsList;
