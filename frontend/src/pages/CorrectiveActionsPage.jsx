import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileCheck, CheckCircle2, XCircle, Upload, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const statusColors = {
  ASSIGNED:  'bg-blue-100 text-blue-800',
  SUBMITTED: 'bg-purple-100 text-purple-800',
  VERIFIED:  'bg-emerald-100 text-emerald-800',
  REWORK:    'bg-red-100 text-red-800',
  ESCALATED: 'bg-orange-100 text-orange-800',
};

const ActionCard = ({ action, onRefresh, user }) => {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const canSubmit = user?.role === 'CONTRACTOR';
  const canVerify = ['MINE_MANAGER', 'CORPORATE_ADMIN', 'REGULATOR', 'SUPER_ADMIN'].includes(user?.role);

  const submitEvidence = async () => {
    if (!notes.trim()) return;
    setSubmitting(true);
    try {
      await API.put(`/corrective-actions/${action.actionId}/submit-evidence`, {
        submittedEvidence: [`/uploads/evidence_${action.actionId}.jpg`],
        notes,
      });
      onRefresh();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const verify = async (approved) => {
    setVerifying(true);
    try {
      await API.put(`/corrective-actions/${action.actionId}/verify`, {
        approved,
        verificationNotes: verifyNotes || (approved ? 'Action verified and compliant.' : 'Rework required — insufficient evidence.'),
      });
      onRefresh();
    } catch (e) { console.error(e); }
    finally { setVerifying(false); }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <span className="font-mono font-extrabold text-gray-700 text-xs">{action.actionId}</span>
          <span className="text-xs text-gray-500">→</span>
          <Link to={`/violations/${action.violationId}`} onClick={e => e.stopPropagation()}
            className="text-xs text-amber-600 font-bold hover:underline">{action.violationId}</Link>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[action.status] || 'bg-gray-100 text-gray-600'}`}>
            {action.status}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Mine', val: action.mineId },
              { label: 'Assigned To', val: action.assignedTo },
              { label: 'Deadline', val: action.deadline?.split('T')[0] },
              { label: 'Created', val: action.createdAt?.split('T')[0] },
            ].map((f, i) => (
              <div key={i} className="bg-gray-50 rounded p-2">
                <span className="text-gray-400 font-bold uppercase text-[10px] block">{f.label}</span>
                <span className="font-semibold text-gray-800">{f.val || '—'}</span>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded p-3 text-xs">
            <span className="text-gray-400 font-bold uppercase text-[10px] block mb-1">Description</span>
            <p className="text-gray-700">{action.description}</p>
          </div>

          {action.submittedEvidence && action.submittedEvidence.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded p-3 text-xs">
              <p className="font-bold text-purple-700 mb-1">Submitted Evidence</p>
              {action.submittedEvidence.map((e, i) => (
                <p key={i} className="text-purple-600 font-mono">{e}</p>
              ))}
              {action.contractorNotes && <p className="text-gray-600 mt-1">{action.contractorNotes}</p>}
            </div>
          )}

          {action.verificationResult && (
            <div className={`rounded p-3 text-xs border ${action.status === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`font-bold ${action.status === 'VERIFIED' ? 'text-emerald-700' : 'text-red-700'}`}>
                Verification by {action.verifiedBy}
              </p>
              <p className="text-gray-600 mt-0.5">{action.verificationResult}</p>
            </div>
          )}

          {/* Evidence submission */}
          {canSubmit && ['ASSIGNED', 'REWORK'].includes(action.status) && (
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <p className="text-xs font-extrabold text-gray-700">Submit Corrective Evidence</p>
              <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Describe corrective action taken..."
                className="w-full text-xs border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-amber-400 resize-none" />
              <button onClick={submitEvidence} disabled={submitting || !notes.trim()}
                className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-extrabold text-xs px-4 py-2 rounded transition disabled:opacity-50">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{submitting ? 'Submitting...' : 'Submit Evidence'}</span>
              </button>
            </div>
          )}

          {/* Verification */}
          {canVerify && action.status === 'SUBMITTED' && (
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <p className="text-xs font-extrabold text-gray-700">Verify Corrective Action</p>
              <textarea rows={2} value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)}
                placeholder="Verification notes (optional)..."
                className="w-full text-xs border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-amber-400 resize-none" />
              <div className="flex space-x-2">
                <button onClick={() => verify(true)} disabled={verifying}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded transition disabled:opacity-50">
                  <CheckCircle2 className="w-3.5 h-3.5" /><span>Approve & Close</span>
                </button>
                <button onClick={() => verify(false)} disabled={verifying}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded transition disabled:opacity-50">
                  <XCircle className="w-3.5 h-3.5" /><span>Request Rework</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CorrectiveActionsPage = () => {
  const { user } = useAuth();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchActions = async () => {
    try {
      const res = await API.get('/corrective-actions');
      setActions(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchActions(); 
    // Poll every 30 seconds so mine manager sees contractor submissions in near real-time
    const interval = setInterval(fetchActions, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filterStatus ? actions.filter(a => a.status === filterStatus) : actions;

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading corrective actions...</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#F47C20]" />Corrective Action & Verification
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Full CAPA lifecycle — Assign → Submit Evidence → AI Verify → Close</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'ASSIGNED', 'SUBMITTED', 'VERIFIED', 'ESCALATED', 'REWORK'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`text-xs font-bold px-3 py-1.5 rounded border transition ${filterStatus === s ? 'bg-[#252525] text-white border-[#252525]' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-500'}`}>
            {s || 'All'} {s ? `(${actions.filter(a => a.status === s).length})` : `(${actions.length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(action => (
          <ActionCard key={action.actionId} action={action} onRefresh={fetchActions} user={user} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <FileCheck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-bold">No corrective actions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrectiveActionsPage;
