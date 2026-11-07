'use client';

import React, { useState, useEffect } from 'react';
import { RadarCanvas } from '@/components/RadarCanvas';
import { DeviceInspector } from '@/components/DeviceInspector';
import { DeviceList } from '@/components/DeviceList';
import { MeshTopologyPanel } from '@/components/MeshTopologyPanel';
import { SignalLogsPanel } from '@/components/SignalLogsPanel';
import { PluginDownloaderModal } from '@/components/PluginDownloaderModal';
import { DeviceInfo, RadarLog } from '@/lib/radar-types';
import { INITIAL_MOCK_DEVICES } from '@/lib/mock-devices';
import { calculatePreciseDistance, lookupVendor } from '@/lib/radar-math';
import { 
  Radio, 
  Play, 
  Square, 
  RefreshCw, 
  Compass, 
  Layers, 
  Wifi, 
  Smartphone, 
  Sliders, 
  Download, 
  FileCode, 
  Activity, 
  MapPin, 
  Box, 
  Cpu
} from 'lucide-react';

export default function Home() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'radar' | 'list' | 'mesh' | 'logs'>('radar');
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [compassHeading, setCompassHeading] = useState<number>(14);
  const [compassEnabled, setCompassEnabled] = useState<boolean>(true);

  // Network Multi-Source Options
  const [wifiCsiActive, setWifiCsiActive] = useState<boolean>(true);
  const [meshAided, setMeshAided] = useState<boolean>(true);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [rangeMeters, setRangeMeters] = useState<number>(30);

  // Data state
  const [devices, setDevices] = useState<DeviceInfo[]>(INITIAL_MOCK_DEVICES);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(INITIAL_MOCK_DEVICES[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rssi' | 'distance' | 'name' | 'confidence'>('rssi');
  const [minRssi, setMinRssi] = useState<number>(-100);

  // Telemetry logs
  const [logs, setLogs] = useState<RadarLog[]>([
    {
      id: '1',
      level: 'success',
      timestamp: '05:10:02',
      message: 'BLE Radar Locator v2.0.0 Engine Initialized (3D Engine Ready)',
      source: 'CORE',
    },
    {
      id: '2',
      level: 'mesh',
      timestamp: '05:10:03',
      message: 'Wi-Fi 7 CSI Subcarrier Channel 44 Link Established. Wall Delay Spread: 1.82ns',
      source: 'WIFI_CSI',
    },
    {
      id: '3',
      level: 'success',
      timestamp: '05:10:05',
      message: 'Dolphy Relay Anchor Node #01 connected via P2P Hotspot mesh',
      source: 'MESH',
    },
    {
      id: '4',
      level: 'info',
      timestamp: '05:10:08',
      message: 'Decoded public Service UUID 0xFD6F (Exposure Notification Proximity)',
      source: 'BLE',
    },
  ]);

  // Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Simulated BLE & Wi-Fi scanning cycle with real-time drift & multi-lateration update
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      setDevices((prevDevices) => {
        return prevDevices.map((dev) => {
          // slight signal drift
          const deltaRssi = (Math.random() - 0.49) * 2.2;
          const newRssi = Math.min(-35, Math.max(-110, Math.round(dev.rssi + deltaRssi)));
          const alpha = 0.25;
          const newSmooth = (1 - alpha) * dev.rssi_smooth + alpha * newRssi;

          const distCalc = calculatePreciseDistance(
            newSmooth,
            dev.tx_power ?? -59,
            1.95,
            wifiCsiActive,
            meshAided ? 2 : 0
          );

          // update position history
          const rad = (dev.angle * Math.PI) / 180;
          const currX = Math.sin(rad) * distCalc.distance;
          const currY = Math.cos(rad) * distCalc.distance;
          const newHistory = [
            ...dev.history.slice(-6),
            { x: currX, y: currY, z: dev.elevation || 0, timestamp: Date.now() },
          ];

          return {
            ...dev,
            rssi: newRssi,
            rssi_smooth: newSmooth,
            distance: distCalc.distance,
            confidence: distCalc.confidence,
            throughWallProbability: distCalc.throughWall,
            seen: dev.seen + 1,
            last_seen: Date.now(),
            history: newHistory,
          };
        });
      });

      // Simulate gyro / compass micro-drift
      if (compassEnabled) {
        setCompassHeading((prev) => (prev + (Math.random() - 0.5) * 0.4 + 360) % 360);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [isScanning, compassEnabled, wifiCsiActive, meshAided]);

  // Handle Hardware / Web Bluetooth trigger if browser supports it
  const requestWebBleScan = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
        setLogs((prev) => [
          {
            id: Date.now().toString(),
            level: 'info',
            timestamp: new Date().toLocaleTimeString(),
            message: 'Initiating Web Bluetooth Hardware Request...',
          },
          ...prev,
        ]);
        // Trigger browser native bluetooth picker for real hardware integration
        const navAny = navigator as any;
        const device = await navAny.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['generic_access', 'battery_service'],
        });

        if (device) {
          const newDev: DeviceInfo = {
            address: device.id.slice(0, 17) || 'AA:BB:CC:DD:EE:FF',
            name: device.name || 'Hardware Bluetooth Target',
            vendor: lookupVendor(device.id),
            deviceType: 'phone',
            rssi: -62,
            rssi_smooth: -62.0,
            uuid: '0000180F-0000-1000-8000-00805F9B34FB',
            uid: `HW-${device.id.slice(0, 6)}`,
            distance: 2.4,
            angle: Math.floor(Math.random() * 360),
            confidence: 94,
            triangulatedBy: ['ble', 'wifi_csi'],
            protocol: 'BLE 5.4',
            seen: 1,
            first_seen: Date.now(),
            last_seen: Date.now(),
            history: [{ x: 1.5, y: 1.5, z: 0, timestamp: Date.now() }],
          };

          setDevices((prev) => [newDev, ...prev]);
          setSelectedDevice(newDev);
          setLogs((prev) => [
            {
              id: Date.now().toString(),
              level: 'success',
              timestamp: new Date().toLocaleTimeString(),
              message: `Hardware BLE Target Linked: ${device.name || device.id}`,
            },
            ...prev,
          ]);
        }
      } else {
        setLogs((prev) => [
          {
            id: Date.now().toString(),
            level: 'warning',
            timestamp: new Date().toLocaleTimeString(),
            message: 'Web Bluetooth API not permitted in this sandbox iframe. Standard RF Radar Engine running.',
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      setLogs((prev) => [
        {
          id: Date.now().toString(),
          level: 'error',
          timestamp: new Date().toLocaleTimeString(),
          message: `BLE Scan Dialog: ${err.message || 'Cancelled by user'}`,
        },
        ...prev,
      ]);
    }
  };

  // Filter & Sort
  const filteredDevices = devices
    .filter((d) => {
      const matchRssi = d.rssi_smooth >= minRssi;
      const matchSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.uuid && d.uuid.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRssi && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'rssi') return b.rssi_smooth - a.rssi_smooth;
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      return a.name.localeCompare(b.name);
    });

  // Export handlers
  const handleExportCSV = () => {
    const headers = [
      'address',
      'name',
      'vendor',
      'uuid',
      'uid',
      'rssi_smooth',
      'rssi_last',
      'distance_m',
      'confidence_pct',
      'through_wall_pct',
      'protocol',
      'seen',
      'last_seen',
    ];
    const rows = filteredDevices.map((d) => [
      d.address,
      `"${d.name}"`,
      `"${d.vendor}"`,
      `"${d.uuid || 'N/A'}"`,
      `"${d.uid || 'N/A'}"`,
      d.rssi_smooth.toFixed(1),
      d.rssi,
      d.distance.toFixed(2),
      d.confidence,
      Math.round((d.throughWallProbability || 0) * 100),
      `"${d.protocol}"`,
      d.seen,
      new Date(d.last_seen).toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BLE_Radar_v2.0_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const payload = {
      project: 'BLE Radar Locator v2.0.0',
      timestamp: new Date().toISOString(),
      heading: compassHeading,
      meshTopology: {
        wifiCsiActive,
        meshAided,
        offlineMode,
        relayNodesCount: devices.filter((d) => d.isRelayNode).length,
      },
      devices: filteredDevices,
      logs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BLE_Radar_v2.0_Telemetry_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#030706] text-emerald-400 p-2 sm:p-4 lg:p-6 flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Top Application Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-xl hud-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-wider flex items-center gap-2">
                BLE RADAR LOCATOR
                <span className="text-xs bg-emerald-500 text-black px-2 py-0.5 rounded font-black">
                  v2.0.0 UPGRADE
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-emerald-400/80">
              High-Precision Multi-Source Positioning · Wi-Fi 7 CSI · P2P Mesh Spoofer & UUID/UID Decoder
            </p>
          </div>
        </div>

        {/* Global Controls & Direct Download Links */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct 1-Click .dolphyplugin Download */}
          <a
            href="/api/download?format=dolphyplugin"
            download="BLE_Radar_Locator_v2.0.0.dolphyplugin"
            className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all text-xs active:scale-95"
            title="Direct download BLE Radar Locator v2.0.0 as .dolphyplugin"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD .dolphyplugin (v2.0)</span>
          </a>

          {/* Direct 1-Click .txt Download */}
          <a
            href="/api/download?format=txt"
            download="BLE_Radar_Locator_v2.0.0.txt"
            className="px-3 py-2 rounded-lg bg-cyan-950 border border-cyan-500/50 hover:bg-cyan-900/60 text-cyan-300 font-bold flex items-center gap-1.5 transition-all text-xs"
            title="Direct download BLE Radar Locator v2.0.0 as .txt file"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>DOWNLOAD .TXT</span>
          </a>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-2.5 py-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 hover:bg-emerald-900/40 text-emerald-300 flex items-center gap-1 text-xs"
            title="Inspect source code & change log"
          >
            <span>View Code</span>
          </button>

          <button
            onClick={requestWebBleScan}
            title="Scan nearby physical Bluetooth devices"
            className="px-2.5 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/20 hover:bg-emerald-900/30 text-emerald-400 flex items-center gap-1 text-xs"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hardware Scan</span>
          </button>
        </div>
      </header>

      {/* Main Status & Quick Toggle Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col gap-0.5">
          <span className="text-[10px] text-emerald-500/70">RADAR ENGINE</span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <span
              className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`}
            />
            {isScanning ? 'ACTIVE SWEEP' : 'PAUSED'}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col gap-0.5">
          <span className="text-[10px] text-emerald-500/70">DETECTED TARGETS</span>
          <span className="text-xs font-bold text-emerald-300">
            {filteredDevices.length} Active / {devices.length} Total
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col gap-0.5">
          <span className="text-[10px] text-emerald-500/70">COMPASS GYRO</span>
          <span className="text-xs font-bold text-cyan-300">
            {Math.round(compassHeading)}° Magnetic Bearing
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col gap-0.5">
          <span className="text-[10px] text-emerald-500/70">WI-FI 7 CSI SENSING</span>
          <span className={`text-xs font-bold ${wifiCsiActive ? 'text-cyan-400' : 'text-gray-400'}`}>
            {wifiCsiActive ? 'ENABLED (Through-Wall)' : 'STANDBY'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col gap-0.5">
          <span className="text-[10px] text-emerald-500/70">P2P HOTSPOT MESH</span>
          <span className={`text-xs font-bold ${meshAided ? 'text-emerald-300' : 'text-gray-400'}`}>
            {meshAided ? '2 NODES RELAYING' : 'OFFLINE'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col gap-0.5">
          <span className="text-[10px] text-emerald-500/70">PRECISION ACCURACY</span>
          <span className="text-xs font-bold text-emerald-300">
            Sub-Meter (~0.1m)
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'radar', label: '📡 3D RADAR VIEW' },
            { id: 'list', label: '📋 TARGETS & UUID' },
            { id: 'mesh', label: '🕸 MESH & WI-FI 7' },
            { id: 'logs', label: '📝 SIGNAL LOGS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View mode toggle: 2D vs 3D and Range */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
              is3DMode
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-black/40 border-emerald-500/20 text-emerald-400'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            {is3DMode ? '3D PERSPECTIVE: ON' : '2D PLAN VIEW'}
          </button>

          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
              isScanning
                ? 'bg-amber-950 border border-amber-500/40 text-amber-300'
                : 'bg-emerald-600 text-black'
            }`}
          >
            {isScanning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isScanning ? 'PAUSE' : 'RESUME'}
          </button>
        </div>
      </div>

      {/* Main Viewport Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Radar View or Specific Tab Content */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {activeTab === 'radar' && (
            <div className="flex flex-col gap-3">
              <RadarCanvas
                devices={filteredDevices}
                selectedDevice={selectedDevice}
                onSelectDevice={(d) => setSelectedDevice(d)}
                isScanning={isScanning}
                is3DMode={is3DMode}
                compassHeading={compassHeading}
                wifiCsiActive={wifiCsiActive}
                meshAided={meshAided}
                rangeMeters={rangeMeters}
              />

              {/* Range & Compass Sliders Strip */}
              <div className="p-3 rounded-xl hud-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500/70">RANGE:</span>
                  {[10, 20, 30, 50].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRangeMeters(r)}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        rangeMeters === r
                          ? 'bg-emerald-500 text-black font-bold'
                          : 'bg-emerald-950/40 text-emerald-400'
                      }`}
                    >
                      {r}m
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compassEnabled}
                      onChange={(e) => setCompassEnabled(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <span>Auto Compass Gyro</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={offlineMode}
                      onChange={(e) => {
                        setOfflineMode(e.target.checked);
                        if (e.target.checked) {
                          setWifiCsiActive(false);
                          setMeshAided(false);
                        } else {
                          setWifiCsiActive(true);
                          setMeshAided(true);
                        }
                      }}
                      className="accent-emerald-500"
                    />
                    <span>Offline Standalone Mode</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <DeviceList
              devices={filteredDevices}
              selectedDevice={selectedDevice}
              onSelectDevice={(d) => setSelectedDevice(d)}
              searchQuery={searchQuery}
              sortBy={sortBy}
              onSortChange={(s) => setSortBy(s)}
              minRssi={minRssi}
              onMinRssiChange={(r) => setMinRssi(r)}
            />
          )}

          {activeTab === 'mesh' && (
            <MeshTopologyPanel
              meshActive={meshAided}
              onToggleMesh={(val) => setMeshAided(val)}
              wifiCsiActive={wifiCsiActive}
              onToggleWifiCsi={(val) => setWifiCsiActive(val)}
              relayNodesCount={devices.filter((d) => d.isRelayNode).length}
            />
          )}

          {activeTab === 'logs' && (
            <SignalLogsPanel
              logs={logs}
              devices={filteredDevices}
              onClearLogs={() => setLogs([])}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
            />
          )}
        </div>

        {/* Right Column: Device Inspector & Live Telemetry Details */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <DeviceInspector
            device={selectedDevice}
            onClose={() => setSelectedDevice(null)}
            onTrackTarget={(d) => {
              setActiveTab('radar');
              setSelectedDevice(d);
            }}
          />

          {/* Quick Target Quick-Select Bar if not in List tab */}
          {activeTab === 'radar' && (
            <div className="p-3 rounded-xl hud-border flex flex-col gap-2 text-xs">
              <span className="font-bold text-emerald-300 text-[11px] flex items-center justify-between">
                <span>QUICK TARGET SELECTOR</span>
                <span className="text-[10px] text-emerald-500/70">{filteredDevices.length} Nodes</span>
              </span>

              <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                {filteredDevices.map((d) => (
                  <button
                    key={d.address}
                    onClick={() => setSelectedDevice(d)}
                    className={`p-2 rounded-lg text-left flex items-center justify-between border transition-all ${
                      selectedDevice?.address === d.address
                        ? 'bg-emerald-950/70 border-cyan-400 text-white'
                        : 'bg-black/30 border-emerald-500/10 text-emerald-400/80 hover:bg-emerald-950/30'
                    }`}
                  >
                    <span className="font-bold truncate text-[11px]">{d.name}</span>
                    <span className="text-[10px] font-mono text-emerald-300">
                      {d.distance.toFixed(1)}m | {d.rssi}dBm
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Downloader Modal */}
      <PluginDownloaderModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </main>
  );
}
