import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, UserPlus, Trash2, ClipboardCheck, HardHat,
  Loader2, Search, X, CheckCircle2, AlertTriangle
} from 'lucide-react';

const ROLE_STYLES = {
  INSPECTOR:  { bg: 'bg-blue-100 text-blue-800',   icon: ClipboardCheck, label: 'Inspector' },
  CONTRACTOR: { bg: 'bg-amber-100 text-amber-800',  icon: HardHat,        label: 'Contractor' },
};

const INITIAL_FORM = {
  name:       '',
  email:      '',
  password:   '',
  role:       'INSPECTOR',
  department: '',
};

const TeamManagement = () => {
  const { user } = useAuth();
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null); // userId to confirm

  const fetchMembers = async () => {
    try {
      const res = await API.get('/users/mine');
      setMembers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await API.post('/users/mine', form);
      setSuccess(`${ROLE_STYLES[form.role].label} "${form.name}" added successfully.`);
      setForm(INITIAL_FORM);
      setShowForm(false);
      fetchMembers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId) => {
    try {
      await API.delete(`/users/mine/${userId}`);
      setConfirmRemove(null);
      setSuccess('Team member removed successfully.');
      fetchMembers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove user.');
    }
  };

  const inspectors  = members.filter(m => m.role === 'INSPECTOR');
  const contractors = members.filter(m => m.role === 'CONTRACTOR');

  const filtered = members.filter(m => {
    const matchRole   = !roleFilter || m.role === roleFilter;
    const matchSearch = !search    || m.name.toLowerCase().includes(search.toLowerCase())
                                   || m.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-300 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F47C20]" />Team Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage Inspectors and Contractors assigned to your mine
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow transition"
        >
          <UserPlus className="w-4 h-4" />Add Member
        </button>
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
          <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Add member form */}
      {showForm && (
        <div className="bg-white border border-[#F47C20] rounded-xl shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#F47C20]" />Add New Team Member
            </h3>
            <button onClick={() => { setShowForm(false); setError(''); }}
              className="p-1 rounded hover:bg-gray-100 transition">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-3">
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-3">
              {['INSPECTOR', 'CONTRACTOR'].map(r => {
                const { icon: Icon, label, bg } = ROLE_STYLES[r];
                return (
                  <button
                    key={r} type="button"
                    onClick={() => setForm(f => ({ ...f, role: r }))}
                    className={`border-2 rounded-lg p-3 flex items-center gap-2 transition ${
                      form.role === r
                        ? 'border-[#F47C20] bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${form.role === r ? 'text-[#F47C20]' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <p className="text-xs font-extrabold text-gray-800">{label}</p>
                      <p className="text-[10px] text-gray-500">
                        {r === 'INSPECTOR' ? 'Files inspections on site' : 'Assigned corrective actions'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Email Address</label>
                <input required type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. rajesh@mineguard.gov.in"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Temporary Password</label>
                <input required type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Department</label>
                <input value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Safety Division"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              <p className="font-bold">Auto-assigned on creation:</p>
              <p className="text-amber-600">• Mine ID: <span className="font-mono font-bold">{user?.mineId}</span></p>
              <p className="text-amber-600">• Account created by: {user?.name}</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-[#F47C20] hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs py-2.5 rounded-lg transition">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>{submitting ? 'Creating Account...' : `Add ${ROLE_STYLES[form.role].label}`}</span>
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
          { label: 'Total Members', value: members.length,      icon: Users,         color: 'text-gray-700' },
          { label: 'Inspectors',    value: inspectors.length,   icon: ClipboardCheck, color: 'text-blue-600' },
          { label: 'Contractors',   value: contractors.length,  icon: HardHat,        color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{s.label}</p>
              <p className={`text-3xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
            <s.icon className={`w-8 h-8 ${s.color} opacity-20`} />
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex gap-3">
        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 flex items-center gap-2 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 text-xs border-0 focus:ring-0 outline-none" />
        </div>
        {['', 'INSPECTOR', 'CONTRACTOR'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`text-xs font-bold px-3 py-2 rounded-lg border transition ${
              roleFilter === r
                ? 'bg-[#252525] text-white border-[#252525]'
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-500'
            }`}>
            {r || 'All'}
          </button>
        ))}
      </div>

      {/* Members list */}
      {loading ? (
        <div className="text-center py-10 text-xs font-bold text-gray-400 animate-pulse">Loading team...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm text-center py-14">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">
            {search || roleFilter ? 'No members match your search' : 'No team members yet'}
          </p>
          {!search && !roleFilter && (
            <p className="text-xs text-gray-400 mt-1">Add Inspectors and Contractors to get started</p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#252525] text-white text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">User ID</th>
                <th className="px-4 py-2.5">Added</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(member => {
                const style = ROLE_STYLES[member.role];
                const Icon  = style.icon;
                return (
                  <tr key={member.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center font-extrabold text-gray-600 text-[11px] shrink-0">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-800">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{member.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${style.bg}`}>
                        <Icon className="w-3 h-3" />{style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{member.department || '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{member.userId}</td>
                    <td className="px-4 py-3 text-gray-400">{member.createdAt?.split('T')[0]}</td>
                    <td className="px-4 py-3 text-right">
                      {confirmRemove === member.userId ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[10px] text-red-600 font-bold">Confirm?</span>
                          <button onClick={() => handleRemove(member.userId)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2 py-1 rounded transition">
                            Yes
                          </button>
                          <button onClick={() => setConfirmRemove(null)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-[10px] px-2 py-1 rounded transition">
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(member.userId)}
                          className="flex items-center gap-1 text-red-500 hover:text-red-700 font-bold text-[10px] px-2 py-1 rounded hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
