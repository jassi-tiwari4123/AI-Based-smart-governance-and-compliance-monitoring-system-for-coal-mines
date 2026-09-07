import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, Upload, AlertTriangle, Loader2, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const CountdownBadge = ({ deadline }) => {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  const color = diff < 0 ? 'bg-red-100 text-red-800' : diff <= 1 ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${color}`}>
      {diff < 0 ? `${Math.abs(diff)}d OVERDUE` : diff === 0 ? 'DUE TODAY' : `${diff}d left`}
    </span>
  );
};

const ContractorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [evidenceNotes, setEvidenceNotes] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [violations, setViolations] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await API.get('/dashboard/contractor');
      const tasks = res.data?.tasks || [];
      setData(res.data);

      // Fetch violation details for each pending task
      const vioIds = [...new Set(tasks.map(t => t.violationId).filter(Boolean))];
      const vioMap = {};
      await Promise.all(vioIds.map(async id => {
        try {
          const v = await API.get(`/violations/${id}`);
          vioMap[id] = v.data;
        } catch {}
      }));
      setViolations(vioMap);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submitEvidence = async (actionId) => {
    const notes = evidenceNotes[actionId] || '';
    if (!notes.trim()) return alert('Please describe the corrective action taken.');
    setSubmitting(actionId);
    try {
      await API.put(`/corrective-actions/${actionId}/submit-evidence`, {
        submittedEvidence: [`/uploads/evidence_${actionId}.jpg`],
        notes,
      });
      setSubmitted(s => ({ ...s, [actionId]: true }));
      await fetchData();
    } catch (e) { console.error(e); }
    finally { setSubmitting(null); }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading Contractor Portal...</div>;

  const tasks = data?.tasks || [];
  const pending = tasks.filter(t => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status));
  const submitted_tasks = tasks.filter(t => t.status === 'SUBMITTED');
  const verified = tasks.filter(t => ['VERIFIED', 'CLOSED'].includes(t.status));

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="border-b border-gray-300 pb-4">
        <h1 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">Contractor Compliance Portal</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Logged in as: <span className="font-bold text-gray-700">{user?.name}</span> — Submit corrective evidence for assigned violations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assigned', value: data?.assignedTasksCount || 0, icon: FileText, color: 'text-blue-600' },
          { label: 'Pending Evidence', value: data?.pendingEvidenceCount || 0, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'Submitted', value: data?.submittedVerificationCount || 0, icon: Upload, color: 'text-purple-600' },
          { label: 'Completed', value: data?.completedTasksCount || 0, icon: CheckCircle2, color: 'text-emerald-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{k.label}</span>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <span className={`text-3xl font-black ${k.color}`}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Pending Tasks */}
      <div className="space-y-4">
        <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Pending Actions ({pending.length})
        </h2>
        {pending.length === 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-700">All tasks up to date!</p>
            <p className="text-xs text-emerald-600 mt-1">No pending corrective actions assigned to you.</p>
          </div>
        )}
        {pending.map(task => (
          <div key={task.actionId} className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-gray-900 text-sm">{task.actionId}</span>
                <span className="ml-2 text-xs text-gray-500">→ Violation:</span>
                <Link
                  to={`/violations/${task.violationId}`}
                  className="ml-1 text-xs text-amber-600 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  {task.violationId} <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex items-center space-x-2">
                <CountdownBadge deadline={task.deadline} />
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{task.status}</span>
              </div>
            </div>

            {/* Violation context */}
            {violations[task.violationId] && (
              <div className="px-4 pt-3 pb-0">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="text-xs font-extrabold text-red-700">{violations[task.violationId].title}</span>
                    <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                      violations[task.violationId].severity === 'CRITICAL' ? 'bg-red-600' :
                      violations[task.violationId].severity === 'MAJOR' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}>{violations[task.violationId].severity}</span>
                  </div>
                  <p className="text-xs text-red-600 leading-relaxed">{violations[task.violationId].description}</p>
                  <p className="text-[10px] text-red-400 font-semibold">{violations[task.violationId].regulation}</p>
                </div>
              </div>
            )}

            <div className="p-4 space-y-3">
              <div className="bg-gray-50 rounded p-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Action Required</span>
                <p className="text-xs text-gray-700 font-medium">{task.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-400 font-bold uppercase text-[10px] block">Deadline</span>
                  <span className="font-bold text-red-600">{task.deadline?.split('T')[0]}</span>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-400 font-bold uppercase text-[10px] block">Mine</span>
                  <span className="font-bold text-gray-700">{task.mineId}</span>
                </div>
              </div>

              {submitted[task.actionId] ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Evidence submitted — awaiting verification</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={evidenceNotes[task.actionId] || ''}
                    onChange={e => setEvidenceNotes(n => ({ ...n, [task.actionId]: e.target.value }))}
                    placeholder="Describe the corrective action taken, materials used, and steps completed..."
                    className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => submitEvidence(task.actionId)}
                      disabled={submitting === task.actionId}
                      className="flex items-center space-x-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-extrabold text-xs px-4 py-2 rounded transition disabled:opacity-50"
                    >
                      {submitting === task.actionId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{submitting === task.actionId ? 'Submitting...' : 'Submit Evidence'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submitted Tasks */}
      {submitted_tasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-500" />Awaiting Verification ({submitted_tasks.length})
          </h2>
          {submitted_tasks.map(task => (
            <div key={task.actionId} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-gray-800">{task.actionId}</p>
                <p className="text-[11px] text-gray-500">{task.description?.slice(0, 80)}...</p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">SUBMITTED</span>
            </div>
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {verified.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />Completed ({verified.length})
          </h2>
          {verified.map(task => (
            <div key={task.actionId} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800">{task.actionId}</p>
                <p className="text-[11px] text-emerald-600">{task.description?.slice(0, 80)}...</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractorDashboard;
