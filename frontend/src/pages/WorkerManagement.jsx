import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  HardHat, UserPlus, Trash2, Loader2,
  Search, X, CheckCircle2, AlertTriangle
} from 'lucide-react';

const SHIFTS = ['DAY', 'NIGHT'];
const ROLES  = ['General Labour', 'Driller', 'Blaster', 'Loader Operator', 'Haulage Driver', 'Safety Marshal', 'Electrician', 'Mechanic'];

const INITIAL_FORM = { name: '', role: 'General Labour', shift: 'DAY' };

const WorkerManagement = () => {
  const { user } = useAuth();
  const [workers, setWorkers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');

  const fetchWorkers = async () => {
    try {
      const res = await API.get('/workers');
      setWorkers(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWorkers(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await API.post('/workers', form);
      setSuccess(`Worker "${form.name}" added.`);
      setForm(INITIAL_FORM);
      setShowForm(false);
      fetchWorkers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add worker.');
    } finally { setSubmitting(false); }
  };

  const handleRemove = async (workerId) => {
    try {
      await API.delete(`/workers/${workerId}`);
      setConfirmRemove(null);
      setSuccess('Worker removed.');
      fetchWorkers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove worker.');
    }
  };

  const filtered = workers.filter(w =>
    !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-300 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-[#F47C20]" />My Workers
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage workers under your contract</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow transition">
          <UserPlus className="w-4 h-4" />Add Worker
        </button>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs font-semibold text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-[#F47C20] rounded-xl shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#F47C20]" />Add New Worker
            </h3>
            <button onClick={() => { setShowForm(false); setError(''); }}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Full Name</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ramesh Kumar"
                className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Role / Trade</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400">
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Shift</label>
                <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400">
                  {SHIFTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-[#F47C20] hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs py-2.5 rounded-lg transition">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>{submitting ? 'Adding...' : 'Add Worker'}</span>
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Workers', value: workers.length },
          { label: 'Day Shift',     value: workers.filter(w => w.shift === 'DAY').length },
          { label: 'Night Shift',   value: workers.filter(w => w.shift === 'NIGHT').length },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{s.label}</p>
            <p className="text-3xl font-black text-gray-800 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2 shadow-sm">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or role..."
          className="flex-1 text-xs border-0 focus:ring-0 outline-none" />
      </div>

      {/* Workers table */}
      {loading ? (
        <div className="text-center py-10 text-xs font-bold text-gray-400 animate-pulse">Loading workers...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm text-center py-14">
          <HardHat className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">{search ? 'No workers match your search' : 'No workers added yet'}</p>
          {!search && <p className="text-xs text-gray-400 mt-1">Add workers to start marking attendance</p>}
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Worker ID</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Role / Trade</th>
                <th className="px-4 py-2.5">Shift</th>
                <th className="px-4 py-2.5">Added</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(w => (
                <tr key={w.workerId} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono font-bold text-gray-500">{w.workerId}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center font-extrabold text-amber-700 text-[11px] shrink-0">
                        {w.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-800">{w.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{w.role}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      w.shift === 'DAY' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>{w.shift}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">{w.createdAt?.split('T')[0]}</td>
                  <td className="px-4 py-2.5 text-right">
                    {confirmRemove === w.workerId ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[10px] text-red-600 font-bold">Confirm?</span>
                        <button onClick={() => handleRemove(w.workerId)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2 py-1 rounded transition">Yes</button>
                        <button onClick={() => setConfirmRemove(null)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-[10px] px-2 py-1 rounded transition">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmRemove(w.workerId)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700 font-bold text-[10px] px-2 py-1 rounded hover:bg-red-50 transition">
                        <Trash2 className="w-3.5 h-3.5" />Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkerManagement;
