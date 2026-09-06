import React, { useState, useEffect } from 'react';
import API from '../services/api';
import MapView from '../components/MapView';

const GisMapPage = () => {
  const [mines, setMines] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGISData();
  }, []);

  const fetchGISData = async () => {
    try {
      const [mRes, vRes] = await Promise.all([
        API.get('/gis/mines'),
        API.get('/gis/violations')
      ]);
      setMines(mRes.data);
      setViolations(vRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs font-bold text-gray-500">Loading GIS Spatial Map Layers...</div>;

  return (
    <div className="p-6 space-y-4 font-sans h-[calc(100vh-70px)] flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-300 pb-3 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 uppercase">GIS Spatial Governance Map</h1>
          <p className="text-xs text-gray-600">Interactive OpenStreetMap Visualization of Mines, Violation Hotspots & Incidents</p>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <MapView mines={mines} violations={violations} center={[22.5, 84.5]} zoom={7} />
      </div>
    </div>
  );
};

export default GisMapPage;
