import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, Cpu, Filter, ChevronRight } from 'lucide-react';

const ViolationsList = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchViolations();
  }, [filterCategory]);

  const fetchViolations = async () => {
    try {
      const url = filterCategory ? `/violations?category=${filterCategory}` : '/violations';
      const res = await API.get(url);
      setViolations(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Non-Compliance Violations Log...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">Non-Compliance Violations Directory</h1>
          <p className="text-xs text-gray-600">Track AI Risk Scores, Statutory Regulations, and Assigned Corrective Actions</p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs font-bold p-2 border border-gray-300 rounded bg-white"
          >
            <option value="">All Categories</option>
            <option value="SAFETY">SAFETY</option>
            <option value="ENVIRONMENT">ENVIRONMENT</option>
            <option value="PRODUCTION">PRODUCTION</option>
            <option value="LABOUR">LABOUR</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#252525] text-white uppercase tracking-wider font-bold text-[10px]">
            <tr>
              <th className="py-3 px-4">Violation ID</th>
              <th className="py-3 px-4">Mine ID</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Title & Description</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Assigned Entity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-medium">
            {violations.map((v) => (
              <tr key={v.violationId} className="hover:bg-gray-50 transition">
                <td className="py-3 px-4 font-mono font-bold text-gray-900">{v.violationId}</td>
                <td className="py-3 px-4 font-bold text-gray-700">{v.mineId}</td>
                <td className="py-3 px-4">
                  <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-bold text-[10px]">{v.category}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-gray-900 block">{v.title}</span>
                  <span className="text-gray-500 text-[11px] truncate max-w-xs block">{v.description}</span>
                </td>
                <td className="py-3 px-4 font-extrabold text-gray-900 text-sm">{v.riskScore} / 100</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold text-white ${
                    v.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                    v.riskLevel === 'HIGH' ? 'bg-orange-600' :
                    v.riskLevel === 'MEDIUM' ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    {v.riskLevel}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700">{v.assignedTo || 'Unassigned'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    v.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' :
                    v.status === 'ESCALATED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {v.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  <Link to={`/violations/${v.violationId}`} className="text-gray-700 font-bold hover:underline">
                    View
                  </Link>
                  <Link
                    to={`/ai-investigation/${v.violationId}`}
                    className="text-[#F47C20] font-extrabold hover:underline inline-flex items-center space-x-1"
                  >
                    <Cpu className="w-3 h-3" />
                    <span>AI Investigate</span>
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

export default ViolationsList;
