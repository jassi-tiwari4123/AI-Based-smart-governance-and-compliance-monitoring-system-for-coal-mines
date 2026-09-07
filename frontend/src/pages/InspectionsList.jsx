import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { ClipboardCheck, Search, Plus, ChevronRight } from 'lucide-react';

const InspectionsList = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', severity: '', status: '' });

  useEffect(() => {
    API.get('/inspections')
      .then(r => setInspections(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = inspections.filter(i => {
    if (search && !JSON.stringify(i).toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.category && i.category !== filters.category) return false;
    if (filters.severity && i.severity !== filters.severity) return false;
    if (filters.status && i.status !== filters.status) return false;
    return true;
  });

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading inspections...</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#F47C20]" />Safety Inspections
          </h1>
          <p className="text-xs text-gray-500">{inspections.length} field inspection records</p>
        </div>
        <Link to="/inspections/create"
          className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded shadow transition">
          <Plus className="w-3.5 h-3.5" /><span>New Inspection</span>
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap gap-3 shadow-sm">
        <div className="flex items-center space-x-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inspections..."
            className="w-full text-xs border-0 focus:ring-0 outline-none" />
        </div>
        {[
          { key: 'category', opts: ['SAFETY','ENVIRONMENT','PRODUCTION','LABOUR'] },
          { key: 'severity', opts: ['CRITICAL','MAJOR','MINOR'] },
          { key: 'status', opts: ['SUBMITTED','REVIEWED','IN_PROGRESS','CLOSED'] },
        ].map(f => (
          <select key={f.key} value={filters[f.key]} onChange={e => setFilters(x => ({...x, [f.key]: e.target.value}))}
            className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-400 capitalize">
            <option value="">All {f.key}</option>
            {f.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span className="text-xs text-gray-400 font-semibold self-center">{filtered.length} results</span>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Inspection ID</th>
                <th className="px-4 py-2.5">Mine</th>
                <th className="px-4 py-2.5">Zone</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Inspector</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(ins => (
                <tr key={ins.inspectionId} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5 font-mono font-bold text-gray-600">{ins.inspectionId}</td>
                  <td className="px-4 py-2.5 text-gray-700 font-semibold">{ins.mineId}</td>
                  <td className="px-4 py-2.5 text-gray-600">{ins.zone}</td>
                  <td className="px-4 py-2.5 text-gray-600">{ins.category}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${ins.severity === 'CRITICAL' ? 'bg-red-600' : ins.severity === 'MAJOR' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                      {ins.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-32 truncate">{ins.inspectorName}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ins.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-800' : ins.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      {ins.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{ins.inspectionDate?.split('T')[0]}</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/inspections/${ins.inspectionId}`} className="text-amber-600 font-bold hover:underline flex items-center gap-0.5">
                      View <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center py-6 text-gray-400">No inspections found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InspectionsList;
