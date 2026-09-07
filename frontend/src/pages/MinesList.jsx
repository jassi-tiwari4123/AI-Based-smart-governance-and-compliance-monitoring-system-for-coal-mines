import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Pickaxe, MapPin, Search, ChevronRight } from 'lucide-react';

const getRiskBg = (level) => {
  switch (level) {
    case 'CRITICAL': return 'bg-red-600';
    case 'HIGH':     return 'bg-orange-600';
    case 'MEDIUM':   return 'bg-amber-500';
    default:         return 'bg-emerald-600';
  }
};

const MinesList = () => {
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterRisk, setFilterRisk] = useState('');

  useEffect(() => {
    API.get('/mines')
      .then(r => setMines(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const states = [...new Set(mines.map(m => m.state))].sort();
  const filtered = mines.filter(m => {
    if (search && !JSON.stringify(m).toLowerCase().includes(search.toLowerCase())) return false;
    if (filterState && m.state !== filterState) return false;
    if (filterRisk && m.riskLevel !== filterRisk) return false;
    return true;
  });

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading mines...</div>;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Pickaxe className="w-5 h-5 text-[#F47C20]" />Coal Mines Index
          </h1>
          <p className="text-xs text-gray-500">{mines.length} mines monitored across India</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap gap-3 shadow-sm">
        <div className="flex items-center space-x-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mines..."
            className="w-full text-xs border-0 focus:ring-0 outline-none" />
        </div>
        <select value={filterState} onChange={e => setFilterState(e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-400">
          <option value="">All States</option>
          {states.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-amber-400">
          <option value="">All Risk Levels</option>
          {['CRITICAL','HIGH','MEDIUM','LOW'].map(r => <option key={r}>{r}</option>)}
        </select>
        <span className="text-xs text-gray-400 font-semibold self-center">{filtered.length} results</span>
      </div>

      {/* Mine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(mine => (
          <Link key={mine.mineId} to={`/mines/${mine.mineId}`}
            className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-amber-300 transition overflow-hidden">
            <div className={`${getRiskBg(mine.riskLevel)} text-white px-4 py-2.5 flex items-center justify-between`}>
              <span className="font-mono text-[11px] font-bold">{mine.mineId}</span>
              <span className="text-[11px] font-extrabold">{mine.riskLevel} RISK</span>
            </div>
            <div className="p-4">
              <h3 className="font-extrabold text-gray-900 text-sm leading-tight">{mine.name}</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />{mine.location}, {mine.state}
              </p>
              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-500 font-semibold">Compliance Score</span>
                    <span className="font-extrabold text-gray-800">{mine.complianceScore}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${mine.complianceScore >= 85 ? 'bg-emerald-500' : mine.complianceScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${mine.complianceScore}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-gray-500">Manager: <span className="font-semibold text-gray-700">{mine.manager}</span></span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mine.operationalStatus === 'Operational' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {mine.operationalStatus}
                  </span>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between">
              <span className="text-[11px] text-gray-400">{mine.district}, {mine.state}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MinesList;
