import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Smartphone, ClipboardCheck, Flame,
  CheckCircle2, ChevronRight, MapPin, Calendar, AlertTriangle
} from 'lucide-react';

const InspectorDashboard = () => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [insRes, incRes] = await Promise.all([
        API.get('/inspections'),
        API.get('/incidents'),
      ]);
      setInspections(insRes.data || []);
      setIncidents(incRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const myInspections = inspections.filter(i => i.inspectorId === user?.userId);
  const myIncidents   = incidents.filter(i => i.reporterId === user?.userId);

  const totalInspections = myInspections.length;
  const criticalCount    = myInspections.filter(i => i.severity === 'CRITICAL').length;
  const recentInspections = myInspections.slice(0, 5);
  const recentIncidents   = myIncidents.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-300 pb-4">
        <h1 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">
          Field Inspector Portal
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Welcome, <span className="font-bold text-gray-700">{user?.name}</span> — DGMS Safety Inspector
        </p>
      </div>

      {/* CTA */}
      <Link
        to="/inspections/create"
        className="flex items-center justify-between bg-[#252525] hover:bg-gray-800 text-white rounded-xl p-5 shadow-lg transition group"
      >
        <div className="flex items-center space-x-4">
          <div className="bg-[#F47C20] p-3 rounded-lg">
            <Smartphone className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <p className="font-extrabold text-lg">Start New Field Inspection</p>
            <p className="text-gray-400 text-xs mt-0.5">File a statutory compliance observation at the mine site</p>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-[#F47C20] group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'My Inspections', value: totalInspections, icon: ClipboardCheck, color: 'text-blue-600' },
          { label: 'Critical Reports', value: criticalCount, icon: AlertTriangle, color: 'text-red-600' },
          { label: 'This Month', value: myInspections.filter(i => new Date(i.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length, icon: Calendar, color: 'text-amber-600' },
          { label: 'Reviewed', value: myInspections.filter(i => i.status === 'REVIEWED').length, icon: CheckCircle2, color: 'text-emerald-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{k.label}</span>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <span className={`text-3xl font-black ${k.color}`}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'My Inspections', desc: 'View all your filed inspection reports', path: '/inspections', icon: ClipboardCheck, color: 'text-blue-600' },
          { label: 'My Incidents', desc: 'View incidents you have reported', path: '/incidents/mine', icon: Flame, color: 'text-orange-600' },
        ].map((item, i) => (
          <Link key={i} to={item.path}
            className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 hover:border-amber-300 hover:shadow-md transition flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div>
                <p className="text-sm font-extrabold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        ))}
      </div>

      {/* Recent Inspections */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
            My Recent Inspections
          </h3>
          <Link to="/inspections" className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <p className="text-xs text-gray-400 text-center py-6 animate-pulse">Loading...</p>
        ) : recentInspections.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-500">No inspections filed yet</p>
            <p className="text-xs text-gray-400 mt-1">Start by filing your first field inspection</p>
            <Link to="/inspections/create"
              className="mt-3 inline-block bg-[#F47C20] text-slate-950 font-bold text-xs px-4 py-2 rounded shadow transition hover:bg-orange-600">
              + File First Inspection
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentInspections.map(ins => (
              <Link key={ins.inspectionId} to={`/inspections/${ins.inspectionId}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                <div>
                  <p className="text-xs font-bold text-gray-800">{ins.inspectionId}</p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3 h-3" />{ins.mineId} — {ins.zone}
                    <span>·</span>
                    <Calendar className="w-3 h-3" />{ins.inspectionDate?.split('T')[0]}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                    ins.severity === 'CRITICAL' ? 'bg-red-600' :
                    ins.severity === 'MAJOR' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>{ins.severity}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ins.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>{ins.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My Reported Incidents */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            My Reported Incidents
          </h3>
          <Link to="/incidents/mine" className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <p className="text-xs text-gray-400 text-center py-6 animate-pulse">Loading...</p>
        ) : recentIncidents.length === 0 ? (
          <div className="text-center py-8">
            <Flame className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-500">No incidents reported yet</p>
            <p className="text-xs text-gray-400 mt-1">Report any safety or operational incidents you observe</p>
            <Link to="/incidents/report"
              className="mt-3 inline-block bg-red-600 text-white font-bold text-xs px-4 py-2 rounded shadow transition hover:bg-red-700">
              + Report Incident
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentIncidents.map(inc => (
              <div key={inc.incidentId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-gray-800">{inc.incidentId}</p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3 h-3" />{inc.mineId} — {inc.zone}
                    <span>·</span>
                    <Calendar className="w-3 h-3" />{inc.reportedAt?.split('T')[0]}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-xs">{inc.category}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                    inc.severity === 'CRITICAL' ? 'bg-red-600' :
                    inc.severity === 'MAJOR'    ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>{inc.severity}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                  }`}>{inc.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default InspectorDashboard;
