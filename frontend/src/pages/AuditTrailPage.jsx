import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';

const AuditTrailPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('');

  useEffect(() => {
    fetchAuditTrail();
  }, [filterModule]);

  const fetchAuditTrail = async () => {
    try {
      const url = filterModule ? `/audit?module=${filterModule}` : '/audit';
      const res = await API.get(url);
      setLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Immutable Audit Trail Logs...</div>;

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">Immutable Statutory Audit Trail</h1>
          <p className="text-xs text-gray-600">Cryptographically Recorded Log of Every Inspection, AI Analysis, Evidence Upload & Status Change</p>
        </div>

        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="text-xs font-bold p-2 border border-gray-300 rounded bg-white"
        >
          <option value="">All Modules</option>
          <option value="INSPECTION">INSPECTION</option>
          <option value="VIOLATION">VIOLATION</option>
          <option value="AI_ENGINE">AI_ENGINE</option>
          <option value="WORKFLOW">WORKFLOW</option>
          <option value="AUTH">AUTH</option>
        </select>
      </div>

      <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#252525] text-white uppercase tracking-wider font-bold text-[10px]">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">User & Role</th>
              <th className="py-3 px-4">Action Performed</th>
              <th className="py-3 px-4">Module</th>
              <th className="py-3 px-4">Record Ref</th>
              <th className="py-3 px-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-medium font-mono text-[11px]">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-gray-50 transition">
                <td className="py-3 px-4 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="py-3 px-4 font-sans font-bold text-gray-900">
                  {log.userEmail} <span className="text-[10px] text-amber-600 font-bold block">{log.role}</span>
                </td>
                <td className="py-3 px-4 font-sans font-bold text-emerald-800">{log.action}</td>
                <td className="py-3 px-4">
                  <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[10px] font-bold">{log.module}</span>
                </td>
                <td className="py-3 px-4 font-bold text-gray-700">{log.recordId}</td>
                <td className="py-3 px-4 text-gray-400">{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTrailPage;
