import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { ArrowLeft, MapPin, Calendar, User, ShieldCheck, CheckSquare } from 'lucide-react';

const InspectionDetail = () => {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const res = await API.get(`/inspections/${id}`);
      setInspection(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Inspection Record...</div>;
  if (!inspection) return <div className="p-8 text-center text-xs font-bold text-red-600">Inspection record not found.</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-sans">
      <Link to="/inspections" className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center space-x-1">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Inspections Register</span>
      </Link>

      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <span className="text-xs font-mono font-bold text-amber-600">{inspection.inspectionId}</span>
            <h1 className="text-xl font-extrabold text-gray-900">Statutory {inspection.category} Inspection</h1>
            <p className="text-xs text-gray-600 mt-1">Mine ID: {inspection.mineId} | Zone: {inspection.zone}</p>
          </div>
          <span className={`px-3 py-1 rounded text-xs font-extrabold text-white ${
            inspection.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-amber-600'
          }`}>
            {inspection.severity} SEVERITY
          </span>
        </div>

        <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2 text-xs">
          <span className="font-extrabold text-gray-800 uppercase block">Inspector Observation:</span>
          <p className="text-gray-700 font-medium">{inspection.observations}</p>
        </div>

        {/* Checklist */}
        {inspection.checklist && inspection.checklist.length > 0 && (
          <div>
            <h3 className="text-xs font-extrabold text-gray-900 uppercase mb-2">Checklist Verification Items</h3>
            <div className="space-y-1 text-xs">
              {inspection.checklist.map((chk, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                  <span className="font-medium text-gray-700">{chk.item}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    chk.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {chk.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
          <span>Inspector: <strong>{inspection.inspectorName}</strong></span>
          <span>Date: <strong>{new Date(inspection.inspectionDate).toLocaleString()}</strong></span>
          <span>Status: <strong className="text-emerald-700">{inspection.status}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default InspectionDetail;
