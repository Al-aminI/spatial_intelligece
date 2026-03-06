export const SITES = [
  { 
    id: 'austin', 
    name: 'AUSTIN_PRIME', 
    coords: { lng: -97.7431, lat: 30.2672 },
    history: 'Established 2021 as a primary testbed for urban surveillance integration. Key node in the Texas Triangle monitoring network.',
    intelValue: 'HIGH - Critical infrastructure and tech sector monitoring.',
    assets: [
      { id: 'uav-01', type: 'DRONE', label: 'MQ-9 REAPER', status: 'LOITERING', battery: 87, signal: 98, coords: { lng: -97.745, lat: 30.269 }, communicatingWith: ['ground-02', 'radar-01'] },
      { id: 'cam-04', type: 'CAMERA', label: 'TRAFFIC_CAM_404', status: 'LIVE', feed: 'https://cctv.austinmobility.io/image/404.jpg', coords: { lng: -97.741, lat: 30.266 } },
      { id: 'radar-01', type: 'RADAR', label: 'SENTINEL_RADAR', status: 'SCANNING', range: '40KM', coords: { lng: -97.748, lat: 30.265 }, communicatingWith: ['uav-01'] },
      { id: 'ground-02', type: 'GROUND', label: 'UNIT_BRAVO', status: 'PATROL', personnel: 4, coords: { lng: -97.743, lat: 30.268 }, communicatingWith: ['uav-01'] }
    ]
  },
  { 
    id: 'sf', 
    name: 'SF_BAY_WATCH', 
    coords: { lng: -122.4194, lat: 37.7749 },
    history: 'Strategic coastal monitoring point. Historical significance in naval intelligence. Upgraded to Gen-5 sensors in 2024.',
    intelValue: 'CRITICAL - Pacific gateway and tech hub surveillance.',
    assets: [
      { id: 'sat-09', type: 'SATELLITE', label: 'KH-11', status: 'PASSING', orbit: 'LEO', coords: { lng: -122.42, lat: 37.78 }, communicatingWith: ['drone-sf'] },
      { id: 'cam-sf-01', type: 'CAMERA', label: 'BAY_BRIDGE_CAM', status: 'LIVE', feed: 'https://www.sfmta.com/sites/default/files/cctv-images/101_1300_Van_Ness.jpg', coords: { lng: -122.415, lat: 37.776 } },
      { id: 'drone-sf', type: 'DRONE', label: 'GLOBAL_HAWK', status: 'TRANSIT', alt: '60000FT', coords: { lng: -122.425, lat: 37.770 }, communicatingWith: ['sat-09'] }
    ]
  },
  { 
    id: 'dc', 
    name: 'CAPITOL_GUARD', 
    coords: { lng: -77.0369, lat: 38.9072 },
    history: 'Central command node for NCR (National Capital Region). Integrated with multiple agency feeds.',
    intelValue: 'MAXIMUM - National security epicenter.',
    assets: [
      { id: 'fixed-01', type: 'CAMERA', label: 'MALL_CAM_01', status: 'LIVE', feed: 'https://weather.washingtonpost.com/images/webcams/WhiteHouse.jpg', coords: { lng: -77.0365, lat: 38.9070 } },
      { id: 'radar-dc', type: 'RADAR', label: 'AEGIS_ASHORE', status: 'ACTIVE', range: '200KM', coords: { lng: -77.04, lat: 38.91 }, communicatingWith: ['cyber-01'] },
      { id: 'cyber-01', type: 'NETWORK', label: 'SIGINT_NODE', status: 'INTERCEPTING', bandwidth: '40TB', coords: { lng: -77.035, lat: 38.905 }, communicatingWith: ['radar-dc'] }
    ]
  },
  {
    id: 'london',
    name: 'LONDON_EYE',
    coords: { lng: -0.1276, lat: 51.5074 },
    history: 'Primary European relay station. Coordinates with Five Eyes partners. Extensive CCTV coverage.',
    intelValue: 'HIGH - Financial district and diplomatic monitoring.',
    assets: [
      { id: 'cctv-ldn', type: 'CAMERA', label: 'RING_OF_STEEL', status: 'LIVE', feed: 'https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.03603.jpg', coords: { lng: -0.1270, lat: 51.5070 }, communicatingWith: ['drone-ldn'] },
      { id: 'drone-ldn', type: 'DRONE', label: 'WATCHKEEPER', status: 'DEPLOYED', alt: '15000FT', coords: { lng: -0.1280, lat: 51.5080 }, communicatingWith: ['cctv-ldn'] }
    ]
  }
];
