'use client';

import React from 'react';
import { DeviceInfo } from '@/lib/radar-types';
import { getRssiColor, formatDistance } from '@/lib/radar-math';
import { 
  Radio, 
  Wifi, 
  Smartphone, 
  ShieldAlert, 
  Copy, 
  Layers, 
  Clock, 
  X,
  Share2,
  Compass,
  Activity
} from 'lucide-react';

interface DeviceInspectorProps {
  device: DeviceInfo | null;
  onClose: () => void;
  onTrackTarget?: (device: DeviceInfo) => void;
}

export const DeviceInspector: React.FC<DeviceInspectorProps> = ({
  device,
  onClose,
  onTrackTarget,
}) => {
  if (!device) return null;

  const rssiMeta = getRssiColor(device.rssi_smooth);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="hud-border rounded-xl p-4 flex flex-col gap-4 text-xs font-mono relative overflow-hidden">
      {/* Header bar */}
      <div className="flex items-start justify-between border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            {device.deviceType === 'phone' ? <Smartphone className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {device.name}
              {device.isRelayNode && (
                <span className="text-[10px] bg-cyan-950 border border-cyan-500/50 text-cyan-300 px-1.5 py-0.2 rounded font-normal">
                  RELAY SPOOFER
                </span>
              )}
            </h3>
            <p className="text-[11px] text-emerald-400/80">{device.vendor}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-emerald-500 hover:text-white p-1 rounded hover:bg-emerald-950/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col gap-0.5">
          <span className="text-[10px] text-emerald-500/70">PROXIMITY</span>
          <span className="text-base font-bold text-emerald-300">
            {formatDistance(device.distance)}
          </span>
          <span className="text-[9px] text-emerald-400/60">Estimated Range</span>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col gap-0.5">
          <span className="text-[10px] text-emerald-500/70">SIGNAL RSSI</span>
          <span className="text-base font-bold" style={{ color: rssiMeta.hex }}>
            {device.rssi} dBm
          </span>
          <span className="text-[9px]" style={{ color: rssiMeta.hex }}>
            Smooth: {device.rssi_smooth.toFixed(1)} dBm
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 flex flex-col gap-0.5">
          <span className="text-[10px] text-emerald-500/70">PRECISION</span>
          <span className="text-base font-bold text-cyan-300">
            {device.confidence}%
          </span>
          <span className="text-[9px] text-cyan-400/70">Multi-Triangulated</span>
        </div>
      </div>

      {/* Public UUID & UID Decoder Section */}
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
        <div className="flex items-center justify-between text-emerald-400 font-semibold text-[11px]">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            PUBLIC IDENTIFIERS & BROADCAST METADATA
          </span>
          <span className="text-[10px] text-emerald-500/60">Non-Private</span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 text-[11px]">
          {/* Public Hardware Address */}
          <div className="flex items-center justify-between bg-black/40 p-2 rounded border border-emerald-500/10">
            <span className="text-emerald-500/80">MAC / HW ADDR:</span>
            <div className="flex items-center gap-1.5 text-white font-mono">
              <span>{device.address}</span>
              <button
                onClick={() => copyToClipboard(device.address)}
                title="Copy Address"
                className="hover:text-emerald-300 p-0.5"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Primary Service UUID */}
          <div className="flex items-center justify-between bg-black/40 p-2 rounded border border-emerald-500/10">
            <span className="text-emerald-500/80">SERVICE UUID:</span>
            <div className="flex items-center gap-1.5 text-emerald-300 font-mono text-[10px]">
              <span>{device.uuid || '0000FD6F-0000-1000-8000-00805F9B34FB'}</span>
              <button
                onClick={() => copyToClipboard(device.uuid || '')}
                title="Copy UUID"
                className="hover:text-white p-0.5"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* UID / Beacon Namespace */}
          <div className="flex items-center justify-between bg-black/40 p-2 rounded border border-emerald-500/10">
            <span className="text-emerald-500/80">UID / NAMESPACE:</span>
            <span className="text-white font-mono">{device.uid || 'N/A'}</span>
          </div>

          {/* Appearance / Device Category */}
          <div className="flex items-center justify-between bg-black/40 p-2 rounded border border-emerald-500/10">
            <span className="text-emerald-500/80">APPEARANCE:</span>
            <span className="text-cyan-300">{device.appearance || 'Generic BLE Node'}</span>
          </div>

          {/* Transmit Power */}
          <div className="flex items-center justify-between bg-black/40 p-2 rounded border border-emerald-500/10">
            <span className="text-emerald-500/80">ADVERTISED TX POWER:</span>
            <span className="text-white">{device.tx_power ?? -59} dBm</span>
          </div>
        </div>
      </div>

      {/* Triangulation & RF Channel Details */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg bg-black/30 border border-emerald-500/15 flex flex-col gap-1">
          <span className="text-[10px] text-emerald-500/70 flex items-center gap-1">
            <Compass className="w-3 h-3" /> BEARING & ELEVATION
          </span>
          <span className="text-emerald-300 font-bold">
            {device.angle}° Azimuth | {device.elevation ?? 0}° Elevation
          </span>
          <span className="text-[9px] text-emerald-400/60">
            Relative to true north compass
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-black/30 border border-emerald-500/15 flex flex-col gap-1">
          <span className="text-[10px] text-emerald-500/70 flex items-center gap-1">
            <Wifi className="w-3 h-3" /> TRANSPORT & PROTOCOL
          </span>
          <span className="text-emerald-300 font-bold">
            {device.protocol} (CH {device.channel ?? 38})
          </span>
          <span className="text-[9px] text-emerald-400/60">
            Packets captured: {device.seen}
          </span>
        </div>
      </div>

      {/* Through-Wall Detection Alert */}
      {device.throughWallProbability !== undefined && device.throughWallProbability > 0.25 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <div className="text-[11px]">
            <span className="font-bold">Through-Wall Signal Attenuation: </span>
            <span>{Math.round(device.throughWallProbability * 100)}% structural absorption registered via Wi-Fi 7 CSI phase delays.</span>
          </div>
        </div>
      )}

      {/* Trajectory History Mini-Plot */}
      {device.history && device.history.length > 0 && (
        <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/15 flex flex-col gap-1">
          <span className="text-[10px] text-emerald-500/70 flex items-center gap-1">
            <Activity className="w-3 h-3" /> POSITION HISTORY LOG (X, Y, Z)
          </span>
          <div className="flex flex-col gap-1 text-[10px] text-emerald-400/80 font-mono">
            {device.history.slice(-3).map((h, i) => (
              <div key={i} className="flex justify-between border-b border-emerald-500/10 pb-0.5">
                <span>Coord: ({h.x.toFixed(2)}, {h.y.toFixed(2)}, {h.z.toFixed(2)})m</span>
                <span className="text-emerald-500/60" suppressHydrationWarning>T-{Math.max(0, Math.round((3 - i) * 15))}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        {onTrackTarget && (
          <button
            onClick={() => onTrackTarget(device)}
            className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            LOCK TARGET ON RADAR
          </button>
        )}
      </div>
    </div>
  );
};
