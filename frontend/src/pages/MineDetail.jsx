import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ArrowLeft, MapPin, User, Pickaxe, AlertTriangle, ClipboardCheck, ChevronRight, Cpu } from 'lucide-react';

const MineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/dashboard/mine/${id}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading mine details...</div>;
  if (!data?.mine) return <div className="p-8 text-center text-red-500 font-bold">Mine not found.</div>;

  const mine = data.mine;
  const riskBg = mine.riskLevel === 'CRITICAL' ? 'bg-red-600' : mine.riskLevel === 'HIGH' ? 'bg-orange-500' : mine.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-600';

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center space-x-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-200 transition">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Pickaxe className="w-5 h-5 text-[#F47C20]" />{mine.name}
          </h1>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />{mine.location}, {mine.district}, {mine.state}
          </p>
        </div>
      </div>

      {/* Risk Banner */}
      <div className={`${riskBg} text-white rounded-lg p-4 flex items-center justify-between`}>
        <div>
          <p className="font-extrabold text-lg">{mine.mineId}</p>
          <p className="text-white/80 text-xs">{mine.operationalStatus} — Manager: {mine.manager}</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black">{mine.complianceScore}%</p>
          <p className="text-white/70 text-xs">Compliance Score</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Inspections', val: data.inspectionsCount },
          { label: 'Total Violations', val: data.violationsCount },
          { label: 'Open Violations', val: data.openViolationsCount },
          { label: 'Corrective Actions', val: data.correctiveActionsCount },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{k.label}</p>
            <p className="text-3xl font-black text-gray-800 mt-1">{k.val}</p>
          </div>
        ))}
      </div>

      {/* Mine Info */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
        <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Mine Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { label: 'Mine ID', val: mine.mineId },
            { label: 'State', val: mine.state },
            { label: 'District', val: mine.district },
            { label: 'GPS Lat', val: mine.latitude?.toFixed(5) },
            { label: 'GPS Lng', val: mine.longitude?.toFixed(5) },
            { label: 'Risk Level', val: mine.riskLevel },
          ].map((f, i) => (
            <div key={i} className="bg-gray-50 rounded p-2.5">
              <span className="text-gray-400 font-bold uppercase text-[10px] block">{f.label}</span>
              <span className="font-semibold text-gray-800">{f.val || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Violations */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />Recent Violations
          </h3>
          <Link to={`/violations?mineId=${mine.mineId}`} className="text-xs text-amber-600 font-bold hover:underline">View All</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {(data.recentViolations || []).map(v => (
            <div key={v.violationId} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
              <div>
                <p className="text-xs font-bold text-gray-800">{v.title}</p>
                <p className="text-[11px] text-gray-500">{v.violationId} · {v.category} · {v.detectedDate?.split('T')[0]}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${v.severity === 'CRITICAL' ? 'bg-red-600' : v.severity === 'MAJOR' ? 'bg-amber-500' : 'bg-emerald-500'}`}>{v.severity}</span>
                <Link to={`/ai-investigation/${v.violationId}`} className="text-purple-600 hover:text-purple-800">
                  <Cpu className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
          {(!data.recentViolations || data.recentViolations.length === 0) && (
            <p className="text-xs text-gray-400 text-center py-4">No violations on record</p>
          )}
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1">
            <ClipboardCheck className="w-3.5 h-3.5 text-blue-500" />Recent Inspections
          </h3>
          <Link to={`/inspections?mineId=${mine.mineId}`} className="text-xs text-amber-600 font-bold hover:underline">View All</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {(data.recentInspections || []).map(ins => (
            <Link key={ins.inspectionId} to={`/inspections/${ins.inspectionId}`}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition">
              <div>
                <p className="text-xs font-bold text-gray-800">{ins.inspectionId}</p>
                <p className="text-[11px] text-gray-500">{ins.zone} · {ins.category} · {ins.inspectionDate?.split('T')[0]}</p>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${ins.severity === 'CRITICAL' ? 'bg-red-600' : ins.severity === 'MAJOR' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                {ins.severity}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex space-x-3">
        <Link to="/gis"
          className="flex-1 text-center bg-[#252525] hover:bg-gray-700 text-white font-bold text-sm py-2.5 rounded shadow transition">
          View on Map
        </Link>
      </div>
    </div>
  );
};

export default MineDetail;
