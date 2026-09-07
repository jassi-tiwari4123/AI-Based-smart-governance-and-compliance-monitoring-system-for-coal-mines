import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { GitPullRequest, Clock, AlertTriangle, CheckCircle2, Loader2, ChevronRight, RefreshCw } from 'lucide-react';

const statusColors = {
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  SUBMITTED: 'bg-purple-100 text-purple-800',
  VERIFIED: 'bg-emerald-100 text-emerald-800',
  ESCALATED: 'bg-orange-100 text-orange-800',
  ESCALATED_CORPORATE: 'bg-red-100 text-red-800',
  REWORK: 'bg-rose-100 text-rose-800',
  OPEN: 'bg-gray-100 text-gray-700',
};

const CountdownBadge = ({ deadline }) => {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return <span className="text-[10px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded">{Math.abs(diff)}d OVERDUE</span>;
  if (diff === 0) return <span className="text-[10px] font-extrabold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">DUE TODAY</span>;
  return <span className="text-[10px] font-semibold text-gray-500">{diff}d remaining</span>;
};

const WorkflowsPage = () => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { fetchActions(); }, []);

  const fetchActions = async () => {
    try {
      const res = await API.get('/corrective-actions');
      setActions(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const runEscalation = async () => {
    setEvaluating(true);
    try {
      await API.post('/workflows/evaluate');
      await fetchActions();
    } catch (e) { console.error(e); }
    finally { setEvaluating(false); }
  };

  const filteredActions = filter === 'ALL' ? actions : actions.filter(a => a.status === filter);

  const statusCounts = actions.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading workflow engine...</div>;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-[#F47C20]" />Workflows & Escalation Engine
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Track corrective action lifecycle — {actions.length} total actions</p>
        </div>
        <button onClick={runEscalation} disabled={evaluating}
          className="flex items-center gap-1.5 bg-[#252525] text-white font-bold text-xs px-4 py-2 rounded hover:bg-gray-700 transition disabled:opacity-50">
          {evaluating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>{evaluating ? 'Evaluating...' : 'Run Escalation Check'}</span>
        </button>
      </div>

      {/* Status Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { status: 'ASSIGNED', label: 'Assigned', color: 'text-blue-600' },
          { status: 'IN_PROGRESS', label: 'In Progress', color: 'text-amber-600' },
          { status: 'SUBMITTED', label: 'Submitted', color: 'text-purple-600' },
          { status: 'VERIFIED', label: 'Verified', color: 'text-emerald-600' },
          { status: 'ESCALATED', label: 'Escalated', color: 'text-orange-600' },
          { status: 'REWORK', label: 'Rework', color: 'text-red-600' },
        ].map(s => (
          <button
            key={s.status}
            onClick={() => setFilter(filter === s.status ? 'ALL' : s.status)}
            className={`bg-white border rounded-lg p-3 text-center shadow-sm transition ${filter === s.status ? 'border-[#F47C20] shadow-md' : 'border-gray-300 hover:border-gray-400'}`}
          >
            <p className={`text-2xl font-black ${s.color}`}>{statusCounts[s.status] || 0}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Escalation Matrix Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider mb-2">Escalation Matrix</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {[
            { days: '0 days', trigger: 'Reminder to Assignee', color: 'text-gray-600' },
            { days: '2 days overdue', trigger: 'Notify Mine Manager', color: 'text-amber-700' },
            { days: '5 days overdue', trigger: 'Escalate to Corporate', color: 'text-orange-700' },
            { days: '7+ days overdue', trigger: 'Alert Regulator', color: 'text-red-700' },
          ].map((e, i) => (
            <div key={i} className="bg-white rounded border border-amber-100 p-2">
              <p className="font-extrabold text-gray-700">{e.days}</p>
              <p className={`${e.color} font-semibold mt-0.5`}>{e.trigger}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Table */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
            {filter === 'ALL' ? 'All Corrective Actions' : `${filter} Actions`} ({filteredActions.length})
          </h3>
          {filter !== 'ALL' && (
            <button onClick={() => setFilter('ALL')} className="text-xs text-amber-600 font-bold hover:underline">Clear Filter</button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Action ID</th>
                <th className="px-4 py-2.5">Violation</th>
                <th className="px-4 py-2.5">Mine</th>
                <th className="px-4 py-2.5">Assigned To</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Deadline</th>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredActions.map(a => (
                <tr key={a.actionId} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5 font-mono font-bold text-gray-700">{a.actionId}</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/violations/${a.violationId}`} className="text-amber-600 font-bold hover:underline">
                      {a.violationId}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{a.mineId}</td>
                  <td className="px-4 py-2.5 text-gray-700 font-semibold max-w-32 truncate">{a.assignedTo}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[a.status] || 'bg-gray-100'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-gray-700">{a.deadline?.split('T')[0]}</td>
                  <td className="px-4 py-2.5"><CountdownBadge deadline={a.deadline} /></td>
                  <td className="px-4 py-2.5">
                    <Link to={`/corrective-actions`} className="text-amber-600 hover:underline font-bold flex items-center gap-0.5">
                      View <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredActions.length === 0 && (
                <tr><td colSpan={8} className="text-center py-6 text-gray-400">No actions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkflowsPage;
