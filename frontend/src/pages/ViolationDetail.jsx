import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, AlertTriangle, Cpu, CheckCircle2, Clock, User,
  MapPin, Calendar, FileText, ChevronRight, ShieldAlert, Plus, Loader2
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const map = {
    OPEN:         'bg-red-100 text-red-800 border-red-200',
    ASSIGNED:     'bg-blue-100 text-blue-800 border-blue-200',
    IN_PROGRESS:  'bg-amber-100 text-amber-800 border-amber-200',
    SUBMITTED:    'bg-purple-100 text-purple-800 border-purple-200',
    VERIFICATION: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    CLOSED:       'bg-emerald-100 text-emerald-800 border-emerald-200',
    ESCALATED:    'bg-orange-100 text-orange-800 border-orange-200',
    REWORK:       'bg-rose-100 text-rose-800 border-rose-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

const ViolationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [violation, setViolation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Corrective Action form
  const [showCAForm, setShowCAForm] = useState(false);
  const [caForm, setCAForm] = useState({
    assignedTo: 'Vikram Heavy Infra (Contractor)',
    description: '',
    deadline: '',
  });
  const [caSubmitting, setCASubmitting] = useState(false);
  const [caSuccess, setCASuccess] = useState(false);

  const canCreateCA = ['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'].includes(user?.role);

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

  const submitCorrectiveAction = async (e) => {
    e.preventDefault();
    if (!caForm.description.trim() || !caForm.deadline) return;
    setCASubmitting(true);
    try {
      await API.post('/corrective-actions', {
        violationId: id,
        mineId: violation.mineId,
        assignedTo: caForm.assignedTo,
        description: caForm.description,
        deadline: new Date(caForm.deadline).toISOString(),
      });
      setCASuccess(true);
      setShowCAForm(false);
      await fetchViolation(); // refresh to show updated status
    } catch (e) {
      console.error(e);
      alert('Failed to create corrective action. Please try again.');
    } finally {
      setCASubmitting(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await API.put(`/violations/${id}`, { status: newStatus });
      await fetchViolation();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading violation details...</div>;
  if (!violation) return <div className="p-8 text-center text-red-500 font-bold">Violation not found.</div>;

  const riskBg = violation.riskLevel === 'CRITICAL' ? 'bg-red-600' :
    violation.riskLevel === 'HIGH' ? 'bg-orange-600' :
    violation.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-600';

  const ai = violation.aiAnalysis || violation.investigationSummary?.reason;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-200 transition">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">{violation.violationId}</h1>
            <p className="text-xs text-gray-500">Violation Record — Full Compliance Detail</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {user?.role !== 'CONTRACTOR' && (
            <Link
              to={`/ai-investigation/${id}`}
              className="flex items-center space-x-1.5 bg-[#252525] hover:bg-gray-700 text-white text-xs font-bold px-3 py-2 rounded shadow transition"
            >
              <Cpu className="w-4 h-4 text-[#F47C20]" />
              <span>AI Investigation</span>
            </Link>
          )}
        </div>
      </div>

      {/* Risk Banner */}
      <div className={`${riskBg} text-white rounded-lg p-4 flex items-center justify-between`}>
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-8 h-8" />
          <div>
            <p className="font-extrabold text-lg">{violation.title}</p>
            <p className="text-white/80 text-xs">{violation.category} • {violation.severity} Severity • {violation.regulation}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black">{violation.riskScore || '—'}</p>
          <p className="text-white/80 text-xs font-bold">Risk Score / 100</p>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: Core Details */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Violation Details</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Status</span>
                <StatusBadge status={violation.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold flex items-center gap-1"><MapPin className="w-3 h-3"/>Mine</span>
                <span className="font-bold text-gray-800">{violation.mineId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Category</span>
                <span className="font-bold text-gray-800">{violation.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold">Inspection Ref</span>
                <Link to={`/inspections/${violation.inspectionId}`} className="font-bold text-amber-600 hover:underline">
                  {violation.inspectionId || 'N/A'}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold flex items-center gap-1"><Calendar className="w-3 h-3"/>Detected</span>
                <span className="font-bold text-gray-800">{violation.detectedDate?.split('T')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/>Due Date</span>
                <span className="font-bold text-red-600">{violation.dueDate?.split('T')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-semibold flex items-center gap-1"><User className="w-3 h-3"/>Assigned To</span>
                <span className="font-bold text-gray-800">{violation.assignedTo || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />Description
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed">{violation.description}</p>
          </div>

          {/* GPS */}
          {violation.gpsLocation && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />GPS Location
              </h3>
              <p className="text-xs text-gray-600 font-mono">
                Lat: {violation.gpsLocation.lat?.toFixed(5)} / Lng: {violation.gpsLocation.lng?.toFixed(5)}
              </p>
            </div>
          )}
        </div>

        {/* Right: AI Analysis + Actions */}
        <div className="space-y-4">
          {/* AI Risk Analysis */}
          <div className="bg-[#252525] border border-gray-700 rounded-lg shadow-sm p-4 text-white">
            <h3 className="text-xs font-extrabold text-[#F47C20] uppercase tracking-wider mb-3 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" />AI Risk Analysis
            </h3>
            {ai ? (
              <div className="space-y-2 text-xs">
                {ai.finding && <p className="text-gray-200 font-semibold">{ai.finding}</p>}
                {ai.riskFactors && (
                  <div>
                    <p className="text-gray-400 font-bold uppercase text-[10px] mb-1">Risk Factors</p>
                    {(ai.riskFactors || []).map((f, i) => (
                      <div key={i} className="flex items-start space-x-1.5 py-0.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-gray-300">{f}</span>
                      </div>
                    ))}
                  </div>
                )}
                {ai.recommendation && (
                  <div className="bg-gray-800 rounded p-2.5 border-l-2 border-[#F47C20]">
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Recommendation</p>
                    <p className="text-white font-semibold mt-0.5">{ai.recommendation}</p>
                  </div>
                )}
                {ai.confidence && (
                  <p className="text-emerald-400 font-bold">Confidence: {ai.confidence}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-xs mb-3">No AI analysis yet</p>
                <Link to={`/ai-investigation/${id}`} className="bg-[#F47C20] text-slate-950 font-bold text-xs px-3 py-1.5 rounded">
                  Run Investigation
                </Link>
              </div>
            )}
          </div>

          {/* Status Actions — Mine Manager and Corporate Admin only */}
          {['MINE_MANAGER', 'CORPORATE_ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Update Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {['OPEN', 'CLOSED'].map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={updatingStatus || violation.status === s}
                  className={`text-xs font-bold py-2 px-3 rounded border transition ${
                    violation.status === s
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Evidence Photos */}
          {violation.evidence && violation.evidence.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">Evidence Files</h3>
              <div className="space-y-1">
                {violation.evidence.map((e, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs text-gray-600">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-mono truncate">{e}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Corrective Action */}
          {canCreateCA && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-[#F47C20]" />Assign Corrective Action
              </h3>

              {caSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Corrective action assigned successfully!</span>
                </div>
              )}

              {!showCAForm ? (
                <button
                  onClick={() => setShowCAForm(true)}
                  className="w-full bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-extrabold text-xs py-2.5 rounded transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Corrective Action
                </button>
              ) : (
                <form onSubmit={submitCorrectiveAction} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Assign To</label>
                    <select
                      value={caForm.assignedTo}
                      onChange={e => setCAForm(f => ({ ...f, assignedTo: e.target.value }))}
                      className="w-full text-xs border border-gray-300 rounded px-2.5 py-2 focus:ring-2 focus:ring-amber-400"
                    >
                      <option>Vikram Heavy Infra (Contractor)</option>
                      <option>Mine Safety Officer</option>
                      <option>Zone B Supervisor</option>
                      <option>Environmental Officer</option>
                      <option>Labour Welfare Officer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={caForm.description}
                      onChange={e => setCAForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe the corrective action required..."
                      className="w-full text-xs border border-gray-300 rounded px-2.5 py-2 focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Deadline</label>
                    <input
                      type="date"
                      required
                      value={caForm.deadline}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setCAForm(f => ({ ...f, deadline: e.target.value }))}
                      className="w-full text-xs border border-gray-300 rounded px-2.5 py-2 focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={caSubmitting}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-extrabold text-xs py-2 rounded transition disabled:opacity-50">
                      {caSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>{caSubmitting ? 'Assigning...' : 'Assign'}</span>
                    </button>
                    <button type="button" onClick={() => setShowCAForm(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2 rounded transition">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default ViolationDetail;
