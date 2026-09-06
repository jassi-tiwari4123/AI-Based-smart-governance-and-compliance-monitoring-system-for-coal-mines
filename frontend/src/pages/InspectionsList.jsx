import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Smartphone, MapPin, User, Calendar, ChevronRight } from 'lucide-react';

const InspectionsList = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const res = await API.get('/inspections');
      setInspections(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Statutory Inspections...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">Statutory Inspections Register</h1>
          <p className="text-xs text-gray-600">Field Inspections, Safety Audits & Environmental Verification Records</p>
        </div>

        <Link
          to="/inspections/create"
          className="bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-3.5 py-2 rounded shadow transition flex items-center space-x-1.5 self-start"
        >
          <Smartphone className="w-4 h-4" />
          <span>+ Create Mobile Field Inspection</span>
        </Link>
      </div>

      <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#252525] text-white uppercase tracking-wider font-bold text-[10px]">
            <tr>
              <th className="py-3 px-4">Inspection ID</th>
              <th className="py-3 px-4">Mine ID</th>
              <th className="py-3 px-4">Zone</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Inspector</th>
              <th className="py-3 px-4">Observation</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-medium">
            {inspections.map((ins) => (
              <tr key={ins.inspectionId} className="hover:bg-gray-50 transition">
                <td className="py-3 px-4 font-mono font-bold text-gray-900">{ins.inspectionId}</td>
                <td className="py-3 px-4 font-bold text-gray-700">{ins.mineId}</td>
                <td className="py-3 px-4 text-gray-600">{ins.zone}</td>
                <td className="py-3 px-4">
                  <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-bold text-[10px]">{ins.category}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                    ins.severity === 'CRITICAL' ? 'bg-red-600' :
                    ins.severity === 'MAJOR' ? 'bg-orange-600' : 'bg-emerald-600'
                  }`}>
                    {ins.severity}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-800">{ins.inspectorName || ins.inspectorId}</td>
                <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{ins.observations}</td>
                <td className="py-3 px-4">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                    {ins.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link to={`/inspections/${ins.inspectionId}`} className="text-amber-600 font-bold hover:underline">
                    Details →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InspectionsList;
