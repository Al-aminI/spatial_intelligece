import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '../lib/utils';
import { SITES } from '../data/sites';

interface MapProps {
  mode: 'EO' | 'FLIR' | 'CRT' | 'NVG' | 'NOIR';
  viewMode: 'TACTICAL' | 'ORBITAL';
  onMove?: (lng: number, lat: number, zoom: number) => void;
  center?: { lng: number; lat: number };
  selectedSite: typeof SITES[0];
  selectedAsset: any | null;
  radarEnabled: boolean;
  satelliteEnabled: boolean;
}

const Map: React.FC<MapProps> = ({ 
  mode, viewMode, onMove, center, 
  selectedSite, selectedAsset, radarEnabled, satelliteEnabled 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [lng] = useState(-97.7431);
  const [lat] = useState(30.2672);
  const [zoom] = useState(11);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const siteMarkers = useRef<maplibregl.Marker[]>([]);
  const radarMarker = useRef<maplibregl.Marker | null>(null);
  const assetMarker = useRef<maplibregl.Marker | null>(null);

  // ... (flyTo effect remains)

  // Handle Site Assets & Connections
  useEffect(() => {
    if (!map.current || !selectedSite || !isMapLoaded) return;

    // Clear existing site markers
    siteMarkers.current.forEach(marker => marker.remove());
    siteMarkers.current = [];

    // Add markers for all assets in the site
    selectedSite.assets.forEach(asset => {
      // Skip if this is the selected asset (it gets a special marker)
      if (selectedAsset && asset.id === selectedAsset.id) return;

      const el = document.createElement('div');
      el.className = 'flex flex-col items-center justify-center group cursor-pointer';
      
      // Icon based on type
      let icon = '';
      switch (asset.type) {
        case 'DRONE': icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h20"/><path d="M12 2v20"/><path d="M6 12h12"/></svg>'; break;
        case 'CAMERA': icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>'; break;
        case 'RADAR': icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="M2 12h2"/><path d="M22 12h-2"/></svg>'; break;
        default: icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';
      }

      el.innerHTML = `
        <div class="w-8 h-8 border border-intel-cyan/50 bg-black/50 rounded-full flex items-center justify-center text-intel-cyan hover:bg-intel-cyan hover:text-black transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)]">
          ${icon}
        </div>
        <div class="absolute -top-6 bg-black/80 border border-intel-cyan/50 text-intel-cyan text-[8px] px-2 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          ${asset.label}
        </div>
      `;

      // Add click listener to select asset? 
      // We don't have a callback for that in props yet, but we can add it later.
      // For now, just visual.

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([asset.coords.lng, asset.coords.lat])
        .addTo(map.current!);
      
      siteMarkers.current.push(marker);
    });

    // Draw Communication Lines
    const sourceId = 'connections-source';
    const layerId = 'connections-layer';

    const features: any[] = [];
    selectedSite.assets.forEach(asset => {
      if (asset.communicatingWith) {
        asset.communicatingWith.forEach(targetId => {
          const target = selectedSite.assets.find(a => a.id === targetId);
          if (target) {
            features.push({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [asset.coords.lng, asset.coords.lat],
                  [target.coords.lng, target.coords.lat]
                ]
              }
            });
          }
        });
      }
    });

    const geojson = {
      type: 'FeatureCollection',
      features: features
    };

    if (map.current.getSource(sourceId)) {
      (map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson as any);
    } else {
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: geojson as any
      });

      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00f0ff',
          'line-width': 1,
          'line-opacity': 0.6,
          'line-dasharray': [2, 4]
        }
      });
    }

  }, [selectedSite, selectedAsset, isMapLoaded]); // Re-run when site or selected asset changes

  // Handle Asset Marker (The selected one)
  // ... (existing code)
  useEffect(() => {
    if (map.current) {
      if (selectedAsset && selectedAsset.coords) {
        map.current.flyTo({
          center: [selectedAsset.coords.lng, selectedAsset.coords.lat],
          zoom: 16,
          pitch: 60,
          essential: true,
          speed: 1.2
        });
      } else if (selectedSite) {
        map.current.flyTo({
          center: [selectedSite.coords.lng, selectedSite.coords.lat],
          zoom: viewMode === 'ORBITAL' ? 3 : 13,
          pitch: viewMode === 'ORBITAL' ? 0 : 45,
          essential: true,
          speed: 1.5
        });
      }
    }
  }, [selectedSite, selectedAsset, viewMode]);

  // Handle Asset Marker
  useEffect(() => {
    if (!map.current) return;

    if (assetMarker.current) {
      assetMarker.current.remove();
      assetMarker.current = null;
    }

    if (selectedAsset && selectedAsset.coords) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      
      // Target Reticle
      el.innerHTML = `
        <div class="w-12 h-12 border-2 border-intel-red rounded-full animate-ping absolute opacity-50"></div>
        <div class="w-8 h-8 border border-intel-red rounded-full flex items-center justify-center bg-intel-red/20 backdrop-blur-sm">
          <div class="w-1 h-1 bg-intel-red"></div>
        </div>
        <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 border border-intel-red text-intel-red text-[8px] px-2 py-0.5 whitespace-nowrap font-bold">
          ${selectedAsset.label}
        </div>
        ${selectedAsset.type === 'CAMERA' ? `
          <div class="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-20 bg-black border border-intel-cyan overflow-hidden shadow-lg z-50">
             <img src="${selectedAsset.feed}" class="w-full h-full object-cover opacity-80" />
             <div class="absolute top-0 left-0 bg-intel-red text-white text-[6px] px-1">LIVE</div>
          </div>
        ` : ''}
      `;

      assetMarker.current = new maplibregl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([selectedAsset.coords.lng, selectedAsset.coords.lat])
        .addTo(map.current);
    }
  }, [selectedAsset]);

  // Handle Radar Overlay
  useEffect(() => {
    if (!map.current) return;

    // Remove existing radar
    if (radarMarker.current) {
      radarMarker.current.remove();
      radarMarker.current = null;
    }

    if (radarEnabled && selectedSite) {
      const el = document.createElement('div');
      el.className = 'radar-sweep flex items-center justify-center';
      
      // Add simulated dots inside radar
      const dot1 = document.createElement('div');
      dot1.className = 'radar-dot';
      dot1.style.top = '30%';
      dot1.style.left = '40%';
      el.appendChild(dot1);

      const dot2 = document.createElement('div');
      dot2.className = 'radar-dot';
      dot2.style.top = '60%';
      dot2.style.left = '70%';
      el.appendChild(dot2);

      radarMarker.current = new maplibregl.Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat([selectedSite.coords.lng, selectedSite.coords.lat])
        .addTo(map.current);
    }
  }, [radarEnabled, selectedSite]);

  // Handle Satellite Overlay
  useEffect(() => {
    if (!map.current) return;

    const sourceId = 'sat-overlay-source';
    const layerId = 'sat-overlay-layer';

    const addOverlay = () => {
      if (!map.current) return;
      if (map.current.getSource(sourceId)) return;

      // Calculate bounding box for overlay (approx +/- 0.02 deg)
      const c = selectedSite.coords;
      const offset = 0.02;
      const coordinates = [
        [c.lng - offset, c.lat + offset], // TL
        [c.lng + offset, c.lat + offset], // TR
        [c.lng + offset, c.lat - offset], // BR
        [c.lng - offset, c.lat - offset]  // BL
      ];

      map.current.addSource(sourceId, {
        type: 'image',
        url: 'https://picsum.photos/seed/satellite/800/800?grayscale', // Placeholder satellite image
        coordinates: coordinates as any
      });

      map.current.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': 0.7,
          'raster-saturation': -0.5,
          'raster-contrast': 0.2
        }
      });
    };

    const removeOverlay = () => {
      if (!map.current) return;
      if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
      if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
    };

    if (satelliteEnabled) {
      if (map.current.loaded()) {
        addOverlay();
      } else {
        map.current.once('load', addOverlay);
      }
    } else {
      removeOverlay();
    }

    // Cleanup when site changes or unmount
    return () => {
      removeOverlay();
    };
  }, [satelliteEnabled, selectedSite]);

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri'
          },
          'labels': {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 22
          },
          {
            id: 'labels-layer',
            type: 'raster',
            source: 'labels',
            minzoom: 0,
            maxzoom: 22,
            paint: {
              'raster-opacity': 0.6
            }
          }
        ]
      },
      center: [lng, lat],
      zoom: zoom,
      pitch: 45,
      bearing: -17.6,
      // @ts-ignore
      projection: 'globe' 
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    map.current.on('move', () => {
      if (map.current && onMove) {
        const center = map.current.getCenter();
        onMove(center.lng, center.lat, map.current.getZoom());
      }
    });

  }, [lng, lat, zoom, onMove]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Container - Conditional Circular Look */}
      <div className={cn(
        "relative transition-all duration-1000 ease-in-out",
        viewMode === 'ORBITAL' 
          ? "w-[85vh] h-[85vh] rounded-full overflow-hidden border border-intel-border/30 shadow-[0_0_50px_rgba(0,240,255,0.1)]" 
          : "w-full h-full rounded-none border-none shadow-none"
      )}>
        <div 
          ref={mapContainer} 
          className={cn(
            "w-full h-full transition-all duration-500",
            mode === 'FLIR' && "flir-mode",
            mode === 'CRT' && "crt-mode",
            mode === 'NVG' && "nvg-mode",
            mode === 'NOIR' && "noir-mode"
          )} 
        />
        
        {/* Inner Shadow for depth (Only in Orbital) */}
        <div className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-1000",
          viewMode === 'ORBITAL' ? "opacity-100 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] rounded-full" : "opacity-0"
        )} />
        
        {/* Grid Overlay inside the globe */}
        <div className={cn(
          "absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,240,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.2)_1px,transparent_1px)] bg-[size:40px_40px]",
          viewMode === 'ORBITAL' && "rounded-full"
        )} />
        
        {/* Rotating Ring (Decorative - Only in Orbital) */}
        {viewMode === 'ORBITAL' && (
          <>
            <div className="absolute inset-[-20px] border border-intel-cyan/20 rounded-full animate-[spin_60s_linear_infinite] pointer-events-none border-dashed" />
            <div className="absolute inset-[-40px] border border-intel-cyan/10 rounded-full animate-[spin_40s_linear_infinite_reverse] pointer-events-none border-dotted" />
          </>
        )}
      </div>
    </div>
  );
};

export default Map;
