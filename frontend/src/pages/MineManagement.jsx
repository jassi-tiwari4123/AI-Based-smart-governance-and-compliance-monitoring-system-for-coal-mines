import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  Pickaxe, Plus, UserCog, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Loader2, X, MapPin, RefreshCw
} from 'lucide-react';

const INITIAL_MINE_FORM = {
  name: '', location: '', state: '', district: '',
  latitude: '', longitude: '',
  operationalStatus: 'Operational', complianceScore: 85, riskLevel: 'LOW',
};

const RISK_COLORS = {
  CRITICAL: 'bg-red-600', HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500', LOW: 'bg-emerald-600',
};

const STATUS_OPTIONS = ['Operational', 'Under Maintenance', 'Closed', 'Under Investigation'];

const STATUS_STYLE = {
  'Operational':         'bg-emerald-100 text-emerald-800',
  'Under Maintenance':   'bg-amber-100 text-amber-800',
  'Closed':              'bg-red-100 text-red-800',
  'Under Investigation': 'bg-purple-100 text-purple-800',
};

const MineManagement = () => {
  const [mines, setMines]                     = useState([]);
  const [managers, setManagers]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [showAddForm, setShowAddForm]         = useState(false);
  const [mineForm, setMineForm]               = useState(INITIAL_MINE_FORM);
  const [submitting, setSubmitting]           = useState(false);
  const [expandedMine, setExpandedMine]       = useState(null);
  const [assigningMine, setAssigningMine]     = useState(null);
  const [selectedManager, setSelectedManager] = useState('');
  const [assigning, setAssigning]             = useState(false);
  const [changingStatus, setChangingStatus]   = useState(null); // mineId
  const [success, setSuccess]                 = useState('');
  const [error, setError]                     = useState('');

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };

  const fetchData = async () => {
    try {
      const res = await API.get('/mines');
      setMines(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchManagers = async () => {
    try {
      const res = await API.get('/users/managers');
      setManagers(res.data || []);
    } catch { setManagers([]); }
  };

  useEffect(() => { fetchData(); fetchManagers(); }, []);

  const handleAddMine = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await API.post('/mines', {
        ...mineForm,
        latitude:        parseFloat(mineForm.latitude)        || 0,
        longitude:       parseFloat(mineForm.longitude)       || 0,
        complianceScore: parseFloat(mineForm.complianceScore) || 85,
        manager: '',
      });
      flash('Mine added successfully.');
      setMineForm(INITIAL_MINE_FORM);
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add mine.');
    } finally { setSubmitting(false); }
  };

  const handleChangeStatus = async (mineId, newStatus) => {
    setChangingStatus(mineId);
    try {
      await API.put(`/mines/${mineId}`, { operationalStatus: newStatus });
      flash(`Status updated to "${newStatus}".`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status.');
    } finally { setChangingStatus(null); }
  };

  const handleAssignManager = async (mineId) => {
    if (!selectedManager) return;
    setAssigning(true); setError('');
    try {
      await API.post(`/mines/${mineId}/assign-manager`, { userId: selectedManager });
      flash('Manager assigned successfully.');
      setAssigningMine(null);
      setSelectedManager('');
      fetchData(); fetchManagers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign manager.');
    } finally { setAssigning(false); }
  };

  const handleRemoveManager = async (mineId) => {
    setAssigning(true); setError('');
    try {
      await API.delete(`/mines/${mineId}/manager`);
      flash('Manager removed.');
      fetchData(); fetchManagers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to remove manager.');
    } finally { setAssigning(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-300 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Pickaxe className="w-5 h-5 text-[#F47C20]" />Mine Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Add mines, change status, assign managers</p>
        </div>
        <button onClick={() => { setShowAddForm(true); setError(''); }}
          className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-lg shadow transition">
          <Plus className="w-4 h-4" />Add Mine
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

      {/* Add Mine Form */}
      {showAddForm && (
        <div className="bg-white border border-[#F47C20] rounded-xl shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#F47C20]" />Add New Mine
            </h3>
            <button onClick={() => { setShowAddForm(false); setError(''); }}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <form onSubmit={handleAddMine} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Mine Name</label>
              <input required value={mineForm.name} onChange={e => setMineForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Gevra Open Cast Mine"
                className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Location</label>
                <input required value={mineForm.location} onChange={e => setMineForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Korba, Chhattisgarh"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">State</label>
                <input required value={mineForm.state} onChange={e => setMineForm(f => ({ ...f, state: e.target.value }))}
                  placeholder="e.g. Chhattisgarh"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">District</label>
                <input required value={mineForm.district} onChange={e => setMineForm(f => ({ ...f, district: e.target.value }))}
                  placeholder="e.g. Korba"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Initial Status</label>
                <select value={mineForm.operationalStatus} onChange={e => setMineForm(f => ({ ...f, operationalStatus: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400">
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Latitude</label>
                <input type="number" step="any" value={mineForm.latitude} onChange={e => setMineForm(f => ({ ...f, latitude: e.target.value }))}
                  placeholder="e.g. 22.3595"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Longitude</label>
                <input type="number" step="any" value={mineForm.longitude} onChange={e => setMineForm(f => ({ ...f, longitude: e.target.value }))}
                  placeholder="e.g. 82.7501"
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Initial Risk Level</label>
                <select value={mineForm.riskLevel} onChange={e => setMineForm(f => ({ ...f, riskLevel: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400">
                  {['LOW','MEDIUM','HIGH','CRITICAL'].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Initial Compliance %</label>
                <input type="number" min="0" max="100" value={mineForm.complianceScore}
                  onChange={e => setMineForm(f => ({ ...f, complianceScore: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 bg-[#F47C20] hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs py-2.5 rounded-lg transition">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {submitting ? 'Adding...' : 'Add Mine'}
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); setError(''); }}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Mines',  value: mines.length },
          { label: 'Operational', value: mines.filter(m => m.operationalStatus === 'Operational').length },
          { label: 'High Risk',   value: mines.filter(m => ['HIGH','CRITICAL'].includes(m.riskLevel)).length },
          { label: 'No Manager',  value: mines.filter(m => !m.manager).length },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{s.label}</p>
            <p className={`text-3xl font-black mt-0.5 ${
              (s.label === 'No Manager' || s.label === 'High Risk') && s.value > 0 ? 'text-red-600' : 'text-gray-800'
            }`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Mines list */}
      {loading ? (
        <div className="text-center py-10 text-xs font-bold text-gray-400 animate-pulse">Loading mines...</div>
      ) : (
        <div className="space-y-3">
          {mines.map(mine => (
            <div key={mine.mineId} className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">

              {/* Row header */}
              <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedMine(expandedMine === mine.mineId ? null : mine.mineId)}>
                <div className="flex items-center gap-4">
                  <span className={`${RISK_COLORS[mine.riskLevel] || 'bg-gray-500'} text-white text-[10px] font-extrabold px-2 py-1 rounded font-mono shrink-0`}>
                    {mine.mineId}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-gray-900">{mine.name}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{mine.location}, {mine.state}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Manager</p>
                    <p className={`text-xs font-bold ${mine.manager ? 'text-gray-800' : 'text-red-500'}`}>
                      {mine.manager || 'Not Assigned'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_STYLE[mine.operationalStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {mine.operationalStatus}
                  </span>
                  <span className={`${RISK_COLORS[mine.riskLevel]} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>
                    {mine.riskLevel}
                  </span>
                  {expandedMine === mine.mineId
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* Expanded panel */}
              {expandedMine === mine.mineId && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">

                  {/* ── Change Status ── */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                    <h4 className="text-xs font-extrabold text-gray-700 uppercase flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-[#F47C20]" />Change Operational Status
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => handleChangeStatus(mine.mineId, s)}
                          disabled={changingStatus === mine.mineId || mine.operationalStatus === s}
                          className={`text-xs font-bold py-2 px-3 rounded-lg border-2 transition ${
                            mine.operationalStatus === s
                              ? STATUS_STYLE[s] + ' border-current cursor-default shadow-inner'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-700 disabled:opacity-50'
                          }`}
                        >
                          {changingStatus === mine.mineId && mine.operationalStatus !== s
                            ? <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                            : s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Manager ── */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                    <h4 className="text-xs font-extrabold text-gray-700 uppercase flex items-center gap-1.5">
                      <UserCog className="w-3.5 h-3.5 text-[#F47C20]" />
                      {mine.manager ? 'Change / Remove Mine Manager' : 'Assign Mine Manager'}
                    </h4>

                    {mine.manager && (
                      <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-xs">
                        <span className="text-blue-600 font-semibold">Current: </span>
                        <span className="font-extrabold text-blue-800">{mine.manager}</span>
                      </div>
                    )}

                    {assigningMine === mine.mineId ? (
                      <div className="flex gap-2">
                        <select value={selectedManager} onChange={e => setSelectedManager(e.target.value)}
                          className="flex-1 text-xs border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400">
                          <option value="">Select a Mine Manager...</option>
                          {managers.map(m => (
                            <option key={m.userId} value={m.userId}>
                              {m.name} — {m.mineId ? `at ${m.mineId} (will be moved)` : 'unassigned'}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => handleAssignManager(mine.mineId)} disabled={assigning || !selectedManager}
                          className="flex items-center gap-1.5 bg-[#F47C20] hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition">
                          {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Assign
                        </button>
                        <button onClick={() => { setAssigningMine(null); setSelectedManager(''); }}
                          className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-lg transition">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { setAssigningMine(mine.mineId); setSelectedManager(''); }}
                          className="flex items-center gap-1.5 bg-[#252525] hover:bg-gray-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition">
                          <UserCog className="w-3.5 h-3.5" />
                          {mine.manager ? 'Change Manager' : 'Assign Manager'}
                        </button>
                        {mine.manager && (
                          <button onClick={() => handleRemoveManager(mine.mineId)} disabled={assigning}
                            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg transition">
                            <X className="w-3.5 h-3.5" />Remove Manager
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MineManagement;
