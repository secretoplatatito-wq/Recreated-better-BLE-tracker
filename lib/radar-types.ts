export interface DeviceInfo {
  address: string;             // MAC / Unique HW ID (public)
  name: string;                // Advertised Name
  vendor: string;              // Manufacturer (Apple, Samsung, Espressif, Intel, Tile, Flipper, etc.)
  deviceType: 'phone' | 'wearable' | 'beacon' | 'mesh_node' | 'wifi_ap' | 'hotspot' | 'tag' | 'sensor';
  
  // RF Signals
  rssi: number;                // Instantaneous RSSI (dBm)
  rssi_smooth: number;         // Kalman / EWMA filtered RSSI
  tx_power?: number;           // TX power (dBm)
  
  // Public UUIDs & Identifiers (non-private)
  uuid?: string;               // Primary Service UUID (e.g. 0xFD6F Covid, 0xFEAA Eddystone)
  uid?: string;                // Beacon UID / Namespace
  major?: number;
  minor?: number;
  serviceData?: string;
  appearance?: string;         // Generic Phone, Audio, Watch, Tag
  
  // Positioning & Triangulation
  distance: number;            // Distance in meters
  angle: number;               // Bearing angle in degrees (0 - 360)
  elevation?: number;          // 3D elevation (-30 to +40 deg)
  confidence: number;          // 0 - 100% precision score
  triangulatedBy: ('ble' | 'wifi_csi' | 'hotspot_mesh' | 'dead_reckoning')[];
  throughWallProbability?: number; // Estimated wall penetration attenuation (0 - 1)
  
  // Network / Transport State
  channel?: number;            // Wi-Fi or BLE Channel (37, 38, 39, or 1-14 / 5G / 6G)
  protocol: 'BLE 5.4' | 'BLE 5.0' | 'Wi-Fi 7 (802.11be)' | 'Wi-Fi 6' | 'P2P Hotspot Mesh';
  seen: number;                // Packets count
  first_seen: number;          // Timestamp
  last_seen: number;           // Timestamp
  
  // Position history for trajectory tracking
  history: { x: number; y: number; z: number; timestamp: number }[];
  isRelayNode?: boolean;       // If device acts as a secondary location spoofer/repeater node
  notes?: string;
}

export interface RadarLog {
  id: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'mesh';
  timestamp: string;
  message: string;
  source?: string;
}

export interface TriangulationNode {
  id: string;
  name: string;
  type: 'local_host' | 'wifi_router' | 'mesh_phone_relay' | 'hotspot_spoofer';
  x: number;   // In meters relative to local host (0,0)
  y: number;
  z: number;
  active: boolean;
  accuracyMultiplier: number;
}
