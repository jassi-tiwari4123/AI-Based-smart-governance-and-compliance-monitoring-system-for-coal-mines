import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Smartphone, MapPin, Camera, Upload, CheckCircle2, AlertTriangle,
  Loader2, ChevronRight, ArrowLeft, Shield, Flame, ClipboardCheck,
  Sparkles, X, RefreshCw, ChevronDown, ChevronUp, Info
} from 'lucide-react';

const INSPECTION_CATEGORIES = ['SAFETY', 'ENVIRONMENT', 'PRODUCTION', 'LABOUR'];
const INCIDENT_CATEGORIES = [
  { value: 'SAFETY',      label: '🦺 Safety',      desc: 'PPE, fall, entrapment, explosion' },
  { value: 'ENVIRONMENT', label: '🌿 Environment',  desc: 'Dust, water, air quality' },
  { value: 'EQUIPMENT',   label: '⚙️ Equipment',    desc: 'Machinery failure, breakdown' },
  { value: 'LABOUR',      label: '👷 Labour',       desc: 'Injury, fatigue, dispute' },
  { value: 'FIRE',        label: '🔥 Fire / Gas',   desc: 'Fire outbreak, gas leak' },
  { value: 'STRUCTURAL',  label: '🏗️ Structural',  desc: 'Roof fall, ground collapse' },
];
const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Pit #1', 'Pit #2', 'Pit #3', 'Haulage Corridor', 'Washery Area', 'Stockpile #1', 'Stockpile #2', 'Office Block'];
const CHECKLIST_ITEMS = ['PPE Compliance', 'Ventilation Check', 'Haul Road Sprinklers', 'Fire Safety Equipment', 'Emergency Exits Clear', 'Machinery Inspection Tags'];

const MODES = [
  { value: 'inspection', label: 'Inspection', icon: ClipboardCheck, desc: 'Statutory compliance report' },
  { value: 'incident',   label: 'Incident',   icon: Flame,          desc: 'Safety / operational incident' },
  { value: 'both',       label: 'Both',        icon: Shield,         desc: 'Inspection + incident together' },
];

const SEVERITY_OPTIONS = [
  { v: 'MINOR',    color: 'border-emerald-300 bg-emerald-50 text-emerald-700', active: 'border-emerald-600 bg-emerald-100', label: '🟢 Minor',    desc: 'Low risk, correctable' },
  { v: 'MAJOR',    color: 'border-amber-300 bg-amber-50 text-amber-700',       active: 'border-amber-600 bg-amber-100',    label: '🟡 Major',    desc: 'Significant concern' },
  { v: 'CRITICAL', color: 'border-red-300 bg-red-50 text-red-700',             active: 'border-red-600 bg-red-100',        label: '🔴 Critical', desc: 'Immediate action needed' },
];

