import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardCheck, CheckCircle2, XCircle, Clock,
  Loader2, AlertTriangle, CalendarDays
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'PRESENT',  label: 'Present',  color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-400 text-emerald-700' },
  { value: 'ABSENT',   label: 'Absent',   color: 'bg-red-500',     light: 'bg-red-50 border-red-400 text-red-700' },
  { value: 'HALF_DAY', label: 'Half Day', color: 'bg-amber-500',   light: 'bg-amber-50 border-amber-400 text-amber-700' },
  { value: 'LEAVE',    label: 'Leave',    color: 'bg-blue-400',    light: 'bg-blue-50 border-blue-400 text-blue-700' },
];

const MarkAttendance = () => {
  const { user } = useAuth();
  const [workers, setWorkers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');
  const [attendance, setAttendance] = useState({});  // { workerId: status }

  const today = new Date().toISOString().split('T')[0];
  const displayDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const init = async () => {
      try {
        const [wRes, aRes] = await Promise.all([
          API.get('/workers'),
          API.get('/attendance/today'),
        ]);
        const workerList = wRes.data || [];
        setWorkers(workerList);

        // Pre-fill if attendance already submitted today
        const todayRecord = (aRes.data || []).find(r => r.contractorId === user?.userId);
        if (todayRecord?.records?.length) {
          const prefilled = {};
          todayRecord.records.forEach(r => { prefilled[r.workerId] = r.status; });
          setAttendance(prefilled);
          setSubmitted(true);
        } else {
          // Default everyone to PRESENT
          const defaults = {};
          workerList.forEach(w => { defaults[w.workerId] = 'PRESENT'; });
          setAttendance(defaults);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  const setStatus = (workerId, status) => {
    setSubmitted(false);
    setAttendance(a => ({ ...a, [workerId]: status }));
  };

  const markAll = (status) => {
    setSubmitted(false);
    const all = {};
    workers.forEach(w => { all[w.workerId] = status; });
    setAttendance(all);
  };

  const handleSubmit = async () => {
    if (!workers.length) return;
    setSubmitting(true); setError('');
    try {
      const records = workers.map(w => ({
        workerId: w.workerId,
        status:   attendance[w.workerId] || 'ABSENT',
      }));

      const mineId = workers[0]?.mineId || user?.mineId;
      if (!mineId) {
        setError('Mine ID not found. Please contact your Mine Manager to assign a mine to your account.');
        setSubmitting(false);
        return;
      }

      await API.post('/attendance', { mineId, date: today, records });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit attendance. Please try again.');
    } finally { setSubmitting(false); }
  };

  const counts = workers.reduce((acc, w) => {
    const s = attendance[w.workerId] || 'ABSENT';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  if (loading) return (
    <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading workers...</div>
  );

  if (workers.length === 0) return (
    <div className="p-8 text-center space-y-3">
      <ClipboardCheck className="w-12 h-12 text-gray-200 mx-auto" />
      <p className="text-sm font-bold text-gray-500">No workers added yet</p>
      <p className="text-xs text-gray-400">Add workers in My Workers before marking attendance</p>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-300 pb-4">
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-[#F47C20]" />Mark Attendance
        </h1>
        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />{displayDate}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {STATUS_OPTIONS.map(s => (
          <div key={s.value} className="bg-white border border-gray-300 rounded-lg shadow-sm p-3 text-center">
            <p className="text-[10px] font-bold uppercase text-gray-500">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${
              s.value === 'PRESENT'  ? 'text-emerald-600' :
              s.value === 'ABSENT'   ? 'text-red-600' :
              s.value === 'HALF_DAY' ? 'text-amber-600' : 'text-blue-500'
            }`}>{counts[s.value] || 0}</p>
          </div>
        ))}
      </div>

      {/* Mark all shortcuts */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-gray-500 uppercase">Mark all as:</span>
        {STATUS_OPTIONS.map(s => (
          <button key={s.value} onClick={() => markAll(s.value)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded border-2 transition ${s.light}`}>
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs font-semibold text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {submitted && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />Attendance submitted for today. You can update it anytime.
        </div>
      )}

      {/* Worker list */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">
            {workers.length} Workers
          </span>
          <span className="text-[10px] text-gray-400">Tap a status to toggle</span>
        </div>

        <div className="divide-y divide-gray-100">
          {workers.map(w => {
            const current = attendance[w.workerId] || 'ABSENT';
            return (
              <div key={w.workerId} className="px-4 py-3 flex items-center justify-between gap-4">
                {/* Worker info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-extrabold text-amber-700 text-xs shrink-0">
                    {w.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{w.name}</p>
                    <p className="text-[10px] text-gray-400">{w.role} · {w.shift} shift</p>
                  </div>
                </div>

                {/* Status toggle buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setStatus(w.workerId, s.value)}
                      className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg border-2 transition ${
                        current === s.value
                          ? s.light + ' shadow-sm'
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-[#F47C20] hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-extrabold text-sm py-3.5 rounded-lg shadow-lg transition"
      >
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
        <span>{submitting ? 'Submitting...' : submitted ? 'Update Attendance' : 'Submit Attendance'}</span>
      </button>
    </div>
  );
};

export default MarkAttendance;
