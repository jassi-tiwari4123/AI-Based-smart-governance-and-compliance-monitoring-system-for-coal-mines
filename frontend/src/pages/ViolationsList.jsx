import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { AlertTriangle, Cpu, Search, Flame } from 'lucide-react';

const ViolationsList = () => {
  const [violations, setViolations] = useState([]);
  const [incidents, setIncidents]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filters, setFilters]       = useState({ severity: '', category: '', status: '', type: '' });

  useEffect(() => {
    Promise.all([
      API.get('/violations'),
      API.get('/incidents'),
    ])
      .then(([vRes, iRes]) => {
        setViolations(vRes.data || []);
        setIncidents(iRes.data  || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Normalise incidents to the same shape as violations for unified display
  const incidentRows = incidents.map(i => ({
    _type:       'INCIDENT',
    id:          i.incidentId,
    title:       i.description?.slice(0, 60) || 'Incident',
    mineId:      i.mineId,
    category:    i.category,
    severity:    i.severity,
    riskScore:   null,
    status:      i.status,
    detectedDate: i.reportedAt,
    reportedBy:  i.reportedBy,
    _link:       `/incidents/${i.incidentId}`,
  }));

  const violationRows = violations.map(v => ({
    _type:       'VIOLATION',
    id:          v.violationId,
    title:       v.title,
    mineId:      v.mineId,
    category:    v.category,
    severity:    v.severity,
    riskScore:   v.riskScore,
    status:      v.status,
    detectedDate: v.detectedDate,
    reportedBy:  null,
    _link:       `/violations/${v.violationId}`,
    _aiLink:     `/ai-investigation/${v.violationId}`,
  }));

  const allRows = [...violationRows, ...incidentRows].sort(
    (a, b) => new Date(b.detectedDate) - new Date(a.detectedDate)
  );

  const filtered = allRows.filter(r => {
    if (filters.type     && r._type     !== filters.type)     return false;
    if (filters.severity && r.severity  !== filters.severity) return false;
    if (filters.category && r.category  !== filters.category) return false;
    if (filters.status   && r.status    !== filters.status)   return false;
    if (search && !JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
            <AlertTriangle className="w-5 h-5 text-amber-500" />Violations & Incidents Log
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {violationRows.length} violations · {incidentRows.length} incidents
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="flex items-center space-x-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full text-xs border-0 focus:ring-0 outline-none" />
        </div>

        {/* Type filter */}
        <select value={filters.type} onChange={e => setFilters(x => ({ ...x, type: e.target.value }))}
          className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-400">
          <option value="">All Types</option>
          <option value="VIOLATION">Violations</option>
          <option value="INCIDENT">Incidents</option>
        </select>

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
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Title / Description</th>
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
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  {/* Type badge */}
                  <td className="px-4 py-2.5">
                    {r._type === 'VIOLATION' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                        <AlertTriangle className="w-2.5 h-2.5" />Violation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">
                        <Flame className="w-2.5 h-2.5" />Incident
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2.5 font-mono font-bold text-gray-600 whitespace-nowrap">{r.id}</td>

                  <td className="px-4 py-2.5 font-semibold text-gray-800 max-w-xs">
                    <p className="truncate">{r.title}</p>
                    {r.reportedBy && <p className="text-[10px] text-gray-400 font-normal">by {r.reportedBy}</p>}
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
                    {r.riskScore != null ? (
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
                      r.status === 'OPEN' || r.status === 'REPORTED'
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
                      <Link to={r._link} className="text-amber-600 font-bold hover:underline text-[11px]">
                        Detail
                      </Link>
                      {r._aiLink && (
                        <>
                          <span className="text-gray-300">|</span>
                          <Link to={r._aiLink}
                            className="flex items-center gap-0.5 text-purple-600 font-bold hover:underline text-[11px]">
                            <Cpu className="w-3 h-3" />AI
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-6 text-gray-400">No records found</td>
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