// ── AI Suggestion Review Panel ───────────────────────────────────────────────
const SeverityBadge = ({ v }) => {
  const map = { MINOR: 'bg-emerald-100 text-emerald-700', MAJOR: 'bg-amber-100 text-amber-700', CRITICAL: 'bg-red-100 text-red-700' };
  return <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${map[v] || 'bg-gray-100 text-gray-600'}`}>{v}</span>;
};

const AISuggestionPanel = ({ suggestion, onApply, onDismiss }) => {
  // Local editable copies so the inspector can tweak before applying
  const [severity,  setSeverity]  = useState(suggestion.severity);
  const [category,  setCategory]  = useState(suggestion.category);
  const [checklist, setChecklist] = useState(suggestion.checklist.map(c => ({ ...c })));
  const [expanded,  setExpanded]  = useState(false);

  const toggleItem = (idx) => {
    setChecklist(prev => prev.map((c, i) =>
      i === idx ? { ...c, suggestedStatus: c.suggestedStatus === 'PASS' ? 'FAIL' : 'PASS' } : c
    ));
  };

  const handleApply = () => {
    onApply({ severity, category, checklist });
  };

  const sevColor = { MINOR: 'border-emerald-400', MAJOR: 'border-amber-400', CRITICAL: 'border-red-500' };

  return (
    <div className={`bg-white border-2 ${sevColor[severity] || 'border-blue-400'} rounded-xl shadow-lg p-4 space-y-4`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-extrabold text-gray-800">AI Suggestion — Review &amp; Edit</span>
          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
            {suggestion.confidence}
          </span>
        </div>
        <button type="button" onClick={onDismiss} className="p-1 rounded hover:bg-gray-100">
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* AI Summary */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 flex gap-2 items-start">
        <Info className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-purple-800 leading-snug">{suggestion.summary}</p>
      </div>

      {/* Severity selector */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Suggested Severity</p>
        <div className="grid grid-cols-3 gap-2">
          {SEVERITY_OPTIONS.map(opt => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setSeverity(opt.v)}
              className={`border-2 rounded-lg p-2.5 text-center transition ${
                severity === opt.v ? opt.active + ' shadow-sm' : opt.color + ' opacity-60 hover:opacity-90'
              }`}
            >
              <p className="text-[11px] font-extrabold">{opt.label}</p>
              <p className="text-[10px] mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3" />{suggestion.severityReason}
        </p>
      </div>

      {/* Category selector */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Suggested Category</p>
        <div className="grid grid-cols-2 gap-2">
          {INSPECTION_CATEGORIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`border-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                category === c
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500 hover:border-blue-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3" />{suggestion.categoryReason}
        </p>
      </div>

      {/* Checklist */}
      <div>
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5 hover:text-gray-700"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Compliance Checklist ({checklist.filter(c => c.suggestedStatus === 'FAIL').length} flagged)
        </button>

        {expanded && (
          <div className="space-y-1.5">
            {checklist.map((item, idx) => (
              <div
                key={idx}
                onClick={() => toggleItem(idx)}
                className={`flex items-start justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                  item.suggestedStatus === 'PASS'
                    ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-red-50 border-red-200 hover:bg-red-100'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-semibold text-gray-700">{item.item}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{item.reason}</p>
                </div>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded flex-shrink-0 ${
                  item.suggestedStatus === 'PASS'
                    ? 'bg-emerald-200 text-emerald-800'
                    : 'bg-red-200 text-red-800'
                }`}>
                  {item.suggestedStatus}
                </span>
              </div>
            ))}
            <p className="text-[10px] text-gray-400 mt-1">Tap to toggle PASS / FAIL</p>
          </div>
        )}
        {!expanded && (
          <div className="flex flex-wrap gap-1.5">
            {checklist.map((item, idx) => (
              <span
                key={idx}
                onClick={() => { setExpanded(true); }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                  item.suggestedStatus === 'PASS'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {item.item.split(' ')[0]} {item.suggestedStatus === 'FAIL' ? '✗' : '✓'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 border border-gray-300 text-gray-600 font-bold text-xs py-2.5 rounded-lg hover:bg-gray-50 transition"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-2 flex-grow bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-2.5 rounded-lg shadow transition flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Apply &amp; Continue
        </button>
      </div>
    </div>
  );
};

// ── AI Incident Suggestion Panel ────────────────────────────────────────────
const AIIncidentSuggestionPanel = ({ suggestion, onApply, onDismiss }) => {
  const [severity, setSeverity] = useState(suggestion.severity);
  const [category, setCategory] = useState(suggestion.category);

  const handleApply = () => onApply({ severity, category });

  const sevColor = { MINOR: 'border-emerald-400', MAJOR: 'border-amber-400', CRITICAL: 'border-red-500' };

  return (
    <div className={`bg-white border-2 ${sevColor[severity] || 'border-orange-400'} rounded-xl shadow-lg p-4 space-y-4`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-extrabold text-gray-800">AI Suggestion — Review &amp; Edit</span>
          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
            {suggestion.confidence}
          </span>
        </div>
        <button type="button" onClick={onDismiss} className="p-1 rounded hover:bg-gray-100">
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Summary */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 flex gap-2 items-start">
        <Info className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-purple-800 leading-snug">{suggestion.summary}</p>
      </div>

      {/* Severity */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Suggested Severity</p>
        <div className="grid grid-cols-3 gap-2">
          {SEVERITY_OPTIONS.map(opt => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setSeverity(opt.v)}
              className={`border-2 rounded-lg p-2.5 text-center transition ${
                severity === opt.v ? opt.active + ' shadow-sm' : opt.color + ' opacity-60 hover:opacity-90'
              }`}
            >
              <p className="text-[11px] font-extrabold">{opt.label}</p>
              <p className="text-[10px] mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3" />{suggestion.severityReason}
        </p>
      </div>

      {/* Incident Category */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">Suggested Category</p>
        <div className="grid grid-cols-2 gap-2">
          {INCIDENT_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`border-2 rounded-lg p-2.5 text-left transition ${
                category === cat.value
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              <p className="text-xs font-extrabold text-gray-800">{cat.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{cat.desc}</p>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
          <Info className="w-3 h-3" />{suggestion.categoryReason}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 border border-gray-300 text-gray-600 font-bold text-xs py-2.5 rounded-lg hover:bg-gray-50 transition"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-grow bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs py-2.5 rounded-lg shadow transition flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Apply &amp; Continue
        </button>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const CreateInspection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [mines, setMines] = useState([]);

  useEffect(() => {
    API.get('/mines').then(r => {
      const list = r.data || [];
      setMines(list);
      const defaultMine = list.find(m => m.mineId === user?.mineId) || list[0];
      if (defaultMine) {
        setShared(s => ({ ...s, mineId: defaultMine.mineId }));
      }
    }).catch(console.error);
  }, []);

  const [mode, setMode] = useState('inspection');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // AI suggestion state — inspection
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiApplied,    setAiApplied]    = useState(false);
  const [aiError,      setAiError]      = useState('');

  // AI suggestion state — incident
  const [incAiLoading,    setIncAiLoading]    = useState(false);
  const [incAiSuggestion, setIncAiSuggestion] = useState(null);
  const [incAiApplied,    setIncAiApplied]    = useState(false);
  const [incAiError,      setIncAiError]      = useState('');

  // Shared fields
  const [shared, setShared] = useState({
    mineId: user?.mineId || '',
    zone: 'Zone B',
    gpsLocation: null,
    severity: 'MAJOR',
    photos: [],
  });

  // Inspection-specific fields
  const [inspForm, setInspForm] = useState({
    category: 'SAFETY',
    observations: '',
    checklist: CHECKLIST_ITEMS.map(item => ({ item, status: 'PASS' })),
    status: 'SUBMITTED',
  });

  // Incident-specific fields
  const [incForm, setIncForm] = useState({
    category: 'SAFETY',
    description: '',
    status: 'REPORTED',
  });

  const showInspection = mode === 'inspection' || mode === 'both';
  const showIncident   = mode === 'incident'   || mode === 'both';

  // ── GPS ──────────────────────────────────────────────────────────────────
  const captureGPS = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setShared(s => ({ ...s, gpsLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude } }));
          setGpsLoading(false);
        },
        () => {
          setShared(s => ({ ...s, gpsLocation: { lat: 20.9517, lng: 85.0985 } }));
          setGpsLoading(false);
        }
      );
    } else {
      setShared(s => ({ ...s, gpsLocation: { lat: 20.9517, lng: 85.0985 } }));
      setGpsLoading(false);
    }
  };

  // ── Checklist toggle ─────────────────────────────────────────────────────
  const toggleChecklist = (idx) => {
    setInspForm(f => {
      const newList = [...f.checklist];
      newList[idx] = { ...newList[idx], status: newList[idx].status === 'PASS' ? 'FAIL' : 'PASS' };
      return { ...f, checklist: newList };
    });
  };

  // ── AI Suggestion ────────────────────────────────────────────────────────
  const requestAiSuggestion = async () => {
    if (inspForm.observations.trim().length < 10) return;
    setAiLoading(true);
    setAiError('');
    setAiSuggestion(null);
    setAiApplied(false);
    try {
      const res = await API.post('/ai/suggest-inspection', { observation: inspForm.observations.trim() });
      setAiSuggestion(res.data);
    } catch (err) {
      setAiError('AI analysis failed. You can still fill the fields manually.');
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = ({ severity, category, checklist }) => {
    setShared(s => ({ ...s, severity }));
    setInspForm(f => ({
      ...f,
      category,
      checklist: checklist.map(c => ({ item: c.item, status: c.suggestedStatus })),
    }));
    setAiSuggestion(null);
    setAiApplied(true);
  };

  const dismissAiSuggestion = () => setAiSuggestion(null);

  // ── Incident AI handlers ─────────────────────────────────────────────────
  const requestIncAiSuggestion = async () => {
    if (incForm.description.trim().length < 10) return;
    setIncAiLoading(true);
    setIncAiError('');
    setIncAiSuggestion(null);
    setIncAiApplied(false);
    try {
      const res = await API.post('/ai/suggest-incident', { description: incForm.description.trim() });
      setIncAiSuggestion(res.data);
    } catch (err) {
      setIncAiError('AI analysis failed. You can still fill the fields manually.');
      console.error(err);
    } finally {
      setIncAiLoading(false);
    }
  };

  const applyIncAiSuggestion = ({ severity, category }) => {
    setShared(s => ({ ...s, severity }));
    setIncForm(f => ({ ...f, category }));
    setIncAiSuggestion(null);
    setIncAiApplied(true);
  };

  const dismissIncAiSuggestion = () => setIncAiSuggestion(null);

  // ── Submit ───────────────────────────────────────────────────────────────
  const canSubmit = () => {
    if (showInspection && !inspForm.observations.trim()) return false;
    if (showIncident   && !incForm.description.trim())   return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit()) return;
    setSubmitting(true);

    const gps = shared.gpsLocation || { lat: 20.9517, lng: 85.0985 };
    const result = { inspection: null, incident: null };

    try {
      if (showInspection) {
        const inspPayload = {
          mineId: shared.mineId,
          zone: shared.zone,
          gpsLocation: gps,
          severity: shared.severity,
          photos: shared.photos,
          category: inspForm.category,
          observations: inspForm.observations,
          checklist: inspForm.checklist,
          status: inspForm.status,
          inspectionDate: new Date().toISOString(),
        };
        const insRes = await API.post('/inspections', inspPayload);
        result.inspection = insRes.data;
      }

      if (showIncident) {
        const incPayload = {
          mineId: shared.mineId,
          zone: shared.zone,
          gpsLocation: gps,
          severity: shared.severity,
          photos: shared.photos,
          category: incForm.category,
          description: incForm.description,
          status: incForm.status,
        };
        const incRes = await API.post('/incidents', incPayload);
        result.incident = incRes.data;
      }

      setSubmitted(result);
    } catch (err) {
      console.error(err);
      alert('Submission failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(null);
    setAiSuggestion(null);
    setAiApplied(false);
    setAiError('');
    setIncAiSuggestion(null);
    setIncAiApplied(false);
    setIncAiError('');
    setShared(s => ({ ...s, gpsLocation: null, photos: [] }));
    setInspForm(f => ({ ...f, observations: '', checklist: CHECKLIST_ITEMS.map(item => ({ item, status: 'PASS' })) }));
    setIncForm(f => ({ ...f, description: '' }));
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    const vio = submitted.inspection?.violationCreated;
    const ins = submitted.inspection?.inspection;
    const inc = submitted.incident;

    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-6 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-extrabold text-gray-900">Submitted Successfully</h2>

          {ins && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-blue-700 text-sm">Inspection Recorded</span>
              </div>
              <p className="text-xs text-gray-600">ID: <span className="font-bold text-gray-800">{ins.inspectionId}</span></p>
            </div>
          )}

          {vio && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="font-extrabold text-red-700 text-sm">Violation Auto-Detected!</span>
              </div>
              <p className="text-xs text-red-600 font-semibold">
                {vio.violationId} — Risk Score: <span className="font-extrabold">{vio.riskScore}/100 ({vio.riskLevel})</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">{vio.title}</p>
              {user?.role !== 'INSPECTOR' && (
                <button
                  onClick={() => navigate(`/ai-investigation/${vio.violationId}`)}
                  className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded transition"
                >
                  Launch AI Investigation →
                </button>
              )}
            </div>
          )}

          {inc && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-left">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-600" />
                <span className="font-extrabold text-orange-700 text-sm">Incident Reported</span>
              </div>
              <p className="text-xs text-gray-600">ID: <span className="font-bold text-gray-800">{inc.incidentId}</span></p>
              <p className="text-xs text-gray-500 mt-0.5">Mine Manager has been notified.</p>
              {inc.severity === 'CRITICAL' && (
                <p className="text-xs text-red-600 font-bold mt-1">⚠ Critical alert dispatched to DGMS.</p>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <button onClick={resetForm}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 rounded transition">
              New Report
            </button>
            {ins && (
              <button onClick={() => navigate(`/inspections/${ins.inspection?.inspectionId || ins.inspectionId}`)}
                className="flex-1 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs py-2.5 rounded transition">
                View Inspection
              </button>
            )}
            {inc && !ins && (
              <button onClick={() => navigate('/incidents/mine')}
                className="flex-1 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs py-2.5 rounded transition">
                My Incidents
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-200 transition">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#F47C20]" />
            Mobile Field Report
          </h1>
          <p className="text-xs text-gray-500">DGMS Statutory Compliance — Field Officer Form</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Mode selector ───────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Report Type</h3>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(m => {
              const Icon = m.icon;
              const isActive = mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`border-2 rounded-lg p-3 text-center transition ${
                    isActive
                      ? 'border-[#F47C20] bg-amber-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-amber-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-[#F47C20]' : 'text-gray-400'}`} />
                  <p className="text-xs font-extrabold text-gray-800">{m.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Shared: Location ────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Location</h3>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Mine / Colliery</label>
            {user?.mineId ? (
              <div className="w-full text-xs border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-gray-700 font-semibold">
                {mines.find(m => m.mineId === user.mineId)?.name || user.mineId}
                <span className="ml-2 text-gray-400 font-normal">({user.mineId})</span>
              </div>
            ) : (
              <select
                value={shared.mineId}
                onChange={e => setShared(s => ({ ...s, mineId: e.target.value }))}
                className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              >
                {mines.map(m => <option key={m.mineId} value={m.mineId}>{m.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Zone / Area</label>
            <select
              value={shared.zone}
              onChange={e => setShared(s => ({ ...s, zone: e.target.value }))}
              className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            >
              {ZONES.map(z => <option key={z}>{z}</option>)}
            </select>
          </div>
        </div>

        {/* ── Shared: GPS ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#F47C20]" />GPS Location
          </h3>
          {shared.gpsLocation ? (
            <div className="flex items-center justify-between">
              <div className="bg-emerald-50 border border-emerald-200 rounded px-3 py-2 text-xs font-mono text-emerald-700">
                📍 {shared.gpsLocation.lat.toFixed(5)}, {shared.gpsLocation.lng.toFixed(5)}
              </div>
              <button type="button" onClick={captureGPS} className="text-xs text-gray-500 hover:text-gray-700 underline">Re-capture</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={captureGPS}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center space-x-2 border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-lg py-3 text-xs font-semibold text-gray-500 hover:text-amber-600 transition"
            >
              {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              <span>{gpsLoading ? 'Getting location...' : 'Tap to capture GPS coordinates'}</span>
            </button>
          )}
        </div>

        {/* ── Inspection fields ────────────────────────────────────────────── */}
        {showInspection && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-xs font-extrabold text-blue-700 flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5" />Inspection Details
              </p>
            </div>

            {/* Field Observation — the AI trigger lives here */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">Field Observation</h3>
              <textarea
                required={showInspection}
                rows={4}
                value={inspForm.observations}
                onChange={e => {
                  setInspForm(f => ({ ...f, observations: e.target.value }));
                  // Clear stale suggestion/applied state when text changes significantly
                  if (aiApplied) setAiApplied(false);
                  if (aiSuggestion) setAiSuggestion(null);
                }}
                placeholder="Describe what you observed in detail. Include specific hazards, equipment conditions, worker behaviour, or environmental issues..."
                className="w-full text-xs border border-gray-300 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
              />

              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] text-gray-400">
                  {inspForm.observations.length} characters
                  {inspForm.observations.length < 10 && ' — write more for AI analysis'}
                </p>

                {/* AI Analyze button */}
                {inspForm.observations.trim().length >= 10 && !aiSuggestion && (
                  <button
                    type="button"
                    onClick={requestAiSuggestion}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition shadow-sm"
                  >
                    {aiLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing…</>
                      : <><Sparkles className="w-3.5 h-3.5" />Analyze with AI</>
                    }
                  </button>
                )}

                {/* Re-analyze button after suggestion was applied */}
                {aiApplied && !aiSuggestion && (
                  <button
                    type="button"
                    onClick={requestAiSuggestion}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-purple-600 hover:text-purple-800 font-bold text-[11px] transition"
                  >
                    <RefreshCw className="w-3 h-3" />Re-analyze
                  </button>
                )}
              </div>

              {/* AI error */}
              {aiError && (
                <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{aiError}
                </p>
              )}
            </div>

            {/* AI Suggestion Review Panel — injected between observation and checklist */}
            {aiSuggestion && (
              <AISuggestionPanel
                suggestion={aiSuggestion}
                onApply={applyAiSuggestion}
                onDismiss={dismissAiSuggestion}
              />
            )}

            {/* Applied confirmation banner */}
            {aiApplied && !aiSuggestion && (
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                <p className="text-[11px] text-purple-700 font-semibold">
                  AI suggestions applied. Review the fields below and adjust if needed before submitting.
                </p>
                <button
                  type="button"
                  onClick={() => setAiApplied(false)}
                  className="ml-auto p-0.5 rounded hover:bg-purple-100"
                >
                  <X className="w-3 h-3 text-purple-400" />
                </button>
              </div>
            )}

            {/* Compliance Checklist — only shown after AI has applied suggestions */}
            {aiApplied && (
            <div className="bg-white border border-purple-300 rounded-lg p-4 shadow-sm transition">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 inline mr-1 text-[#F47C20]" />
                  Compliance Checklist
                </h3>
                <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />AI filled
                </span>
              </div>
              <div className="space-y-2">
                {inspForm.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleChecklist(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                      item.status === 'PASS' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-700">{item.item}</span>
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                      item.status === 'PASS' ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Tap each item to toggle PASS / FAIL</p>
            </div>
            )}
          </>
        )}

        {/* ── Incident fields ──────────────────────────────────────────────── */}
        {showIncident && (
          <>
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
              <p className="text-xs font-extrabold text-orange-700 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />Incident Details
              </p>
            </div>

            {/* Incident Description — AI trigger lives here */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">Incident Description</h3>
              <textarea
                required={showIncident}
                rows={4}
                value={incForm.description}
                onChange={e => {
                  setIncForm(f => ({ ...f, description: e.target.value }));
                  if (incAiApplied) setIncAiApplied(false);
                  if (incAiSuggestion) setIncAiSuggestion(null);
                }}
                placeholder="Describe the incident in detail — what happened, who was involved, immediate actions taken, any injuries or damage..."
                className="w-full text-xs border border-gray-300 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-[10px] text-gray-400">
                  {incForm.description.length} characters
                  {incForm.description.length < 10 && ' — write more for AI analysis'}
                </p>

                {/* AI Analyze button */}
                {incForm.description.trim().length >= 10 && !incAiSuggestion && (
                  <button
                    type="button"
                    onClick={requestIncAiSuggestion}
                    disabled={incAiLoading}
                    className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition shadow-sm"
                  >
                    {incAiLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analyzing…</>
                      : <><Sparkles className="w-3.5 h-3.5" />Analyze with AI</>
                    }
                  </button>
                )}

                {/* Re-analyze */}
                {incAiApplied && !incAiSuggestion && (
                  <button
                    type="button"
                    onClick={requestIncAiSuggestion}
                    disabled={incAiLoading}
                    className="flex items-center gap-1.5 text-purple-600 hover:text-purple-800 font-bold text-[11px] transition"
                  >
                    <RefreshCw className="w-3 h-3" />Re-analyze
                  </button>
                )}
              </div>

              {/* AI error */}
              {incAiError && (
                <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />{incAiError}
                </p>
              )}
            </div>

            {/* AI Incident Suggestion Review Panel */}
            {incAiSuggestion && (
              <AIIncidentSuggestionPanel
                suggestion={incAiSuggestion}
                onApply={applyIncAiSuggestion}
                onDismiss={dismissIncAiSuggestion}
              />
            )}

            {/* Applied confirmation banner */}
            {incAiApplied && !incAiSuggestion && (
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                <p className="text-[11px] text-purple-700 font-semibold">
                  AI suggestions applied. Review the fields below and adjust if needed before submitting.
                </p>
                <button
                  type="button"
                  onClick={() => setIncAiApplied(false)}
                  className="ml-auto p-0.5 rounded hover:bg-purple-100"
                >
                  <X className="w-3 h-3 text-purple-400" />
                </button>
              </div>
            )}

            {/* Severity — only visible after AI applied */}
            {incAiApplied && (
              <div className="bg-white border border-purple-300 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Severity Rating</h3>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />AI filled
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SEVERITY_OPTIONS.map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setShared(s => ({ ...s, severity: opt.v }))}
                      className={`border-2 rounded-lg p-3 text-center transition ${
                        shared.severity === opt.v ? opt.active + ' shadow-md' : opt.color + ' opacity-70 hover:opacity-100'
                      }`}
                    >
                      <p className="text-xs font-extrabold">{opt.label}</p>
                      <p className="text-[10px] mt-0.5 font-medium">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Incident Category — only visible after AI applied */}
            {incAiApplied && (
              <div className="bg-white border border-purple-300 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Incident Category</h3>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />AI filled
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {INCIDENT_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setIncForm(f => ({ ...f, category: cat.value }))}
                      className={`border-2 rounded-lg p-2.5 text-left transition ${
                        incForm.category === cat.value
                          ? 'border-orange-500 bg-orange-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-orange-300'
                      }`}
                    >
                      <p className="text-xs font-extrabold text-gray-800">{cat.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Shared: Photo Evidence ───────────────────────────────────────── */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" />Photo Evidence
          </h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 hover:border-amber-400 rounded-lg py-5 flex flex-col items-center space-y-2 transition"
          >
            <Upload className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-500 font-semibold">Tap to attach photos / documents</span>
            <span className="text-[10px] text-gray-400">JPG, PNG, PDF up to 10MB</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" />
          {shared.photos.length > 0 && (
            <p className="text-xs text-emerald-600 font-semibold mt-2">{shared.photos.length} file(s) attached</p>
          )}
        </div>

        {/* ── Auto-capture info ────────────────────────────────────────────── */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          <p className="font-bold">Auto-captured on submission:</p>
          <p className="text-amber-600">• Timestamp: {new Date().toLocaleString('en-IN')}</p>
          <p className="text-amber-600">• Inspector ID from session token</p>
          {showInspection && <p className="text-amber-600">• AI will auto-classify observation &amp; detect violations</p>}
          {showIncident   && <p className="text-amber-600">• Mine Manager will be notified automatically</p>}
        </div>

        {/* ── Submit ───────────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={submitting || !canSubmit()}
          className="w-full flex items-center justify-center space-x-2 bg-[#F47C20] hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-extrabold text-sm py-3.5 rounded-lg shadow-lg transition"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
          <span>
            {submitting
              ? mode === 'both' ? 'Submitting Report...' : 'Submitting...'
              : mode === 'inspection' ? 'Submit Inspection Report'
              : mode === 'incident'   ? 'Submit Incident Report'
              : 'Submit Inspection & Incident'}
          </span>
        </button>

      </form>
    </div>
  );
};

export default CreateInspection;
