import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Users, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const ContractorsList = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContractorDashboard();
  }, []);

  const fetchContractorDashboard = async () => {
    try {
      const res = await API.get('/dashboard/contractor');
      setDashboard(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Contractor Governance...</div>;

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">Contractor Management & Assigned Safety Tasks</h1>
          <p className="text-xs text-gray-600">Track Assigned Corrective Actions, Evidence Submissions & Task Verification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Assigned Tasks</span>
          <span className="text-2xl font-black text-gray-900">{dashboard?.assignedTasksCount || 0}</span>
        </div>
        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Pending Evidence Upload</span>
          <span className="text-2xl font-black text-amber-600">{dashboard?.pendingEvidenceCount || 0}</span>
        </div>
        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Submitted for Manager Verification</span>
          <span className="text-2xl font-black text-blue-600">{dashboard?.submittedVerificationCount || 0}</span>
        </div>
        <div className="bg-white border border-gray-300 rounded-md p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Verified & Closed Tasks</span>
          <span className="text-2xl font-black text-emerald-600">{dashboard?.completedTasksCount || 0}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b font-bold text-xs uppercase text-gray-900">
          Assigned Tasks List
        </div>
        <div className="divide-y divide-gray-200 text-xs">
          {dashboard?.tasks?.map((t) => (
            <div key={t.actionId} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-gray-900">{t.actionId}</span>
                  <span className="text-gray-500 font-mono">({t.violationId})</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {t.status}
                  </span>
                </div>
                <p className="text-gray-700 font-medium mt-1">{t.description}</p>
                <span className="text-[10px] text-gray-400 block mt-1">Deadline: {t.deadline?.split('T')[0]}</span>
              </div>
              <Link to="/corrective-actions" className="text-amber-600 font-bold hover:underline">
                Manage Task →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContractorsList;
