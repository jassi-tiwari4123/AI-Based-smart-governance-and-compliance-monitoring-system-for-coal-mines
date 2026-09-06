import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileCheck, Clock, CheckCircle2, AlertTriangle, Upload, ShieldCheck, Check, X } from 'lucide-react';

const CorrectiveActionsPage = () => {
  const { user } = useAuth();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const [evidenceNotes, setEvidenceNotes] = useState('Safety equipment delivered to Zone B pit workers. Compliance photos attached.');
  const [verifyNotes, setVerifyNotes] = useState('Verified compliant on-site inspection. Non-compliance resolved.');

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const res = await API.get('/corrective-actions');
      setActions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!selectedAction) return;
    try {
      await API.put(`/corrective-actions/${selectedAction.actionId}/submit-evidence`, {
        submittedEvidence: ['/uploads/rectification_proof_sample.jpg'],
        notes: evidenceNotes
      });
      setShowSubmitModal(false);
      fetchActions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (approved) => {
    if (!selectedAction) return;
    try {
      await API.put(`/corrective-actions/${selectedAction.actionId}/verify`, {
        approved,
        verificationNotes: verifyNotes
      });
      setShowVerifyModal(false);
      fetchActions();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Corrective Actions Management...</div>;

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">Corrective Actions & Verification Workflow</h1>
          <p className="text-xs text-gray-600">Track Assigned Tasks, Evidence Submissions & Mine Manager Sign-Offs</p>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#252525] text-white uppercase tracking-wider font-bold text-[10px]">
            <tr>
              <th className="py-3 px-4">Action ID</th>
              <th className="py-3 px-4">Violation ID</th>
              <th className="py-3 px-4">Assigned Entity</th>
              <th className="py-3 px-4">Instructions</th>
              <th className="py-3 px-4">Deadline</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Workflow Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-medium">
            {actions.map((act) => (
              <tr key={act.actionId} className="hover:bg-gray-50 transition">
                <td className="py-3 px-4 font-mono font-bold text-gray-900">{act.actionId}</td>
                <td className="py-3 px-4 font-bold text-amber-600">{act.violationId}</td>
                <td className="py-3 px-4 text-gray-800 font-semibold">{act.assignedTo}</td>
                <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{act.description}</td>
                <td className="py-3 px-4 text-gray-500 font-mono">{act.deadline?.split('T')[0]}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    act.status === 'VERIFIED' || act.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' :
                    act.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                    act.status === 'ESCALATED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {act.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-2">
                  {act.status === 'ASSIGNED' || act.status === 'IN_PROGRESS' ? (
                    <button
                      onClick={() => {
                        setSelectedAction(act);
                        setShowSubmitModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1 rounded transition inline-flex items-center space-x-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Submit Evidence</span>
                    </button>
                  ) : null}

                  {act.status === 'SUBMITTED' ? (
                    <button
                      onClick={() => {
                        setSelectedAction(act);
                        setShowVerifyModal(true);
                      }}
                      className="bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded transition inline-flex items-center space-x-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Evidence</span>
                    </button>
                  ) : null}

                  {act.status === 'VERIFIED' ? (
                    <span className="text-emerald-700 font-bold text-[11px]">✓ Closed & Verified</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contractor Submit Evidence Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-extrabold uppercase text-gray-900 border-b pb-2">
              Submit Corrective Action Evidence ({selectedAction?.actionId})
            </h3>
            <form onSubmit={handleSubmitEvidence} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Upload Photo / Evidence Document</label>
                <div className="border-2 border-dashed border-gray-300 p-4 rounded text-center bg-gray-50">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <span className="text-gray-600 font-bold block">rectification_proof_zone_b.jpg</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-1">✓ Digital Photo Stamp Attached</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Contractor Notes</label>
                <textarea
                  rows="3"
                  value={evidenceNotes}
                  onChange={(e) => setEvidenceNotes(e.target.value)}
                  className="w-full p-2 border rounded font-medium"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-3 py-1.5 text-gray-600 font-bold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mine Manager Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-extrabold uppercase text-gray-900 border-b pb-2">
              Verify Evidence & Close Violation ({selectedAction?.actionId})
            </h3>
            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 p-3 rounded border border-amber-200">
                <span className="font-bold text-amber-900 block mb-1">Submitted Contractor Notes:</span>
                <p className="text-amber-800">{selectedAction?.contractorNotes || evidenceNotes}</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Manager Verification Notes</label>
                <textarea
                  rows="3"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full p-2 border rounded font-medium"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => handleVerify(false)}
                  className="px-3 py-2 bg-red-600 text-white font-bold text-xs rounded hover:bg-red-700 flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Request Rework</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify(true)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded hover:bg-emerald-700 flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Close Violation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectiveActionsPage;
