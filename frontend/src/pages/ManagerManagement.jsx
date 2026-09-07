import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  Users, UserPlus, Trash2, Loader2, Search,
  X, CheckCircle2, AlertTriangle, Building2
} from 'lucide-react';

const INITIAL_FORM = {
  name: '', email: '', password: '', department: '',
};

const ManagerManagement = () => {
  const [managers, setManagers]         = useState([]);
  const [mines, setMines]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(INITIAL_FORM);
  const [submitting, setSubmitting]     = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [success, setSuccess]           = useState('');
  const [error, setError]               = useState('');

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };

  const fetchData = async () => {
    try {
      const [mgrRes, mineRes] = await Promise.all([
        API.get('/users/managers'),
        API.get('/mines'),
      ]);
      setManagers(mgrRes.data || []);
      setMines(mineRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // Find mine name for a given mineId
  const mineName = (mineId) => {
    if (!mineId) return null;
    const m = mines.find(m => m.mineId === mineId);
    return m ? m.name : mineId;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await API.post('/users/mine', { ...form, role: 'MINE_MANAGER' });
      flash(`Mine Manager "${form.name}" added.`);
      setForm(INITIAL_FORM);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add manager.');
    } finally { setSubmitting(false); }
  };

  const handleRemove = async (userId) => {
    try {
      await API.delete(`/users/mine/${userId}`);
      setConfirmRemove(null);
      flash('Manager removed.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove manager.');
    }
  };

  const filtered = managers.filter(m =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const assigned   = managers.filter(m => m.mineId);
  const unassigned = managers.filter(m => !m.mineId);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-300 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F47C20]" />Manager Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Add, view and remove Mine Managers across your portfolio</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow transition">
          <UserPlus className="w-4 h-4" />Add Manager
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
              <UserPlus className="w-4 h-4 text-[#F47C20]" />Add New Mine Manager
            </h3>
            <button onClick={() => { setShowForm(false); setError(''); }}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Subhashish Panda"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Email</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. subhashish@mineguard.in"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Temporary Password</label>
                <input required type="password" minLength={8} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Department</label>
                <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Mine Operations"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              <p className="font-bold">After adding:</p>
              <p className="text-amber-600">• Go to Mine Management to assign this manager to a mine</p>
              <p className="text-amber-600">• Manager will be created without a mine assignment initially</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-[#F47C20] hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs py-2.5 rounded-lg transition">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {submitting ? 'Adding...' : 'Add Manager'}
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
          { label: 'Total Managers', value: managers.length,    color: 'text-gray-800' },
          { label: 'Assigned',       value: assigned.length,    color: 'text-emerald-600' },
          { label: 'Unassigned',     value: unassigned.length,  color: unassigned.length > 0 ? 'text-amber-600' : 'text-gray-800' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{s.label}</p>
            <p className={`text-3xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2 shadow-sm">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 text-xs border-0 focus:ring-0 outline-none" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-xs font-bold text-gray-400 animate-pulse">Loading managers...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm text-center py-14">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">{search ? 'No managers match your search' : 'No managers yet'}</p>
          {!search && <p className="text-xs text-gray-400 mt-1">Add a Mine Manager to get started</p>}
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Manager</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">User ID</th>
                <th className="px-4 py-2.5">Assigned Mine</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Added</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(mgr => (
                <tr key={mgr.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center font-extrabold text-amber-700 text-[11px] shrink-0">
                        {mgr.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-800">{mgr.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{mgr.email}</td>
                  <td className="px-4 py-3 font-mono text-gray-400">{mgr.userId}</td>
                  <td className="px-4 py-3">
                    {mgr.mineId ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{mgr.mineId}</span>
                        <span className="text-gray-400 font-normal truncate max-w-[120px]">— {mineName(mgr.mineId)}</span>
                      </span>
                    ) : (
                      <span className="text-amber-600 font-bold">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{mgr.department || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{mgr.createdAt?.split('T')[0]}</td>
                  <td className="px-4 py-3 text-right">
                    {confirmRemove === mgr.userId ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[10px] text-red-600 font-bold">Confirm?</span>
                        <button onClick={() => handleRemove(mgr.userId)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2 py-1 rounded transition">Yes</button>
                        <button onClick={() => setConfirmRemove(null)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-[10px] px-2 py-1 rounded transition">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmRemove(mgr.userId)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700 font-bold text-[10px] px-2 py-1 rounded hover:bg-red-50 transition ml-auto">
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

export default ManagerManagement;
