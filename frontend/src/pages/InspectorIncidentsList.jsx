import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Flame, MapPin, Calendar, Search, Plus } from 'lucide-react';

const InspectorIncidentsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/incidents')
      .then(r => setIncidents(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Only show incidents reported by this inspector
  const mine = incidents.filter(i => i.reporterId === user?.userId);

  const filtered = mine.filter(i =>
    !search || JSON.stringify(i).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading incidents...</div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />My Reported Incidents
          </h1>
          <p className="text-xs text-gray-500">{mine.length} incident{mine.length !== 1 ? 's' : ''} reported by you</p>
        </div>
        <Link
          to="/inspections/create"
          className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-3 py-2 rounded-lg shadow transition"
        >
          <Plus className="w-3.5 h-3.5" />Report New
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2 shadow-sm">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search incidents..."
          className="flex-1 text-xs border-0 focus:ring-0 outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm text-center py-14">
          <Flame className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">
            {search ? 'No incidents match your search' : 'No incidents reported yet'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {!search && 'Use Mobile Field Report to log incidents you observe on site'}
          </p>
          {!search && (
            <Link
              to="/inspections/create"
              className="mt-4 inline-block bg-[#F47C20] text-slate-950 font-bold text-xs px-4 py-2 rounded shadow transition hover:bg-orange-600"
            >
              + Report Incident
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Incident ID</th>
                  <th className="px-4 py-2.5">Mine / Zone</th>
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
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-gray-700">{inc.mineId}</p>
                      <p className="text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" />{inc.zone}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{inc.category}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                        inc.severity === 'CRITICAL' ? 'bg-red-600' :
                        inc.severity === 'MAJOR'    ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inc.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {inc.reportedAt?.split('T')[0]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate">{inc.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectorIncidentsList;
