import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Shield, 
  Radio, 
  Map as MapIcon, 
  Plane, 
  Satellite, 
  Camera, 
  Crosshair,
  Wifi,
  Battery,
  Lock,
  Cpu,
  Globe,
  Zap,
  Layers,
  Eye,
  Settings,
  Maximize,
  CloudRain,
  Car,
  Video,
  Aperture,
  Moon,
  Sun,
  Monitor,
  Search,
  Target,
  Radar,
  Database,
  Network,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { SITES } from '../data/sites';

interface HUDProps {
  mode: 'EO' | 'FLIR' | 'CRT' | 'NVG' | 'NOIR';
  setMode: (mode: 'EO' | 'FLIR' | 'CRT' | 'NVG' | 'NOIR') => void;
  coords: { lng: number; lat: number; zoom: number };
  viewMode: 'TACTICAL' | 'ORBITAL';
  setViewMode: (mode: 'TACTICAL' | 'ORBITAL') => void;
  selectedSite: typeof SITES[0];
  setSelectedSite: (site: typeof SITES[0]) => void;
  selectedAsset: any | null;
  setSelectedAsset: (asset: any | null) => void;
  radarEnabled: boolean;
  setRadarEnabled: (enabled: boolean) => void;
  satelliteEnabled: boolean;
  setSatelliteEnabled: (enabled: boolean) => void;
}

