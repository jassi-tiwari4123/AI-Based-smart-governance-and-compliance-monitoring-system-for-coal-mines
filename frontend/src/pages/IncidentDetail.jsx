import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Flame, MapPin, Calendar, User, MessageSquare,
  CheckCircle2, AlertTriangle, Loader2, ChevronRight, Clock
} from 'lucide-react';

const STATUS_STYLES = {
  REPORTED:     'bg-blue-100 text-blue-800 border-blue-200',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  RESOLVED:     'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const SEVERITY_BG = {
  CRITICAL: 'bg-red-600',
  MAJOR:    'bg-amber-500',
  MINOR:    'bg-emerald-500',
};

const QUERY_TYPE_STYLES = {
  QUERY:      'bg-blue-50 border-blue-200 text-blue-700',
  ESCALATION: 'bg-red-50 border-red-200 text-red-700',
  NOTE:       'bg-gray-50 border-gray-200 text-gray-700',
  REPLY:      'bg-emerald-50 border-emerald-200 text-emerald-700',
};

const IncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [queryMsg, setQueryMsg] = useState('');
  const [queryType, setQueryType] = useState('QUERY');
  const [submittingQuery, setSubmittingQuery] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [replyMsg, setReplyMsg] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const canManage  = ['MINE_MANAGER', 'CORPORATE_ADMIN', 'REGULATOR', 'SUPER_ADMIN'].includes(user?.role);
  const canReply   = user?.role === 'INSPECTOR';

  const fetchIncident = async () => {
    try {
      const res = await API.get(`/incidents/${id}`);
      setIncident(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncident(); }, [id]);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!queryMsg.trim()) return;
    setSubmittingQuery(true);
    setError('');
    try {
      await API.post(`/incidents/${id}/query`, { message: queryMsg, queryType });
      setQueryMsg('');
      setSuccess('Query raised successfully. Inspector has been notified.');
      setTimeout(() => setSuccess(''), 4000);
      fetchIncident();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to raise query.');
    } finally {
      setSubmittingQuery(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    setError('');
    try {
      await API.put(`/incidents/${id}`, { status: 'RESOLVED' });
      setSuccess('Incident marked as Resolved.');
      setTimeout(() => setSuccess(''), 4000);
      fetchIncident();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resolve incident.');
    } finally {
      setResolving(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMsg.trim()) return;
    setSubmittingReply(true);
    setError('');
    try {
      await API.post(`/incidents/${id}/reply`, { message: replyMsg, queryType: 'REPLY' });
      setReplyMsg('');
      setSuccess('Reply posted. Mine Manager has been notified.');
      setTimeout(() => setSuccess(''), 4000);
      fetchIncident();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading incident...</div>;
  if (!incident) return <div className="p-8 text-center text-red-500 font-bold text-sm">Incident not found.</div>;

  const queries = incident.queries || [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-200 transition">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">{incident.incidentId}</h1>
            <p className="text-xs text-gray-500">Incident Record — Full Detail</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${STATUS_STYLES[incident.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {incident.status}
        </span>
      </div>

      {/* Severity banner */}
      <div className={`${SEVERITY_BG[incident.severity] || 'bg-gray-600'} text-white rounded-lg p-4 flex items-center justify-between`}>
        <div className="flex items-center space-x-3">
          <Flame className="w-8 h-8 opacity-80" />
          <div>
            <p className="font-extrabold text-lg">{incident.category} Incident</p>
            <p className="text-white/80 text-xs">{incident.severity} Severity • {incident.mineId} • {incident.zone}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/70 font-bold uppercase">Reported</p>
          <p className="font-extrabold text-sm">{incident.reportedAt?.split('T')[0]}</p>
        </div>
      </div>

      {/* Feedback banners */}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs font-semibold text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Left column */}
        <div className="space-y-4">

          {/* Core details */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Incident Details</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Mine',        value: incident.mineId,                   icon: MapPin },
                { label: 'Zone',        value: incident.zone,                     icon: MapPin },
                { label: 'Category',    value: incident.category,                 icon: Flame },
                { label: 'Severity',    value: incident.severity,                 icon: AlertTriangle },
                { label: 'Reported By', value: incident.reportedBy || '—',        icon: User },
                { label: 'Reported At', value: incident.reportedAt?.split('T')[0], icon: Calendar },
                ...(incident.resolvedBy ? [
                  { label: 'Resolved By', value: incident.resolvedBy, icon: CheckCircle2 },
                  { label: 'Resolved At', value: incident.resolvedAt?.split('T')[0], icon: Calendar },
                ] : []),
              ].map((row, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-500 font-semibold flex items-center gap-1">
                    <row.icon className="w-3 h-3" />{row.label}
                  </span>
                  <span className="font-bold text-gray-800">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-xs text-gray-700 leading-relaxed">{incident.description}</p>
          </div>

          {/* GPS */}
          {incident.gpsLocation && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />GPS Location
              </h3>
              <p className="text-xs text-gray-600 font-mono">
                Lat: {incident.gpsLocation.lat?.toFixed(5)} / Lng: {incident.gpsLocation.lng?.toFixed(5)}
              </p>
            </div>
          )}

          {/* Resolve button — Mine Manager only, not already resolved */}
          {canManage && incident.status !== 'RESOLVED' && (
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3 rounded-lg shadow transition"
            >
              {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{resolving ? 'Resolving...' : 'Mark as Resolved'}</span>
            </button>
          )}
        </div>

        {/* Right column — Query thread */}
        <div className="space-y-4">

          {/* Raise a query — Mine Manager only */}
          {canManage && incident.status !== 'RESOLVED' && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#F47C20]" />Raise a Query
              </h3>
              <form onSubmit={handleQuery} className="space-y-3">
                {/* Query type */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'QUERY',      label: '❓ Query',      desc: 'Ask for more info' },
                    { v: 'ESCALATION', label: '🚨 Escalate',   desc: 'Escalate to DGMS' },
                    { v: 'NOTE',       label: '📝 Note',        desc: 'Add a remark' },
                  ].map(opt => (
                    <button key={opt.v} type="button"
                      onClick={() => setQueryType(opt.v)}
                      className={`border-2 rounded-lg p-2 text-center transition ${
                        queryType === opt.v
                          ? 'border-[#F47C20] bg-amber-50'
                          : 'border-gray-200 hover:border-amber-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <p className="text-xs font-extrabold text-gray-800">{opt.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  rows={3}
                  value={queryMsg}
                  onChange={e => setQueryMsg(e.target.value)}
                  placeholder={
                    queryType === 'QUERY'      ? 'What additional information do you need from the Inspector?' :
                    queryType === 'ESCALATION' ? 'Describe why this incident requires escalation to DGMS...' :
                    'Add a note or observation about this incident...'
                  }
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
                />
                <button
                  type="submit"
                  disabled={submittingQuery || !queryMsg.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#F47C20] hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs py-2.5 rounded-lg transition"
                >
                  {submittingQuery ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  <span>{submittingQuery ? 'Submitting...' : 'Submit Query'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Query thread */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#F47C20]" />Query Thread
              </h3>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                {queries.length} {queries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {queries.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400">No queries raised yet</p>
                {canManage && incident.status !== 'RESOLVED' && (
                  <p className="text-[10px] text-gray-400 mt-1">Use the form above to raise a query</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {queries.map((q, i) => (
                  <div key={i} className={`p-4 border-l-4 ${
                    q.queryType === 'ESCALATION' ? 'border-l-red-500' :
                    q.queryType === 'REPLY'      ? 'border-l-emerald-500 bg-emerald-50/30' :
                    q.queryType === 'NOTE'       ? 'border-l-gray-400' : 'border-l-[#F47C20]'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${QUERY_TYPE_STYLES[q.queryType] || QUERY_TYPE_STYLES.NOTE}`}>
                          {q.queryType}
                        </span>
                        <span className="text-xs font-bold text-gray-700">{q.raisedBy}</span>
                        <span className="text-[10px] text-gray-400">{q.raisedByRole}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{q.raisedAt?.split('T')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{q.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inspector reply form — shown when there are open queries */}
          {canReply && queries.length > 0 && incident.status !== 'RESOLVED' && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />Reply to Query
              </h3>
              <form onSubmit={handleReply} className="space-y-3">
                <textarea
                  required rows={3}
                  value={replyMsg}
                  onChange={e => setReplyMsg(e.target.value)}
                  placeholder="Provide additional details or answer the Mine Manager's query..."
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 resize-none"
                />
                <button type="submit" disabled={submittingReply || !replyMsg.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 rounded-lg transition">
                  {submittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  <span>{submittingReply ? 'Posting...' : 'Post Reply'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Inspector — no queries yet */}
          {canReply && queries.length === 0 && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 text-center py-6">
              <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-400">No queries from Mine Manager yet</p>
              <p className="text-[10px] text-gray-400 mt-1">You'll be notified when a query is raised</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
