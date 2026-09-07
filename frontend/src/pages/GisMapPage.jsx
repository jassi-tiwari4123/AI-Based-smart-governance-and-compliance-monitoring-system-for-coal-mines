import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { MapPin, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const getRiskColor = (level) => {
  switch (level) {
    case 'CRITICAL': return '#DC2626';
    case 'HIGH':     return '#EA580C';
    case 'MEDIUM':   return '#D97706';
    default:         return '#16A34A';
  }
};

const GisMapPage = () => {
  const [mines, setMines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    API.get('/mines')
      .then(r => setMines(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-53px)]">
      {/* Header bar */}
      <div className="bg-[#252525] text-white px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-[#F47C20]" />
          <span className="font-extrabold text-sm uppercase tracking-wider">GIS Spatial Map — Coal Mine Compliance</span>
        </div>
        <div className="flex items-center space-x-4 text-xs font-semibold">
          {[['CRITICAL','#DC2626'],['HIGH','#EA580C'],['MEDIUM','#D97706'],['LOW','#16A34A']].map(([l,c]) => (
            <span key={l} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full inline-block border-2 border-white/30" style={{background:c}}/>
              {l}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <p className="text-xs font-bold text-gray-500 animate-pulse">Loading mine locations...</p>
            </div>
          ) : (
            <MapContainer
              center={[22.5, 84.5]}
              zoom={6}
              className="w-full h-full"
              style={{ zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mines.map(mine => (
                <CircleMarker
                  key={mine.mineId}
                  center={[mine.latitude, mine.longitude]}
                  radius={mine.riskLevel === 'CRITICAL' ? 16 : mine.riskLevel === 'HIGH' ? 14 : 12}
                  pathOptions={{
                    color: '#fff',
                    weight: 2,
                    fillColor: getRiskColor(mine.riskLevel),
                    fillOpacity: 0.85,
                  }}
                  eventHandlers={{ click: () => setSelected(mine) }}
                >
                  <Popup>
                    <div className="min-w-[200px] text-xs">
                      <p className="font-extrabold text-gray-900 text-sm mb-1">{mine.name}</p>
                      <p className="text-gray-500 mb-2">{mine.location}, {mine.state}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Compliance:</span>
                          <span className="font-extrabold text-gray-800">{mine.complianceScore}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Risk Level:</span>
                          <span className="font-extrabold" style={{color: getRiskColor(mine.riskLevel)}}>{mine.riskLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Manager:</span>
                          <span className="font-semibold text-gray-700">{mine.manager}</span>
                        </div>
                      </div>
                      <a
                        href={`/mines/${mine.mineId}`}
                        className="mt-2 block w-full text-center bg-[#F47C20] text-slate-950 font-bold py-1 rounded text-xs"
                      >
                        View Mine Details →
                      </a>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Side panel */}
        <div className="w-72 bg-white border-l border-gray-300 overflow-y-auto shrink-0">
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 sticky top-0">
            <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Mine Index ({mines.length})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {mines.map(mine => (
              <div
                key={mine.mineId}
                onClick={() => setSelected(mine)}
                className={`p-3 cursor-pointer hover:bg-gray-50 transition ${selected?.mineId === mine.mineId ? 'bg-amber-50 border-l-4 border-[#F47C20]' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-gray-900 truncate">{mine.name}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{mine.location}, {mine.state}
                    </p>
                  </div>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white shrink-0 ml-2"
                    style={{ background: getRiskColor(mine.riskLevel) }}>
                    {mine.riskLevel}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${mine.complianceScore}%`, background: getRiskColor(mine.riskLevel) }}
                      />
                    </div>
                    <span className="text-[11px] font-extrabold text-gray-700">{mine.complianceScore}%</span>
                  </div>
                  <Link to={`/mines/${mine.mineId}`}
                    className="text-[11px] text-amber-600 font-bold hover:underline"
                    onClick={e => e.stopPropagation()}>
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GisMapPage;