const HUD: React.FC<HUDProps> = ({ 
  mode, setMode, coords, viewMode, setViewMode, 
  selectedSite, setSelectedSite, 
  selectedAsset, setSelectedAsset,
  radarEnabled, setRadarEnabled,
  satelliteEnabled, setSatelliteEnabled
}) => {
  const [time, setTime] = useState(new Date());
  const [isScanning, setIsScanning] = useState(false);
  const [panopticEnabled, setPanopticEnabled] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assetDetailsExpanded, setAssetDetailsExpanded] = useState(false);
  const [feedModalOpen, setFeedModalOpen] = useState(false);
  const [multiViewOpen, setMultiViewOpen] = useState(false);
  
  // Simulated live feed update
  const [feedUpdate, setFeedUpdate] = useState(0);

  // Calculate grid connections
  const getConnections = () => {
    if (!selectedSite || !selectedSite.assets) return [];
    const connections: { start: number; end: number; id: string }[] = [];
    
    selectedSite.assets.forEach((asset, index) => {
      if (asset.communicatingWith) {
        asset.communicatingWith.forEach(targetId => {
          const targetIndex = selectedSite.assets.findIndex(a => a.id === targetId);
          if (targetIndex !== -1 && targetIndex > index) { // Avoid duplicates
            connections.push({
              start: index,
              end: targetIndex,
              id: `${asset.id}-${targetId}`
            });
          }
        });
      }
    });
    return connections;
  };

  // Helper to get coordinates for a grid index (assuming 3 columns for LG, 2 for MD, 1 for SM)
  // This is a simplified visual approximation for the SVG overlay
  const getLineCoords = (index: number, total: number) => {
    // We'll use percentages
    // Default to 3 columns (LG)
    let cols = 3;
    if (window.innerWidth < 768) cols = 1;
    else if (window.innerWidth < 1024) cols = 2;

    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Center of the cell in %
    const x = (col * (100 / cols)) + (100 / cols / 2);
    // Approximate row height is tricky in CSS grid without fixed aspect ratio container
    // But our cards are aspect-video.
    // Let's assume a standard gap.
    // For the SVG overlay to work perfectly, it needs to match the grid's layout logic.
    // A simpler way is to just draw lines between the centers of the slots if we assume a fixed grid.
    
    // Actually, getting exact coordinates is hard without refs.
    // Let's try a different visual approach:
    // Render the lines as absolute elements connecting the cards? No, that's messy.
    // Let's stick to the SVG overlay but make it "good enough" for the visual effect.
    
    // We will assume the grid is uniform.
    // We need to know the row height relative to width to place Y correctly in %.
    // This is hard.
    
    // ALTERNATIVE:
    // Don't draw lines. Draw "connection indicators" on the cards themselves.
    // "LINKED TO: [ID]"
    
    // BUT the user asked for "connecting lines".
    
    // Let's try to use the refs approach.
    return { x, y: 0 }; // Placeholder
  };

  // Ref for the grid container to calculate line positions
  const gridRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; key: string }[]>([]);

  useEffect(() => {
    if (!multiViewOpen) return;

    const calculateLines = () => {
      if (!gridRef.current) return;
      const grid = gridRef.current;
      const items = Array.from(grid.children).filter(c => !c.classList.contains('connection-overlay'));
      const newLines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];

      selectedSite.assets.forEach((asset, index) => {
        if (asset.communicatingWith) {
          asset.communicatingWith.forEach(targetId => {
            const targetIndex = selectedSite.assets.findIndex(a => a.id === targetId);
            if (targetIndex !== -1 && targetIndex > index) {
              const startEl = items[index] as HTMLElement;
              const endEl = items[targetIndex] as HTMLElement;
              
              if (startEl && endEl) {
                // Get positions relative to grid container
                const startRect = startEl.getBoundingClientRect();
                const endRect = endEl.getBoundingClientRect();
                const gridRect = grid.getBoundingClientRect();

                newLines.push({
                  x1: startRect.left - gridRect.left + startRect.width / 2,
                  y1: startRect.top - gridRect.top + startRect.height / 2,
                  x2: endRect.left - gridRect.left + endRect.width / 2,
                  y2: endRect.top - gridRect.top + endRect.height / 2,
                  key: `${asset.id}-${targetId}`
                });
              }
            }
          });
        }
      });
      setLines(newLines);
    };

    // Calculate immediately and on resize
    calculateLines();
    // Small delay to allow layout to settle
    setTimeout(calculateLines, 100);
    
    window.addEventListener('resize', calculateLines);
    return () => window.removeEventListener('resize', calculateLines);
  }, [multiViewOpen, selectedSite]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const feedTimer = setInterval(() => setFeedUpdate(prev => prev + 1), 5000); 
    return () => { clearInterval(timer); clearInterval(feedTimer); };
  }, []);

  const handleSiteSelect = (site: typeof SITES[0]) => {
    setSelectedSite(site);
    setSelectedAsset(null);
    setAssetDetailsExpanded(false);
  };

  const handleAssetSelect = (asset: any) => {
    setSelectedAsset(asset);
    setAssetDetailsExpanded(false); // Default to collapsed
  };

  const triggerScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 4000);
  };

  return (
    <div className={cn(
      "fixed inset-0 pointer-events-none z-50 flex flex-col p-4 font-mono text-[10px] uppercase tracking-widest text-intel-cyan select-none",
      isScanning && "animate-pulse"
    )}>
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto mb-4 z-50">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1 cursor-pointer" onClick={() => setViewMode(viewMode === 'TACTICAL' ? 'ORBITAL' : 'TACTICAL')}>
            <Globe className={cn("w-6 h-6 text-intel-cyan transition-all duration-1000", viewMode === 'ORBITAL' ? "animate-spin-slow" : "")} />
            <h1 className="text-2xl font-bold tracking-[0.2em] text-white">AEGIS // {viewMode}</h1>
          </div>
          <div className="flex items-center gap-2 text-intel-cyan/60 text-[9px]">
            <span className="text-intel-amber">TOP SECRET // SI-TK // NOFORN</span>
            <span>OPS-4117 // {selectedSite.name}</span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-intel-red animate-pulse" />
            <span className="text-intel-red font-bold">REC {format(time, 'HH:mm:ss')}Z</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setViewMode('TACTICAL')}
              className={cn("intel-button", viewMode === 'TACTICAL' && "active")}
            >
              TACTICAL
            </button>
            <button 
              onClick={() => setViewMode('ORBITAL')}
              className={cn("intel-button", viewMode === 'ORBITAL' && "active")}
            >
              ORBITAL
            </button>
            <button 
              onClick={() => setMultiViewOpen(true)}
              className={cn("intel-button", multiViewOpen && "active")}
            >
              <LayoutGrid className="w-3 h-3 mr-1" />
              MULTI
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex justify-between items-center relative z-40">
        
        {/* Left Panel - Assets List */}
        <div className="w-80 flex flex-col gap-4 pointer-events-auto h-[calc(100vh-200px)]">
          <div className="intel-panel p-4 flex-1 overflow-hidden flex flex-col bg-black/40 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4 border-b border-intel-border/30 pb-2">
              <span className="font-bold text-white">ASSETS // {selectedSite.name}</span>
              <Database className="w-3 h-3" />
            </div>
            
            <div className="space-y-2 overflow-y-auto pr-2 flex-1">
              {selectedSite.assets.map((asset, i) => (
                <div 
                  key={i}
                  onClick={() => handleAssetSelect(asset)}
                  className={cn(
                    "p-3 border border-intel-border/30 hover:bg-intel-cyan/10 cursor-pointer transition-all group relative overflow-hidden",
                    selectedAsset?.id === asset.id && "border-intel-cyan bg-intel-cyan/5"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      {asset.type === 'DRONE' && <Plane className="w-3 h-3 text-intel-cyan" />}
                      {asset.type === 'CAMERA' && <Video className="w-3 h-3 text-intel-red" />}
                      {asset.type === 'RADAR' && <Radar className="w-3 h-3 text-intel-amber" />}
                      {asset.type === 'GROUND' && <Car className="w-3 h-3 text-intel-green" />}
                      {asset.type === 'SATELLITE' && <Satellite className="w-3 h-3 text-white" />}
                      {asset.type === 'NETWORK' && <Network className="w-3 h-3 text-purple-400" />}
                      <span className="font-bold text-white group-hover:text-intel-cyan">{asset.label}</span>
                    </div>
                    <span className={cn("text-[8px] px-1 rounded", asset.status === 'LIVE' ? "bg-intel-red text-white animate-pulse" : "bg-intel-border text-intel-cyan")}>
                      {asset.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-[8px] opacity-60 mt-2">
                    <span>ID: {asset.id.toUpperCase()}</span>
                    {asset.battery && <span>BAT: {asset.battery}%</span>}
                    {asset.range && <span>RNG: {asset.range}</span>}
                    {asset.bandwidth && <span>BW: {asset.bandwidth}</span>}
                  </div>

                  {/* Connecting Line Effect */}
                  {selectedAsset?.id === asset.id && (
                    <motion.div 
                      layoutId="active-asset-glow"
                      className="absolute inset-0 border-2 border-intel-cyan opacity-50 pointer-events-none"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Active Asset Detail / Feed */}
            {selectedAsset && (
              <div className="mt-4 pt-4 border-t border-intel-border/30">
                <div 
                  className="flex justify-between items-center mb-2 cursor-pointer hover:bg-intel-cyan/5 p-1 rounded"
                  onClick={() => setAssetDetailsExpanded(!assetDetailsExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-intel-cyan">FEED // {selectedAsset.label}</span>
                    <span className="text-[8px] text-white/50">{assetDetailsExpanded ? '[OPEN]' : '[COLLAPSED]'}</span>
                  </div>
                  {assetDetailsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>

                <AnimatePresence>
                  {assetDetailsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-intel-border group mb-2">
                        {selectedAsset.type === 'CAMERA' ? (
                          <img 
                            src={`${selectedAsset.feed}?t=${feedUpdate}`} 
                            className="w-full h-full object-cover" 
                            onError={(e) => (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/400/225'} 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-intel-dark relative overflow-hidden">
                            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-20">
                              {[...Array(64)].map((_, i) => <div key={i} className="border border-intel-cyan/20" />)}
                            </div>
                            <Radar className="w-12 h-12 text-intel-cyan animate-spin-slow opacity-50" />
                            <div className="absolute inset-0 bg-gradient-to-t from-intel-cyan/10 to-transparent animate-scan" />
                            <span className="absolute bottom-2 left-2 text-intel-cyan animate-pulse">NO OPTICAL FEED // TELEMETRY ONLY</span>
                          </div>
                        )}
                        
                        {/* Feed Overlays */}
                        <div className="absolute top-2 left-2 bg-black/80 px-1 text-[8px] text-white flex items-center gap-1">
                          <div className="w-1 h-1 bg-intel-red rounded-full animate-pulse" />
                          LIVE
                        </div>

                        {/* Maximize Button */}
                        <div 
                          className="absolute top-2 right-2 bg-black/80 p-1 rounded cursor-pointer hover:bg-intel-cyan hover:text-black transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFeedModalOpen(true);
                          }}
                        >
                          <Maximize className="w-3 h-3" />
                        </div>
                        
                        {/* Simulated Threat Detection Box */}
                        <div className="absolute top-1/4 left-1/4 w-16 h-16 border border-intel-red/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="absolute -top-3 left-0 bg-intel-red text-white px-1 text-[6px]">TARGET_01</span>
                        </div>
                      </div>
                      
                      {/* AI Analysis Log */}
                      <div className="h-20 overflow-hidden text-[8px] font-mono opacity-70 bg-black/50 p-2 border border-intel-border/20">
                        <div className="text-intel-cyan">Analyzing stream...</div>
                        <div className="text-white/60">Object detection: 3 vehicles, 1 person</div>
                        <div className="text-white/60">Threat level: LOW</div>
                        <div className="text-intel-green">Fusion complete. Data synced to mesh.</div>
                        <motion.div 
                          animate={{ opacity: [0, 1, 0] }} 
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-2 h-4 bg-intel-cyan inline-block ml-1"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Controls & System */}
        <div className="w-72 flex flex-col gap-4 pointer-events-auto">
          
          {/* Site Details Collapsible */}
          <div className="intel-panel overflow-hidden transition-all duration-300">
            <div 
              className="p-3 flex justify-between items-center cursor-pointer hover:bg-intel-cyan/5"
              onClick={() => setDetailsOpen(!detailsOpen)}
            >
              <div className="flex items-center gap-2">
                <Info className="w-3 h-3 text-intel-cyan" />
                <span className="font-bold text-white">SITE INTELLIGENCE</span>
              </div>
              {detailsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </div>
            
            <AnimatePresence>
              {detailsOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3 pb-3 border-t border-intel-border/30"
                >
                  <div className="space-y-2 mt-2">
                    <div>
                      <span className="text-[8px] opacity-60 block">OPERATIONAL HISTORY</span>
                      <p className="text-white/80 leading-tight">{selectedSite.history}</p>
                    </div>
                    <div>
                      <span className="text-[8px] opacity-60 block">INTEL VALUE</span>
                      <p className={cn(
                        "font-bold",
                        selectedSite.intelValue.includes('CRITICAL') || selectedSite.intelValue.includes('MAXIMUM') ? "text-intel-red" : "text-intel-amber"
                      )}>{selectedSite.intelValue}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Layer Toggles */}
          <div className="intel-panel p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-3 h-3 text-white" />
              <span className="font-bold text-white">ACTIVE LAYERS</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radar className={cn("w-3 h-3", radarEnabled ? "text-intel-cyan" : "text-white/40")} />
                <span className={cn(radarEnabled ? "text-white" : "text-white/40")}>RADAR OVERLAY</span>
              </div>
              <div 
                className={cn("w-8 h-4 rounded-full p-0.5 flex transition-colors cursor-pointer", radarEnabled ? "bg-intel-cyan/20" : "bg-intel-border")}
                onClick={() => setRadarEnabled(!radarEnabled)}
              >
                <div className={cn("w-3 h-3 rounded-full bg-white shadow-sm transition-transform", radarEnabled ? "translate-x-4 bg-intel-cyan" : "translate-x-0")} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className={cn("w-3 h-3", satelliteEnabled ? "text-intel-cyan" : "text-white/40")} />
                <span className={cn(satelliteEnabled ? "text-white" : "text-white/40")}>SAT IMAGERY</span>
              </div>
              <div 
                className={cn("w-8 h-4 rounded-full p-0.5 flex transition-colors cursor-pointer", satelliteEnabled ? "bg-intel-cyan/20" : "bg-intel-border")}
                onClick={() => setSatelliteEnabled(!satelliteEnabled)}
              >
                <div className={cn("w-3 h-3 rounded-full bg-white shadow-sm transition-transform", satelliteEnabled ? "translate-x-4 bg-intel-cyan" : "translate-x-0")} />
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="intel-panel p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3 h-3 text-intel-green" />
              <span className="font-bold text-white">SYSTEM HEALTH</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[9px]">
                <span>MESH UPLINK</span>
                <span className="text-intel-green">100%</span>
              </div>
              <div className="h-1 w-full bg-intel-border rounded overflow-hidden">
                <div className="h-full bg-intel-green w-full animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={triggerScan}
              className="intel-button flex-1 py-3 hover:bg-intel-cyan/20 hover:border-intel-cyan hover:text-intel-cyan transition-colors flex justify-center items-center gap-2"
            >
              <Zap className="w-3 h-3" />
              INITIATE SCAN
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Site Selection & Styles */}
      <div className="mt-4 flex flex-col items-center pointer-events-auto z-50 w-full max-w-screen-xl mx-auto">
        
        {/* Sites Selector */}
        <div className="intel-panel p-2 mb-2 flex items-center gap-2 overflow-x-auto max-w-full no-scrollbar">
          <Target className="w-4 h-4 text-intel-red animate-pulse mr-2 flex-shrink-0" />
          {SITES.map(site => (
             <div 
               key={site.id} 
               onClick={() => handleSiteSelect(site)}
               className={cn(
                 "px-4 py-2 rounded-md text-[9px] font-bold whitespace-nowrap cursor-pointer transition-all border flex-shrink-0",
                 selectedSite.id === site.id 
                   ? "bg-intel-cyan/20 border-intel-cyan text-intel-cyan shadow-[0_0_15px_rgba(0,240,255,0.3)]" 
                   : "bg-transparent border-transparent hover:bg-intel-border/30 text-white/60 hover:text-white"
               )}
             >
               {site.name}
             </div>
          ))}
        </div>

        {/* Style Presets - Compact */}
        <div className="flex gap-1 bg-black/60 backdrop-blur rounded-full p-1 border border-intel-border/30 overflow-x-auto max-w-full no-scrollbar">
          {[
            { id: 'EO', label: 'EO', icon: Globe },
            { id: 'CRT', label: 'CRT', icon: Monitor },
            { id: 'NVG', label: 'NVG', icon: Moon },
            { id: 'FLIR', label: 'FLIR', icon: Zap },
            { id: 'NOIR', label: 'BW', icon: Eye },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => setMode(style.id as any)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full transition-all flex-shrink-0",
                mode === style.id 
                  ? "bg-intel-cyan text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]" 
                  : "hover:bg-white/10 text-white/60"
              )}
            >
              <style.icon className="w-3 h-3" />
              <span className="text-[8px]">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed Modal */}
      <AnimatePresence>
        {feedModalOpen && selectedAsset && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-10 pointer-events-auto"
            onClick={() => setFeedModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full h-full max-w-6xl max-h-[80vh] border border-intel-cyan bg-black overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setFeedModalOpen(false)} 
                className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full hover:bg-intel-red hover:text-white transition-colors text-intel-cyan"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
                <div className="bg-intel-red text-white px-2 py-1 font-bold text-xs animate-pulse">LIVE FEED</div>
                <div className="bg-black/50 text-intel-cyan px-2 py-1 font-bold text-xs border border-intel-cyan/30">{selectedAsset.label}</div>
              </div>

              {selectedAsset.type === 'CAMERA' ? (
                <img 
                  src={`${selectedAsset.feed}?t=${feedUpdate}`} 
                  className="w-full h-full object-cover" 
                  onError={(e) => (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/1920/1080'} 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-intel-dark relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-20">
                    {[...Array(144)].map((_, i) => <div key={i} className="border border-intel-cyan/20" />)}
                  </div>
                  <Radar className="w-32 h-32 text-intel-cyan animate-spin-slow opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-intel-cyan/10 to-transparent animate-scan" />
                  <span className="absolute bottom-10 left-10 text-intel-cyan animate-pulse text-xl">NO OPTICAL FEED // TELEMETRY ONLY</span>
                </div>
              )}

              {/* Modal Overlays */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent p-6 flex justify-between items-end">
                <div className="font-mono text-intel-cyan text-xs space-y-1">
                  <div>COORDS: {selectedAsset.coords?.lat.toFixed(4)}, {selectedAsset.coords?.lng.toFixed(4)}</div>
                  <div>STATUS: {selectedAsset.status}</div>
                  <div>ID: {selectedAsset.id.toUpperCase()}</div>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-intel-green font-bold text-2xl">100%</div>
                    <div className="text-[8px] text-white/60">SIGNAL</div>
                  </div>
                  <div className="text-center">
                    <div className="text-intel-cyan font-bold text-2xl">HD</div>
                    <div className="text-[8px] text-white/60">QUALITY</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-View Modal */}
      <AnimatePresence>
        {multiViewOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10 pointer-events-auto"
            onClick={() => setMultiViewOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full h-full max-w-7xl max-h-[90vh] border border-intel-cyan/50 bg-black/50 backdrop-blur-xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-intel-border/50 bg-black/50">
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 text-intel-cyan" />
                  <span className="font-bold text-white text-lg tracking-widest">MULTI-ASSET SURVEILLANCE // {selectedSite.name}</span>
                </div>
                <button 
                  onClick={() => setMultiViewOpen(false)} 
                  className="bg-black/50 p-2 rounded-full hover:bg-intel-red hover:text-white transition-colors text-intel-cyan"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid Content */}
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar relative">
                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 relative">
                  {/* Connection Lines Overlay */}
                  <svg className="connection-overlay absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(0, 240, 255, 0)" />
                        <stop offset="50%" stopColor="rgba(0, 240, 255, 0.5)" />
                        <stop offset="100%" stopColor="rgba(0, 240, 255, 0)" />
                      </linearGradient>
                      <marker id="dot" markerWidth="4" markerHeight="4" refX="2" refY="2">
                        <circle cx="2" cy="2" r="2" fill="#00f0ff" />
                      </marker>
                    </defs>
                    {lines.map(line => (
                      <g key={line.key}>
                        <line 
                          x1={line.x1} 
                          y1={line.y1} 
                          x2={line.x2} 
                          y2={line.y2} 
                          stroke="url(#lineGradient)" 
                          strokeWidth="1" 
                          strokeDasharray="4 4"
                          className="animate-pulse"
                        />
                        <circle cx={line.x1} cy={line.y1} r="3" fill="#00f0ff" fillOpacity="0.5" />
                        <circle cx={line.x2} cy={line.y2} r="3" fill="#00f0ff" fillOpacity="0.5" />
                      </g>
                    ))}
                  </svg>

                  {selectedSite.assets.map((asset, i) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <div 
                        key={`${selectedSite.id}-${asset.id}`} 
                        className={cn(
                          "relative bg-black border rounded-lg overflow-hidden group transition-all duration-300 flex flex-col shadow-lg z-10 cursor-pointer",
                          isSelected ? "border-intel-cyan ring-1 ring-intel-cyan/50 scale-[1.02]" : "border-intel-border/50 hover:border-intel-cyan"
                        )}
                        onClick={() => setSelectedAsset(asset)}
                        style={{ aspectRatio: isSelected ? 'auto' : '16/9' }}
                      >
                        {/* Feed Content */}
                        <div className={cn("relative overflow-hidden bg-intel-dark/50", isSelected ? "h-48" : "flex-1")}>
                          {asset.type === 'CAMERA' ? (
                            <img 
                              src={`${asset.feed}${asset.feed.includes('?') ? '&' : '?'}t=${feedUpdate}`} 
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null; // Prevent infinite loop
                                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${asset.id}/400/225?grayscale`;
                              }}
                              alt={asset.label}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-intel-dark relative">
                              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10">
                                {[...Array(16)].map((_, j) => <div key={j} className="border border-intel-cyan/20" />)}
                              </div>
                              <Radar className="w-12 h-12 text-intel-cyan/50 animate-spin-slow" />
                              <span className="absolute bottom-2 text-[8px] text-intel-cyan/70 font-mono tracking-widest">TELEMETRY ONLY</span>
                            </div>
                          )}
                          
                          {/* Overlays */}
                          <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
                            <span className={cn("text-[8px] px-1.5 py-0.5 rounded font-bold shadow-sm backdrop-blur-sm", asset.status === 'LIVE' ? "bg-intel-red/80 text-white animate-pulse" : "bg-intel-border/80 text-intel-cyan")}>
                              {asset.status}
                            </span>
                          </div>
                          
                          {/* Scanline */}
                          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] z-20" />
                        </div>

                        {/* Expanded Details Panel */}
                        {isSelected && (
                          <div className="bg-black/90 border-t border-intel-cyan/30 p-3 grid grid-cols-2 gap-2 text-[9px] font-mono animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1">
                              <div className="text-intel-cyan/70">SIGNAL STRENGTH</div>
                              <div className="flex items-center gap-1">
                                <div className="h-1 w-full bg-intel-dark rounded-full overflow-hidden">
                                  <div className="h-full bg-intel-green" style={{ width: `${asset.signal || 85}%` }} />
                                </div>
                                <span className="text-white">{asset.signal || 85}%</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-intel-cyan/70">BATTERY LEVEL</div>
                              <div className="flex items-center gap-1">
                                <div className="h-1 w-full bg-intel-dark rounded-full overflow-hidden">
                                  <div className="h-full bg-intel-cyan" style={{ width: `${asset.battery || 100}%` }} />
                                </div>
                                <span className="text-white">{asset.battery || 100}%</span>
                              </div>
                            </div>
                            {asset.range && (
                              <div className="col-span-2 flex justify-between border-t border-intel-border/20 pt-1 mt-1">
                                <span className="text-intel-cyan/70">EFFECTIVE RANGE</span>
                                <span className="text-white">{asset.range}</span>
                              </div>
                            )}
                            {asset.communicatingWith && (
                              <div className="col-span-2 flex justify-between border-t border-intel-border/20 pt-1">
                                <span className="text-intel-cyan/70">LINKED ASSETS</span>
                                <span className="text-white">{asset.communicatingWith.length} ACTIVE</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer Info */}
                        <div className="h-8 bg-black/90 border-t border-intel-border/30 flex justify-between items-center px-3 text-[9px] font-mono shrink-0">
                          <span className="font-bold text-intel-cyan truncate max-w-[60%]">{asset.label}</span>
                          <span className="text-white/50 truncate">{asset.type} // {asset.id.toUpperCase()}</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty slots filler - Fill up to 9 slots for a full grid look */}
                  {[...Array(Math.max(0, 9 - selectedSite.assets.length))].map((_, i) => (
                    <div key={`empty-${i}`} className="bg-intel-dark/20 border border-intel-border/10 rounded-lg flex flex-col items-center justify-center aspect-video opacity-50">
                      <div className="w-8 h-8 border border-intel-border/30 rounded-full flex items-center justify-center mb-2">
                        <div className="w-1 h-1 bg-intel-border/50 rounded-full" />
                      </div>
                      <span className="text-intel-border/50 text-[8px] tracking-widest">NO SIGNAL</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <div className="crt-overlay pointer-events-none" />
      {isScanning && (
        <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-intel-cyan/20 to-transparent h-20 animate-scan z-[100]" />
      )}
    </div>
  );
};

export default HUD;
