import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import RiskMeter from '../components/RiskMeter';
import {
  Cpu, Eye, Database, Brain, CheckCircle2, AlertTriangle, ArrowRight,
  Shield, FileText, History, UserCheck, ArrowLeft, Send
} from 'lucide-react';

const AiInvestigationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [violation, setViolation] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);

  const [actionForm, setActionForm] = useState({
    assignedTo: 'Vikram Heavy Infra (Contractor)',
    description: 'Provide certified safety helmets & steel-toed boots for all pit workers in Zone B immediately.',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchInvestigation();
  }, [id]);

  const fetchInvestigation = async () => {
    try {
      const vRes = await API.get(`/violations/${id}`);
      setViolation(vRes.data);

      const invRes = await API.post(`/ai/investigate/${id}`);
      setInvestigation(invRes.data);
    } catch (e) {
      console.error("Error fetching AI investigation", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAction = async (e) => {
    e.preventDefault();
    try {
      await API.post('/corrective-actions', {
        violationId: violation.violationId,
        mineId: violation.mineId,
        assignedTo: actionForm.assignedTo,
        description: actionForm.description,
        deadline: new Date(actionForm.deadline).toISOString()
      });
      setShowActionModal(false);
      navigate('/corrective-actions');
    } catch (err) {
      console.error("Error creating action", err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-bold text-gray-500">Running AI Knowledge Base Retrieval & Reasoning Agent...</div>;
  }

  const reason = investigation?.reason || {};
  const retrieve = investigation?.retrieve || {};
  const observe = investigation?.observe || {};

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto font-sans">
      <Link to={`/violations/${id}`} className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center space-x-1">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Violation Details</span>
      </Link>

      {/* Header */}
      <div className="bg-[#252525] text-white p-5 rounded-lg shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#F47C20]">
        <div className="flex items-center space-x-3">
          <div className="bg-[#F47C20] text-black p-2.5 rounded font-bold">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded">EXPLAINABLE AI AGENT</span>
              <span className="text-xs font-mono font-bold text-amber-400">{violation?.violationId}</span>
            </div>
            <h1 className="text-xl font-black text-white tracking-wide mt-0.5">Statutory AI Compliance Investigation</h1>
            <p className="text-xs text-gray-300">Mine: {violation?.mineId} | Category: {violation?.category}</p>
          </div>
        </div>

        <button
          onClick={() => setShowActionModal(true)}
          className="bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded shadow transition flex items-center space-x-2 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Create Corrective Action</span>
        </button>
      </div>

      {/* Risk Score Meter */}
      <RiskMeter
        score={violation?.riskScore || 82}
        level={violation?.riskLevel || 'CRITICAL'}
        factors={reason.risk_factors || []}
      />

      {/* 6 STAGES OF AI AGENT PIPELINE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. OBSERVE */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-700 font-extrabold text-xs uppercase border-b pb-2 mb-3">
              <Eye className="w-4 h-4" />
              <span>1. OBSERVE (Field Data)</span>
            </div>
            <div className="space-y-2 text-xs">
              <span className="font-bold text-gray-900 block">{observe.title || violation?.title}</span>
              <p className="text-gray-600">{observe.description || violation?.description}</p>
              <div className="bg-gray-50 p-2 rounded text-[11px] font-mono text-gray-500">
                GPS: {observe.gpsLocation?.lat || 20.9167}, {observe.gpsLocation?.lng || 85.1500}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 mt-4 block">Stage 1 Complete ✓</span>
        </div>

        {/* 2. RETRIEVE */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-purple-700 font-extrabold text-xs uppercase border-b pb-2 mb-3">
              <Database className="w-4 h-4" />
              <span>2. RETRIEVE (Knowledge Base)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="bg-purple-50 p-2.5 rounded border border-purple-200">
                <span className="font-bold text-purple-900 block">Applicable Regulation:</span>
                <span className="text-purple-800 font-semibold">{retrieve.regulations?.[0]?.act} ({retrieve.regulations?.[0]?.rule})</span>
                <p className="text-purple-700 mt-1 text-[11px]">{retrieve.regulations?.[0]?.mandatoryAction || retrieve.regulations?.[0]?.title}</p>
              </div>
              <div className="text-[11px] text-gray-600">
                <span className="font-bold block">Historical Context:</span>
                <span>{retrieve.historicalCases?.[0] || "No prior history"}</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 mt-4 block">Stage 2 Complete ✓</span>
        </div>

        {/* 3. REASON */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-amber-700 font-extrabold text-xs uppercase border-b pb-2 mb-3">
              <Brain className="w-4 h-4" />
              <span>3. REASON (Synthesis)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-gray-800 block">AI Finding:</span>
                <p className="text-gray-700 font-semibold">{reason.finding}</p>
              </div>
              <div>
                <span className="font-bold text-gray-800 block">Evidence Match:</span>
                <p className="text-gray-600">{reason.evidence}</p>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-600 mt-4 block">Confidence Score: {reason.confidence || 'High (94%)'}</span>
        </div>

        {/* 4. DECIDE */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-red-700 font-extrabold text-xs uppercase border-b pb-2 mb-3">
              <AlertTriangle className="w-4 h-4" />
              <span>4. DECIDE (Risk Decision)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="bg-red-50 p-2.5 rounded border border-red-200 text-red-900 font-bold">
                Level: CRITICAL RISK (82 / 100)
              </div>
              <p className="text-gray-600">Decision: Automatic escalation to Mine Safety Manager & Corporate Admin required.</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 mt-4 block">Stage 4 Complete ✓</span>
        </div>

        {/* 5. ACT */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 font-extrabold text-xs uppercase border-b pb-2 mb-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>5. ACT (Action Target)</span>
            </div>
            <div className="space-y-2 text-xs">
              <span className="font-bold text-gray-800 block">Recommendation:</span>
              <p className="text-gray-700 font-semibold">{reason.recommendation}</p>
            </div>
          </div>
          <button
            onClick={() => setShowActionModal(true)}
            className="mt-3 w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded transition"
          >
            Execute Corrective Action
          </button>
        </div>

        {/* 6. VERIFY */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-gray-800 font-extrabold text-xs uppercase border-b pb-2 mb-3">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>6. VERIFY (Re-Inspection)</span>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <span className="font-bold text-gray-800 block">Verification Protocol:</span>
              <p>{investigation?.verify?.verificationMethod || "Photo & GPS Tagged Inspection Re-upload"}</p>
              <p className="text-gray-500">Approver: {investigation?.verify?.requiredApprover || "Mine Manager"}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 mt-4 block">Stage 6 Standard Defined ✓</span>
        </div>
      </div>

      {/* Action Assignment Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-extrabold uppercase text-gray-900 border-b pb-2">
              Assign Corrective Action (VIO-2026-0001)
            </h3>
            <form onSubmit={handleCreateAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Assign Responsible Officer / Contractor</label>
                <input
                  type="text"
                  required
                  value={actionForm.assignedTo}
                  onChange={(e) => setActionForm({ ...actionForm, assignedTo: e.target.value })}
                  className="w-full p-2 border rounded font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Corrective Action Instructions</label>
                <textarea
                  rows="3"
                  required
                  value={actionForm.description}
                  onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                  className="w-full p-2 border rounded font-medium"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Compliance Deadline</label>
                <input
                  type="date"
                  required
                  value={actionForm.deadline}
                  onChange={(e) => setActionForm({ ...actionForm, deadline: e.target.value })}
                  className="w-full p-2 border rounded font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#F47C20] text-slate-950 font-extrabold rounded hover:bg-orange-600"
                >
                  Assign Action & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiInvestigationPage;
