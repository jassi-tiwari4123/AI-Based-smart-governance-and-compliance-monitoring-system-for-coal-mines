import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Flame, MapPin, Camera, Upload, CheckCircle2,
  Loader2, ChevronRight, ArrowLeft, AlertTriangle
} from 'lucide-react';

const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Pit #1', 'Pit #2', 'Pit #3', 'Haulage Corridor', 'Washery Area', 'Stockpile #1', 'Stockpile #2', 'Office Block'];

const CATEGORIES = [
  { value: 'SAFETY',      label: '🦺 Safety',       desc: 'PPE, fall, entrapment, explosion' },
  { value: 'ENVIRONMENT', label: '🌿 Environment',   desc: 'Dust, water, air quality' },
  { value: 'EQUIPMENT',   label: '⚙️ Equipment',     desc: 'Machinery failure, breakdown' },
  { value: 'LABOUR',      label: '👷 Labour',        desc: 'Injury, fatigue, dispute' },
  { value: 'FIRE',        label: '🔥 Fire / Gas',    desc: 'Fire outbreak, gas leak' },
  { value: 'STRUCTURAL',  label: '🏗️ Structural',   desc: 'Roof fall, ground collapse' },
];

const ReportIncident = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [mines, setMines] = useState([]);

  useEffect(() => {
    API.get('/mines').then(r => {
      const list = r.data || [];
      setMines(list);
      const defaultMine = list.find(m => m.mineId === user?.mineId) || list[0];
      if (defaultMine) setForm(f => ({ ...f, mineId: defaultMine.mineId }));
    }).catch(console.error);
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [form, setForm] = useState({
    mineId: user?.mineId || '',
    zone: 'Zone A',
    category: 'SAFETY',
    severity: 'MAJOR',
    description: '',
    gpsLocation: null,
    photos: [],
    status: 'REPORTED',
  });

  const captureGPS = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm(f => ({ ...f, gpsLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude } }));
          setGpsLoading(false);
        },
        () => {
          setForm(f => ({ ...f, gpsLocation: { lat: 20.9517, lng: 85.0985 } }));
          setGpsLoading(false);
        }
      );
    } else {
      setForm(f => ({ ...f, gpsLocation: { lat: 20.9517, lng: 85.0985 } }));
      setGpsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        gpsLocation: form.gpsLocation || { lat: 20.9517, lng: 85.0985 },
      };
      const res = await API.post('/incidents', payload);
      setSubmitted(res.data);
    } catch (err) {
      console.error(err);
      alert('Submission failed. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-6 text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-extrabold text-gray-900">Incident Reported</h2>
          <p className="text-sm text-gray-600">
            Incident <span className="font-bold text-gray-900">{submitted.incidentId}</span> has been logged and the Mine Manager has been notified.
          </p>

          {/* severity alert */}
          {submitted.severity === 'CRITICAL' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="font-extrabold text-red-700 text-sm">Critical Incident Alert Sent</span>
              </div>
              <p className="text-xs text-red-600">Escalation notification dispatched to Mine Manager &amp; DGMS.</p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left space-y-1">
            <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wide">Summary</p>
            <p className="text-xs text-gray-700"><span className="font-bold">Mine:</span> {submitted.mineId}</p>
            <p className="text-xs text-gray-700"><span className="font-bold">Zone:</span> {submitted.zone}</p>
            <p className="text-xs text-gray-700"><span className="font-bold">Category:</span> {submitted.category}</p>
            <p className="text-xs text-gray-700"><span className="font-bold">Severity:</span> {submitted.severity}</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => { setSubmitted(null); setForm(f => ({ ...f, description: '', gpsLocation: null })); }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2.5 rounded transition"
            >
              Report Another
            </button>
            <button
              onClick={() => navigate('/incidents')}
              className="flex-1 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs py-2.5 rounded transition"
            >
              View Incidents Log
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-200 transition">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#F47C20]" />
            Report Incident
          </h1>
          <p className="text-xs text-gray-500">Log a safety or operational incident at the mine site</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Location */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Incident Location</h3>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Mine / Colliery</label>
            <select
              value={form.mineId}
              onChange={e => setForm(f => ({ ...f, mineId: e.target.value }))}
              className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            >
              {mines.map(m => <option key={m.mineId} value={m.mineId}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Zone / Area</label>
            <select
              value={form.zone}
              onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
              className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            >
              {ZONES.map(z => <option key={z}>{z}</option>)}
            </select>
          </div>
        </div>

        {/* GPS */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#F47C20]" />GPS Location
          </h3>
          {form.gpsLocation ? (
            <div className="flex items-center justify-between">
              <div className="bg-emerald-50 border border-emerald-200 rounded px-3 py-2 text-xs font-mono text-emerald-700">
                📍 {form.gpsLocation.lat.toFixed(5)}, {form.gpsLocation.lng.toFixed(5)}
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

        {/* Category */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Incident Category</h3>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                className={`border-2 rounded-lg p-2.5 text-left transition ${
                  form.category === cat.value
                    ? 'border-amber-500 bg-amber-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-amber-300'
                }`}
              >
                <p className="text-xs font-extrabold text-gray-800">{cat.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2">Incident Description</h3>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the incident in detail — what happened, who was involved, immediate actions taken, any injuries or damage..."
            className="w-full text-xs border border-gray-300 rounded-md px-3 py-2.5 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
          />
          <p className="text-[10px] text-gray-400 mt-1">{form.description.length} characters — be specific for accurate records</p>
        </div>

        {/* Severity */}
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Severity Level</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 'MINOR',    color: 'border-emerald-300 bg-emerald-50 text-emerald-700', active: 'border-emerald-600 bg-emerald-100', label: '🟢 Minor',    desc: 'No injury, minor damage' },
              { v: 'MAJOR',    color: 'border-amber-300 bg-amber-50 text-amber-700',       active: 'border-amber-600 bg-amber-100',    label: '🟡 Major',    desc: 'Injury or significant damage' },
              { v: 'CRITICAL', color: 'border-red-300 bg-red-50 text-red-700',             active: 'border-red-600 bg-red-100',        label: '🔴 Critical', desc: 'Fatality or major loss' },
            ].map(opt => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setForm(f => ({ ...f, severity: opt.v }))}
                className={`border-2 rounded-lg p-3 text-center transition ${
                  form.severity === opt.v ? opt.active + ' shadow-md' : opt.color + ' opacity-70 hover:opacity-100'
                }`}
              >
                <p className="text-xs font-extrabold">{opt.label}</p>
                <p className="text-[10px] mt-0.5 font-medium">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Photo Evidence */}
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
          {form.photos.length > 0 && (
            <p className="text-xs text-emerald-600 font-semibold mt-2">{form.photos.length} file(s) attached</p>
          )}
        </div>

        {/* Info banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          <p className="font-bold">Auto-captured on submission:</p>
          <p className="text-amber-600">• Timestamp: {new Date().toLocaleString('en-IN')}</p>
          <p className="text-amber-600">• Reporter ID from session token</p>
          <p className="text-amber-600">• Mine Manager will be notified automatically</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !form.description.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-[#F47C20] hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-extrabold text-sm py-3.5 rounded-lg shadow-lg transition"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
          <span>{submitting ? 'Submitting Incident Report...' : 'Submit Incident Report'}</span>
        </button>

      </form>
    </div>
  );
};

export default ReportIncident;
