import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Smartphone, MapPin, Camera, Upload, CheckCircle2, AlertTriangle,
  Loader2, ChevronRight, ArrowLeft, Shield, Flame, ClipboardCheck
} from 'lucide-react';

const MINES = [
  { id: 'MINE-007', name: 'Mine 07 (Talcher Coalfield)' },
  { id: 'MINE-001', name: 'Dhanbad Opencast Pit #4' },
  { id: 'MINE-002', name: 'Gevra Mega Open Cast Mine' },
  { id: 'MINE-003', name: 'Raniganj Underground Sector B' },
  { id: 'MINE-004', name: 'Ib Valley Open Cast Pit #2' },
  { id: 'MINE-005', name: 'Rajrappa Open Pit & Washery' },
  { id: 'MINE-006', name: 'Dipka Open Cast Mine' },
  { id: 'MINE-008', name: 'Jayant Open Cast Project' },
  { id: 'MINE-009', name: 'Dulanga Open Cast Block' },
  { id: 'MINE-010', name: 'Tamnar Captive Coal Pit' },
];

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

const CreateInspection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('inspection');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // { inspection, incident }
  const [gpsLoading, setGpsLoading] = useState(false);

  // Shared fields
  const [shared, setShared] = useState({
    mineId: 'MINE-007',
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

  const toggleChecklist = (idx) => {
    setInspForm(f => {
      const newList = [...f.checklist];
      newList[idx] = { ...newList[idx], status: newList[idx].status === 'PASS' ? 'FAIL' : 'PASS' };
      return { ...f, checklist: newList };
    });
  };

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
    setShared(s => ({ ...s, gpsLocation: null, photos: [] }));
    setInspForm(f => ({ ...f, observations: '' }));
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

          {/* Inspection result */}
          {ins && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-blue-700 text-sm">Inspection Recorded</span>
              </div>
              <p className="text-xs text-gray-600">ID: <span className="font-bold text-gray-800">{ins.inspectionId}</span></p>
            </div>
          )}

          {/* Violation auto-detected */}
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

          {/* Incident result */}
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
              <button onClick={() => navigate('/inspections')}
                className="flex-1 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs py-2.5 rounded transition">
                My Inspections
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
            <select
              value={shared.mineId}
              onChange={e => setShared(s => ({ ...s, mineId: e.target.value }))}
              className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            >
              {MINES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
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

        {/* ── Shared: Severity ────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Severity Rating</h3>
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

        {/* ── Inspection fields ────────────────────────────────────────────── */}
        {showInspection && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-xs font-extrabold text-blue-700 flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5" />Inspection Details
              </p>
            </div>

            {/* Inspection Category */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">Inspection Category</h3>
              <div className="grid grid-cols-2 gap-2">
                {INSPECTION_CATEGORIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setInspForm(f => ({ ...f, category: c }))}
                    className={`border-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                      inspForm.category === c
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Field Observation */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">Field Observation</h3>
              <textarea
                required={showInspection}
                rows={4}
                value={inspForm.observations}
                onChange={e => setInspForm(f => ({ ...f, observations: e.target.value }))}
                placeholder="Describe what you observed in detail. Include specific hazards, equipment conditions, worker behaviour, or environmental issues..."
                className="w-full text-xs border border-gray-300 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">{inspForm.observations.length} characters — be specific for accurate AI analysis</p>
            </div>

            {/* Compliance Checklist */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">
                <Shield className="w-3.5 h-3.5 inline mr-1 text-[#F47C20]" />
                Compliance Checklist
              </h3>
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

            {/* Incident Category */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Incident Category</h3>
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

            {/* Incident Description */}
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">Incident Description</h3>
              <textarea
                required={showIncident}
                rows={4}
                value={incForm.description}
                onChange={e => setIncForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the incident in detail — what happened, who was involved, immediate actions taken, any injuries or damage..."
                className="w-full text-xs border border-gray-300 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">{incForm.description.length} characters — be specific for accurate records</p>
            </div>
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
