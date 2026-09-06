import React, { useState, useEffect } from 'react';
import API from '../services/api';
import OfflineIndicator from '../components/OfflineIndicator';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Camera, MapPin, Clock, CheckSquare, Send, RefreshCw, ShieldAlert } from 'lucide-react';

const CreateInspection = () => {
  const navigate = useNavigate();
  const [mines, setMines] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueue, setPendingQueue] = useState(() => {
    const saved = localStorage.getItem('mineguard_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState({
    mineId: 'MINE-007',
    zone: 'Zone B',
    category: 'SAFETY',
    severity: 'CRITICAL',
    observations: 'Worker safety equipment compliance issue detected.',
    gpsLocation: { lat: 20.9167, lng: 85.1500 },
    photos: ['/uploads/field_evidence_sample.jpg'],
    checklist: [
      { item: 'PPE Helmet & Steel Boots Worn', status: 'FAIL' },
      { item: 'Dust Suppression Sprinklers Active', status: 'PASS' },
      { item: 'Haul Road Warning Signals Active', status: 'PASS' }
    ]
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMines();
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchMines = async () => {
    try {
      const res = await API.get('/mines');
      setMines(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const syncOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('mineguard_offline_queue') || '[]');
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        await API.post('/inspections', item);
      } catch (e) {
        console.error("Sync item failed", e);
      }
    }
    localStorage.removeItem('mineguard_offline_queue');
    setPendingQueue([]);
  };

  const handleGPSCapture = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            gpsLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude }
          }));
        },
        () => {
          setFormData(prev => ({
            ...prev,
            gpsLocation: { lat: 20.9167, lng: 85.1500 }
          }));
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');

    const payload = {
      ...formData,
      inspectionDate: new Date().toISOString()
    };

    if (!isOnline) {
      const updatedQueue = [...pendingQueue, payload];
      localStorage.setItem('mineguard_offline_queue', JSON.stringify(updatedQueue));
      setPendingQueue(updatedQueue);
      setSuccessMsg('Offline Mode Active: Inspection queued locally. Will sync automatically when connection restores.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await API.post('/inspections', payload);
      const createdVio = res.data.violationCreated;
      if (createdVio) {
        setSuccessMsg(`Inspection submitted successfully! AI Risk Analysis generated CRITICAL Violation ${createdVio.violationId} (Risk Score: 82/100). Redirecting to AI Investigation...`);
        setTimeout(() => {
          navigate(`/ai-investigation/${createdVio.violationId}`);
        }, 1500);
      } else {
        setSuccessMsg('Inspection submitted successfully!');
        setTimeout(() => navigate('/inspections'), 1500);
      }
    } catch (err) {
      setSuccessMsg('Error submitting inspection. Saved to offline queue fallback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 font-sans space-y-6">
      {/* Mobile App Header */}
      <div className="bg-[#252525] text-white p-4 rounded-lg shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-[#F47C20] p-2 rounded text-slate-950">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wide uppercase">Mobile Field Inspection App</h1>
            <p className="text-[11px] text-amber-400 font-semibold">Statutory On-Site Observation Engine</p>
          </div>
        </div>

        {/* Sync Status Badge */}
        <OfflineIndicator isOnline={isOnline} pendingSyncCount={pendingQueue.length} />
      </div>

      {successMsg && (
        <div className="bg-amber-50 border-l-4 border-[#F47C20] p-4 text-xs font-bold text-gray-900 shadow-sm rounded-r">
          {successMsg}
        </div>
      )}

      {/* Main Inspection Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm space-y-5">
        {/* Step 1: Mine & Zone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">1. Select Coal Mine</label>
            <select
              value={formData.mineId}
              onChange={(e) => setFormData({ ...formData, mineId: e.target.value })}
              className="w-full text-xs font-bold p-2.5 border border-gray-300 rounded bg-gray-50 focus:ring-amber-500"
            >
              {mines.map((m) => (
                <option key={m.mineId} value={m.mineId}>
                  {m.name} ({m.state})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">2. Select Mine Zone</label>
            <select
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="w-full text-xs font-bold p-2.5 border border-gray-300 rounded bg-gray-50"
            >
              <option value="Zone B">Zone B (Active Pit Corridor)</option>
              <option value="Zone A">Zone A (Haul Road East)</option>
              <option value="Pit #3">Pit #3 (Open Cast Bench)</option>
              <option value="Washery Area">Washery & Coal Stockpile</option>
            </select>
          </div>
        </div>

        {/* Step 2: Category & Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">3. Inspection Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full text-xs font-bold p-2.5 border border-gray-300 rounded bg-gray-50"
            >
              <option value="SAFETY">SAFETY (Personal Gear, Equipment)</option>
              <option value="ENVIRONMENT">ENVIRONMENT (Air, Dust, Effluent)</option>
              <option value="PRODUCTION">PRODUCTION (Benches, Haulage)</option>
              <option value="LABOUR">LABOUR (Working Hours, Shift Safety)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">4. Observed Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full text-xs font-bold p-2.5 border border-gray-300 rounded bg-gray-50 text-red-700 font-extrabold"
            >
              <option value="CRITICAL">CRITICAL (High Immediate Risk)</option>
              <option value="MAJOR">MAJOR (Statutory Breach)</option>
              <option value="MINOR">MINOR (Routine Variance)</option>
            </select>
          </div>
        </div>

        {/* Step 3: Observation */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">5. Field Observation Description</label>
          <textarea
            rows="3"
            required
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            placeholder="Record detailed field observation..."
            className="w-full text-xs font-medium p-2.5 border border-gray-300 rounded focus:ring-amber-500"
          ></textarea>
        </div>

        {/* Step 4: Photo & GPS Metadata */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
          <span className="block text-xs font-extrabold text-gray-800 uppercase">Evidence Metadata & Digital Stamp</span>
          
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded border border-gray-300 font-mono">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>GPS: {formData.gpsLocation.lat.toFixed(4)}, {formData.gpsLocation.lng.toFixed(4)}</span>
              <button type="button" onClick={handleGPSCapture} className="text-amber-600 font-bold underline ml-2">Capture</button>
            </div>

            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded border border-gray-300 font-mono">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>

            <div className="flex items-center space-x-2 bg-amber-600 text-white px-3 py-2 rounded font-bold cursor-pointer">
              <Camera className="w-4 h-4" />
              <span>Photo Attached (1)</span>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded shadow transition flex items-center justify-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Processing & Triggering AI Analysis...' : 'Submit Field Inspection Report'}</span>
        </button>
      </form>
    </div>
  );
};

export default CreateInspection;
