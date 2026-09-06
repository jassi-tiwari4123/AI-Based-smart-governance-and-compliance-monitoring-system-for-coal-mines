import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import { Pickaxe, MapPin, User, Shield, ChevronRight } from 'lucide-react';

const MinesList = () => {
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMines();
  }, []);

  const fetchMines = async () => {
    try {
      const res = await API.get('/mines');
      setMines(res.data);
    } catch (e) {
      console.error("Error fetching mines", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading Coal Mines Index...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">Coal Mines Directory</h1>
          <p className="text-xs text-gray-600">Centralized Governance for All 10 Monitored Open Cast & Underground Mines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mines.map((m) => (
          <div key={m.mineId} className="bg-white border border-gray-300 rounded-md p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between border-b border-gray-200 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-mono text-gray-400 font-bold block">{m.mineId}</span>
                <h3 className="font-extrabold text-sm text-gray-900">{m.name}</h3>
                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{m.district}, {m.state}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold text-white ${
                m.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                m.riskLevel === 'HIGH' ? 'bg-orange-600' :
                m.riskLevel === 'MEDIUM' ? 'bg-amber-600' : 'bg-emerald-600'
              }`}>
                {m.riskLevel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4 bg-gray-50 p-2 rounded">
              <div>
                <span className="text-gray-500 block text-[10px] font-bold">Compliance Index</span>
                <span className="font-extrabold text-gray-900 text-sm">{m.complianceScore}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] font-bold">Manager</span>
                <span className="font-bold text-gray-800 text-xs truncate block">{m.manager}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {m.operationalStatus}
              </span>
              <Link
                to={`/mines/${m.mineId}`}
                className="text-xs font-bold text-[#F47C20] hover:text-orange-700 flex items-center space-x-1"
              >
                <span>View Mine Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MinesList;
