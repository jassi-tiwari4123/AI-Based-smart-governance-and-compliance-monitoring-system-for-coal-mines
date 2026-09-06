import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Create custom colored markers using SVG data URIs
const createIcon = (color) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="28" height="28" stroke="#ffffff" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

const icons = {
  LOW: createIcon('#16A34A'),      // Green
  MEDIUM: createIcon('#D97706'),   // Amber
  HIGH: createIcon('#EA580C'),     // Orange
  CRITICAL: createIcon('#DC2626'), // Red
  INSPECTION: createIcon('#2563EB')// Blue
};

const MapView = ({ mines = [], violations = [], incidents = [], center = [22.0, 84.5], zoom = 7 }) => {
  return (
    <div className="w-full h-full min-h-[400px] relative rounded-md overflow-hidden border border-gray-300 shadow-inner">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Mines Markers */}
        {mines.map((mine) => {
          const icon = icons[mine.riskLevel] || icons.LOW;
          return (
            <Marker key={mine.id || mine.mineId} position={[mine.latitude || 20.95, mine.longitude || 85.09]} icon={icon}>
              <Popup>
                <div className="text-xs">
                  <div className="font-extrabold text-sm text-gray-900">{mine.name}</div>
                  <div className="text-gray-600 font-medium">{mine.district}, {mine.state}</div>
                  <div className="mt-1 flex items-center justify-between gap-2 border-t pt-1">
                    <span className="font-bold">Compliance: {mine.complianceScore}%</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${mine.riskLevel === 'CRITICAL' ? 'bg-red-600' : 'bg-amber-600'}`}>
                      {mine.riskLevel}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Violations Hotspot Markers */}
        {violations.map((v) => {
          const icon = icons[v.riskLevel] || icons.CRITICAL;
          return (
            <Marker key={v.id || v.violationId} position={[v.latitude || 20.9167, v.longitude || 85.1500]} icon={icon}>
              <Popup>
                <div className="text-xs">
                  <div className="font-extrabold text-red-700">{v.id} - {v.title}</div>
                  <div className="text-gray-600">{v.category} | Severity: {v.severity}</div>
                  <div className="font-bold text-gray-900 mt-1">Risk Score: {v.riskScore}/100</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-[#252525]/90 backdrop-blur-md text-white p-2.5 rounded border border-gray-700 text-[11px] shadow-lg z-[1000] flex items-center space-x-3">
        <div className="flex items-center space-x-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span>Low</span></div>
        <div className="flex items-center space-x-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span>Medium</span></div>
        <div className="flex items-center space-x-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span><span>High</span></div>
        <div className="flex items-center space-x-1"><span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span><span>Critical</span></div>
      </div>
    </div>
  );
};

export default MapView;
