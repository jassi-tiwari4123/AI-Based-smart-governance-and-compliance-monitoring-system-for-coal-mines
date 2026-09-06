import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { GitPullRequest, AlertTriangle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const WorkflowsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await API.get('/workflows');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    try {
      await API.post('/workflows/evaluate');
      fetchWorkflows();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Workflow Escalations Engine...</div>;

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">Workflow Engine & Escalations</h1>
          <p className="text-xs text-gray-600">Automated Reminder Dispatch, Overdue Tracking & Hierarchy Escalations</p>
        </div>
        <button
          onClick={handleRunEvaluation}
          className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs px-3.5 py-2 rounded shadow transition"
        >
          Evaluate Escalation Rules Now
        </button>
      </div>

      <div className="bg-white border border-gray-300 rounded-md shadow-sm p-4">
        <h3 className="text-xs font-extrabold text-gray-900 uppercase mb-3 flex items-center space-x-2">
          <GitPullRequest className="w-4 h-4 text-red-600" />
          <span>Active Overdue & Escalated Corrective Actions ({data?.totalEscalated || 0})</span>
        </h3>

        <div className="space-y-3 text-xs">
          {data?.activeEscalations?.length === 0 ? (
            <div className="p-4 text-center text-gray-500 font-semibold">No active escalations present. All workflows within statutory SLA.</div>
          ) : (
            data?.activeEscalations?.map((esc) => (
              <div key={esc.actionId} className="p-3 bg-red-50 border border-red-200 rounded flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-red-900">{esc.actionId}</span>
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">{esc.status}</span>
                  </div>
                  <p className="text-red-800 font-medium mt-1">{esc.description}</p>
                  <span className="text-[10px] text-gray-500 block mt-1">Escalation Threshold Passed • Target: {esc.escalatedLevel || 'Mine Manager'}</span>
                </div>
                <Link
                  to={`/corrective-actions`}
                  className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-3 py-1.5 rounded transition"
                >
                  Manage Action
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowsPage;
