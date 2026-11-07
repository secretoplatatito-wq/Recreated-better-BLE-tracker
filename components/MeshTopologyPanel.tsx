'use client';

import React from 'react';
import { Network, Smartphone, Wifi, Radio, Zap, Shield, Share2, Info } from 'lucide-react';

interface MeshTopologyPanelProps {
  meshActive: boolean;
  onToggleMesh: (active: boolean) => void;
  wifiCsiActive: boolean;
  onToggleWifiCsi: (active: boolean) => void;
  relayNodesCount: number;
}

export const MeshTopologyPanel: React.FC<MeshTopologyPanelProps> = ({
  meshActive,
  onToggleMesh,
  wifiCsiActive,
  onToggleWifiCsi,
  relayNodesCount,
}) => {
  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      {/* Overview Banner */}
      <div className="p-4 rounded-xl hud-border-cyan flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                DECENTRALIZED P2P MESH & WI-FI 7 CSI TOPOLOGY
              </h3>
              <p className="text-[11px] text-cyan-300/80">
                Peer-to-Peer Multi-Point Anchor & Wall Penetration Network
              </p>
            </div>
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
            HYPER-ACCURATE v2.0
          </span>
        </div>

        <p className="text-[11px] text-emerald-400/80 leading-relaxed">
          By combining local Wi-Fi 7 Channel State Information (CSI), Bluetooth Low Energy, and Hotspot P2P relays, participating peer devices act as <strong>secondary location anchor spoofers</strong>. Even without active internet access, devices form a localized RF constellation to triangulate targets down to 0.1m precision and track movements through walls.
        </p>

        {/* Feature Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Wi-Fi 7 CSI Toggle */}
          <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-bold text-white text-[11px]">Wi-Fi 7 CSI Subcarrier Sensing</div>
                <div className="text-[10px] text-cyan-400/70">Wall penetration & subcarrier phase drift</div>
              </div>
            </div>
            <button
              onClick={() => onToggleWifiCsi(!wifiCsiActive)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                wifiCsiActive ? 'bg-cyan-500' : 'bg-gray-800'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                  wifiCsiActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Hotspot Mesh Spoofer Toggle */}
          <div className="p-3 rounded-lg bg-black/40 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-bold text-white text-[11px]">Hotspot Secondary Spoofer Relay</div>
                <div className="text-[10px] text-emerald-400/70">Turn connected phones into triangulation anchors</div>
              </div>
            </div>
            <button
              onClick={() => onToggleMesh(!meshActive)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                meshActive ? 'bg-emerald-500' : 'bg-gray-800'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${
                  meshActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Triangulation Constellation Diagram & Nodes */}
      <div className="p-4 rounded-xl hud-border flex flex-col gap-3">
        <h4 className="font-bold text-emerald-300 text-xs flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          ACTIVE TRIANGULATION RELAY STATIONS ({relayNodesCount} NODES ACTIVE)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
              <span>NODE 0: LOCAL HOST</span>
              <span className="text-emerald-300 text-[10px] bg-emerald-950 px-1 rounded">MASTER</span>
            </div>
            <div className="text-[10px] text-emerald-500/70">Origin (0.00, 0.00) · BLE + Wi-Fi 7 RX</div>
            <div className="text-[10px] text-white">Status: TX/RX Polling 350ms</div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-cyan-400 font-bold text-[11px]">
              <span>NODE 1: DOLPHY SPOOFER</span>
              <span className="text-cyan-300 text-[10px] bg-cyan-950 px-1 rounded">HOTSPOT</span>
            </div>
            <div className="text-[10px] text-cyan-500/70">Offset (-0.90, +0.80) · P2P Beacon</div>
            <div className="text-[10px] text-white">Multilateration Weight: 98%</div>
          </div>

          <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/20 flex flex-col gap-1">
            <div className="flex items-center justify-between text-amber-400 font-bold text-[11px]">
              <span>NODE 2: GALAXY S24 RELAY</span>
              <span className="text-amber-300 text-[10px] bg-amber-950 px-1 rounded">PHONE</span>
            </div>
            <div className="text-[10px] text-amber-500/70">Offset (+2.80, -3.50) · BLE Mesh Reflector</div>
            <div className="text-[10px] text-white">Multilateration Weight: 91%</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/15 flex items-start gap-2.5 text-emerald-300/90 text-[11px]">
          <Info className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
          <span>
            <strong>Offline Operation Mode:</strong> When Wi-Fi and Bluetooth are absent or in air-gapped zones, the radar falls back to device sensor dead-reckoning and cached RF fingerprint maps to maintain approximate target coordinates.
          </span>
        </div>
      </div>
    </div>
  );
};
