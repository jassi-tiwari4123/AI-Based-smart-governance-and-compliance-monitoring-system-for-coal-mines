import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import RiskMeter from '../components/RiskMeter';
import { ArrowLeft, Cpu, ShieldAlert, FileText, Send, Calendar, UserCheck } from 'lucide-react';

const ViolationDetail = () => {
  const { id } = useParams();
  const [violation, setViolation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViolation();
  }, [id]);

  const fetchViolation = async () => {
    try {
      const res = await API.get(`/violations/${id}`);
      setViolation(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Violation Detail...</div>;
  if (!violation) return <div className="p-8 text-center text-xs font-bold text-red-600">Violation not found.</div>;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
      <Link to="/violations" className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center space-x-1">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Violations Log</span>
      </Link>

      <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
          <div>
            <span className="text-xs font-mono font-bold text-amber-600">{violation.violationId}</span>
            <h1 className="text-xl font-extrabold text-gray-900">{violation.title}</h1>
            <p className="text-xs text-gray-600 mt-0.5">Mine: {violation.mineId} | Category: {violation.category}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to={`/ai-investigation/${violation.violationId}`}
              className="bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded shadow transition flex items-center space-x-1.5"
            >
              <Cpu className="w-4 h-4" />
              <span>Launch AI Agent Investigation</span>
            </Link>
          </div>
        </div>

        <RiskMeter
          score={violation.riskScore}
          level={violation.riskLevel}
          factors={violation.aiAnalysis?.riskFactors || []}
        />

        <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2 text-xs">
          <span className="font-extrabold text-gray-900 block">Observation Details:</span>
          <p className="text-gray-700">{violation.description}</p>
          <div className="flex items-center space-x-4 text-gray-500 pt-2 border-t mt-2">
            <span>Regulation: <strong>{violation.regulation || 'CMR 104'}</strong></span>
            <span>Assigned: <strong>{violation.assignedTo || 'Unassigned'}</strong></span>
            <span>Status: <strong className="text-amber-700">{violation.status}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViolationDetail;
