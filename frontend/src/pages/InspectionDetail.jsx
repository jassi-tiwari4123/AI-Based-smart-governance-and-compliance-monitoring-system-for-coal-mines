import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { ArrowLeft, MapPin, Calendar, User, CheckCircle2, XCircle, ClipboardCheck, AlertTriangle, FileText, Camera } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const map = {
    SUBMITTED: 'bg-blue-100 text-blue-800',
    REVIEWED: 'bg-emerald-100 text-emerald-800',
    IN_PROGRESS: 'bg-amber-100 text-amber-800',
    CLOSED: 'bg-gray-100 text-gray-600',
    DRAFT: 'bg-yellow-100 text-yellow-800',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

const SeverityBadge = ({ severity }) => {
  const map = {
    CRITICAL: 'bg-red-600 text-white',
    MAJOR: 'bg-amber-500 text-white',
    MINOR: 'bg-emerald-500 text-white',
  };
  return <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${map[severity] || 'bg-gray-300'}`}>{severity}</span>;
};

const InspectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/inspections/${id}`)
      .then(r => setInspection(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500 animate-pulse">Loading inspection record...</div>;
  if (!inspection) return <div className="p-8 text-center text-red-500 font-bold">Inspection not found.</div>;

  const passCount = (inspection.checklist || []).filter(c => c.status === 'PASS').length;
  const failCount = (inspection.checklist || []).filter(c => c.status === 'FAIL').length;

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-200 transition">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#F47C20]" />
              {inspection.inspectionId}
            </h1>
            <p className="text-xs text-gray-500">Statutory Field Inspection Record</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status={inspection.status} />
          <SeverityBadge severity={inspection.severity} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Inspection Details</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Mine ID', value: inspection.mineId, icon: <MapPin className="w-3 h-3" /> },
                { label: 'Zone / Area', value: inspection.zone },
                { label: 'Category', value: inspection.category },
                { label: 'Date', value: inspection.inspectionDate?.split('T')[0], icon: <Calendar className="w-3 h-3" /> },
                { label: 'Inspector', value: inspection.inspectorName, icon: <User className="w-3 h-3" /> },
                { label: 'Inspector ID', value: inspection.inspectorId },
              ].map((f, i) => (
                <div key={i} className="bg-gray-50 rounded p-2.5">
                  <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1">{f.icon}{f.label}</span>
                  <span className="text-gray-900 font-semibold mt-0.5 block">{f.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Observations */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
            <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />Field Observations
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed">{inspection.observations}</p>
          </div>

          {/* Checklist */}
          {inspection.checklist && inspection.checklist.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Compliance Checklist</h3>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle2 className="w-3.5 h-3.5"/>{passCount} PASS</span>
                  <span className="flex items-center gap-1 text-red-600 font-bold"><XCircle className="w-3.5 h-3.5"/>{failCount} FAIL</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {inspection.checklist.map((item, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded border text-xs ${
                    item.status === 'PASS' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <span className="font-semibold text-gray-700">{item.item}</span>
                    <span className={`font-extrabold flex items-center gap-1 ${item.status === 'PASS' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {item.status === 'PASS' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* GPS */}
          {inspection.gpsLocation && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#F47C20]" />GPS Location
              </h3>
              <p className="text-xs font-mono text-gray-600">Lat: {inspection.gpsLocation.lat?.toFixed(5)}</p>
              <p className="text-xs font-mono text-gray-600">Lng: {inspection.gpsLocation.lng?.toFixed(5)}</p>
            </div>
          )}

          {/* Photos */}
          {inspection.photos && inspection.photos.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4">
              <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" />Photo Evidence
              </h3>
              {inspection.photos.map((p, i) => (
                <p key={i} className="text-xs text-gray-500 font-mono truncate">{p}</p>
              ))}
            </div>
          )}

          {/* Severity indicator */}
          <div className={`rounded-lg p-4 ${
            inspection.severity === 'CRITICAL' ? 'bg-red-50 border border-red-200' :
            inspection.severity === 'MAJOR' ? 'bg-amber-50 border border-amber-200' :
            'bg-emerald-50 border border-emerald-200'
          }`}>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">Severity</p>
            <SeverityBadge severity={inspection.severity} />
            {inspection.severity === 'CRITICAL' && (
              <p className="text-xs text-red-700 mt-2 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />Immediate corrective action required
              </p>
            )}
          </div>

          {/* Related violations link */}
          <Link
            to={`/violations?inspectionId=${inspection.inspectionId}`}
            className="block bg-white border border-gray-300 rounded-lg shadow-sm p-4 hover:bg-gray-50 transition text-xs"
          >
            <span className="font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />View Related Violations →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InspectionDetail;
