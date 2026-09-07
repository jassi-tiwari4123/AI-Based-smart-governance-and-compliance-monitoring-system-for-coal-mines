import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { CalendarDays, Users, Search, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_COLORS = {
  PRESENT:  'bg-emerald-100 text-emerald-800',
  ABSENT:   'bg-red-100 text-red-800',
  HALF_DAY: 'bg-amber-100 text-amber-800',
  LEAVE:    'bg-blue-100 text-blue-800',
};

const AttendanceRow = ({ record }) => {
  const [expanded, setExpanded] = useState(false);
  const total = record.totalWorkers || 0;
  const pct   = total ? Math.round((record.presentCount / total) * 100) : 0;

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs font-extrabold text-gray-800">{record.date}</p>
            <p className="text-[10px] text-gray-400">{record.contractorName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-500">{total} workers</span>
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-bold text-emerald-600">{pct}% present</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">P: {record.presentCount}</span>
            <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded">A: {record.absentCount}</span>
            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">H: {record.halfDayCount}</span>
            <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">L: {record.leaveCount}</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && record.records?.length > 0 && (
        <div className="border-t border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Worker ID</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {record.records.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-gray-600">{r.workerId}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-600'}`}>
                      {r.status}
                    </span>
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

const AttendanceReport = () => {
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from_date', fromDate);
      if (toDate)   params.append('to_date', toDate);
      const res = await API.get(`/attendance?${params.toString()}`);
      setRecords(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, []);

  const filtered = records.filter(r =>
    !search || r.contractorName?.toLowerCase().includes(search.toLowerCase()) || r.date?.includes(search)
  );

  const totalPresent = filtered.reduce((s, r) => s + (r.presentCount || 0), 0);
  const totalWorkers = filtered.reduce((s, r) => s + (r.totalWorkers || 0), 0);
  const avgAttendance = totalWorkers ? Math.round((totalPresent / totalWorkers) * 100) : 0;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-300 pb-4">
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#F47C20]" />Attendance Report
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Worker attendance submitted by contractors at your mine</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Records',    value: filtered.length,   color: 'text-gray-800' },
          { label: 'Total Present',    value: totalPresent,      color: 'text-emerald-600' },
          { label: 'Avg Attendance',   value: `${avgAttendance}%`, color: avgAttendance >= 80 ? 'text-emerald-600' : 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{s.label}</p>
            <p className={`text-3xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by contractor or date..."
            className="flex-1 text-xs border-0 focus:ring-0 outline-none" />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
          <CalendarDays className="w-3.5 h-3.5" />From
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-400" />
          To
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-400" />
          <button onClick={fetchRecords}
            className="bg-[#F47C20] hover:bg-orange-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded transition">
            Apply
          </button>
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(''); setToDate(''); fetchRecords(); }}
              className="text-gray-500 hover:text-gray-700 font-bold text-xs px-2 py-1.5 rounded border border-gray-300 transition">
              Clear
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400 font-semibold">{filtered.length} records</span>
      </div>

      {/* Records */}
      {loading ? (
        <div className="text-center py-10 text-xs font-bold text-gray-400 animate-pulse">Loading attendance...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm text-center py-14">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">No attendance records found</p>
          <p className="text-xs text-gray-400 mt-1">Contractors submit attendance daily from their portal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => <AttendanceRow key={i} record={r} />)}
        </div>
      )}
    </div>
  );
};

export default AttendanceReport;
