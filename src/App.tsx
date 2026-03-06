import React, { useState } from 'react';
import Map from './components/Map';
import HUD from './components/HUD';
import { SITES } from './data/sites';

export default function App() {
  const [mode, setMode] = useState<'EO' | 'FLIR' | 'CRT' | 'NVG' | 'NOIR'>('EO');
  const [viewMode, setViewMode] = useState<'TACTICAL' | 'ORBITAL'>('TACTICAL');
  const [coords, setCoords] = useState({ lng: -97.7431, lat: 30.2672, zoom: 13 });
  
  // New State
  const [selectedSite, setSelectedSite] = useState(SITES[0]);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [radarEnabled, setRadarEnabled] = useState(false);
  const [satelliteEnabled, setSatelliteEnabled] = useState(false);

  const handleMapMove = (lng: number, lat: number, zoom: number) => {
    setCoords({ lng, lat, zoom });
  };

  return (
    <div className="relative w-screen h-screen bg-intel-bg overflow-hidden">
      {/* The Map Layer */}
      <Map 
        mode={mode} 
        viewMode={viewMode}
        onMove={handleMapMove} 
        selectedSite={selectedSite}
        selectedAsset={selectedAsset}
        radarEnabled={radarEnabled}
        satelliteEnabled={satelliteEnabled}
      />

      {/* The HUD Layer */}
      <HUD 
        mode={mode} 
        setMode={setMode} 
        coords={coords} 
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedSite={selectedSite}
        setSelectedSite={setSelectedSite}
        selectedAsset={selectedAsset}
        setSelectedAsset={setSelectedAsset}
        radarEnabled={radarEnabled}
        setRadarEnabled={setRadarEnabled}
        satelliteEnabled={satelliteEnabled}
        setSatelliteEnabled={setSatelliteEnabled}
      />

      {/* Global Vignette */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] z-40" />
      
      {/* CRT Flicker Effect (Optional, subtle) */}
      <div className="fixed inset-0 pointer-events-none crt-flicker z-[60] bg-white/5 mix-blend-overlay opacity-10" />
    </div>
  );
}
