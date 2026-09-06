import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import MapView from '../components/MapView';
import { Pickaxe, MapPin, User, AlertTriangle, ClipboardCheck, ArrowLeft, Shield } from 'lucide-react';

const MineDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMineDetail();
  }, [id]);

  const fetchMineDetail = async () => {
    try {
      const res = await API.get(`/dashboard/mine/${id}`);
      setData(res.data);
    } catch (e) {
      console.error("Error fetching mine detail", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Mine Details...</div>;
  if (!data?.mine) return <div className="p-8 text-center text-xs text-red-600 font-bold">Mine record not found.</div>;

  const mine = data.mine;

  return (
    <div className="p-6 space-y-6">
      <Link to="/mines" className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center space-x-1">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Mines Directory</span>
      </Link>

      {/* Header Info */}
      <div className="bg-white border border-gray-300 rounded-md p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-amber-600 uppercase">{mine.mineId}</span>
          <h1 className="text-2xl font-extrabold text-gray-900">{mine.name}</h1>
          <div className="flex items-center space-x-3 text-xs text-gray-600 mt-1">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>{mine.location}, {mine.district}, {mine.state}</span>
            </span>
            <span>• Manager: <strong>{mine.manager}</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-center px-4 py-2 bg-gray-50 rounded border border-gray-200">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Compliance Score</span>
            <span className="text-2xl font-black text-gray-900">{mine.complianceScore}%</span>
          </div>
          <div className={`px-4 py-2.5 rounded text-xs font-extrabold text-white text-center ${
            mine.riskLevel === 'CRITICAL' ? 'bg-red-600' : 'bg-emerald-600'
          }`}>
            <span>{mine.riskLevel} RISK</span>
          </div>
        </div>
      </div>

      {/* Map & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96">
          <MapView mines={[mine]} center={[mine.latitude || 20.95, mine.longitude || 85.09]} zoom={12} />
        </div>

        {/* Quick Stats Sidebar */}
        <div className="bg-white border border-gray-300 rounded-md p-4 space-y-4 shadow-sm">
          <h3 className="text-xs font-extrabold uppercase text-gray-900 border-b border-gray-200 pb-2">
            Mine Operations Summary
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600 font-medium">Total Inspections Logged:</span>
              <span className="font-extrabold text-gray-900">{data.inspectionsCount}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600 font-medium">Open Violations:</span>
              <span className="font-extrabold text-amber-600">{data.openViolationsCount}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-600 font-medium">Corrective Actions:</span>
              <span className="font-extrabold text-gray-900">{data.correctiveActionsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Status:</span>
              <span className="font-bold text-emerald-700">{mine.operationalStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Violations Table */}
      <div className="bg-white border border-gray-300 rounded-md shadow-sm overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-300 font-bold text-xs text-gray-900 uppercase">
          Recent Non-Compliance Violations ({data.recentViolations?.length})
        </div>
        <div className="divide-y divide-gray-200 text-xs">
          {data.recentViolations?.map((v) => (
            <div key={v.violationId} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-gray-900">{v.violationId}</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">{v.category}</span>
                </div>
                <p className="text-gray-700 font-medium mt-1">{v.title}</p>
              </div>
              <Link to={`/violations/${v.violationId}`} className="text-amber-600 font-bold hover:underline">
                Details →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MineDetail;
