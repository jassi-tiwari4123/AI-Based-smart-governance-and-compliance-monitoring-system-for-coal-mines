import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Flame, MapPin, Search } from 'lucide-react';

const IncidentsList = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/incidents')
      .then(r => setIncidents(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = incidents.filter(i =>
    !search || JSON.stringify(i).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading incidents...</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />Incidents Log
          </h1>
          <p className="text-xs text-gray-500">{incidents.length} incident records</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents..."
          className="flex-1 text-xs border-0 focus:ring-0 outline-none" />
      </div>

      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Incident ID</th>
                <th className="px-4 py-2.5">Mine</th>
                <th className="px-4 py-2.5">Zone</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Reported At</th>
                <th className="px-4 py-2.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(inc => (
                <tr
                  key={inc.incidentId}
                  onClick={() => navigate(`/incidents/${inc.incidentId}`)}
                  className="hover:bg-amber-50 cursor-pointer transition"
                >
                  <td className="px-4 py-2.5 font-mono font-bold text-amber-600">{inc.incidentId}</td>
                  <td className="px-4 py-2.5 text-gray-700">{inc.mineId}</td>
                  <td className="px-4 py-2.5 text-gray-600">{inc.zone}</td>
                  <td className="px-4 py-2.5 text-gray-600">{inc.category}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${inc.severity === 'CRITICAL' ? 'bg-red-600' : inc.severity === 'MAJOR' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.status === 'RESOLVED'     ? 'bg-emerald-100 text-emerald-800' :
                      inc.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' :
                                                      'bg-blue-100 text-blue-800'
                    }`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{inc.reportedAt?.split('T')[0]}</td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate">{inc.description}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-6 text-gray-400">No incidents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IncidentsList;
