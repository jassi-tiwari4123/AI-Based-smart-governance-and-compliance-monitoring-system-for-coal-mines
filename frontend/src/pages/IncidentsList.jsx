import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Flame, MapPin, Calendar, User, AlertTriangle } from 'lucide-react';

const IncidentsList = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await API.get('/incidents');
      setIncidents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Mine Incidents Log...</div>;

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">Mine Incidents Register</h1>
          <p className="text-xs text-gray-600">Near-Miss & Operational Incident Reporting for AI Risk Analysis</p>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#252525] text-white uppercase tracking-wider font-bold text-[10px]">
            <tr>
              <th className="py-3 px-4">Incident ID</th>
              <th className="py-3 px-4">Mine ID</th>
              <th className="py-3 px-4">Zone</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Reported By</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-medium">
            {incidents.map((inc) => (
              <tr key={inc.incidentId} className="hover:bg-gray-50 transition">
                <td className="py-3 px-4 font-mono font-bold text-gray-900">{inc.incidentId}</td>
                <td className="py-3 px-4 font-bold text-gray-700">{inc.mineId}</td>
                <td className="py-3 px-4 text-gray-600">{inc.zone}</td>
                <td className="py-3 px-4">
                  <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-bold text-[10px]">{inc.category}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                    inc.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-600'
                  }`}>
                    {inc.severity}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{inc.description}</td>
                <td className="py-3 px-4 text-gray-800">{inc.reportedBy}</td>
                <td className="py-3 px-4">
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">{inc.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncidentsList;
