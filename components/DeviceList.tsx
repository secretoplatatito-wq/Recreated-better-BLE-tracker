'use client';

import React from 'react';
import { DeviceInfo } from '@/lib/radar-types';
import { getRssiColor, formatDistance } from '@/lib/radar-math';
import { Radio, Smartphone, Tag, Wifi, Server, Activity, ShieldAlert, ChevronRight } from 'lucide-react';

interface DeviceListProps {
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  onSelectDevice: (device: DeviceInfo) => void;
  searchQuery: string;
  sortBy: string;
  onSortChange: (sort: any) => void;
  minRssi: number;
  onMinRssiChange: (rssi: number) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  searchQuery,
  sortBy,
  onSortChange,
  minRssi,
  onMinRssiChange,
}) => {
  const getDeviceIcon = (type: DeviceInfo['deviceType']) => {
    switch (type) {
      case 'phone':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'tag':
        return <Tag className="w-4 h-4 text-cyan-400" />;
      case 'wifi_ap':
        return <Wifi className="w-4 h-4 text-emerald-300" />;
      case 'mesh_node':
        return <Server className="w-4 h-4 text-amber-400" />;
      default:
        return <Radio className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-3 font-mono">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500/70 text-[11px]">SORT:</span>
          {['rssi', 'distance', 'name', 'confidence'].map((mode) => (
            <button
              key={mode}
              onClick={() => onSortChange(mode)}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all ${
                sortBy === mode
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-emerald-500/70 text-[11px]">MIN RSSI:</span>
          {[-100, -85, -70, -55].map((val) => (
            <button
              key={val}
              onClick={() => onMinRssiChange(val)}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                minRssi === val
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40'
              }`}
            >
              {val}dBm
            </button>
          ))}
        </div>
      </div>

      {/* Devices Cards */}
      <div className="flex flex-col gap-2 max-h-[580px] overflow-y-auto pr-1">
        {devices.length === 0 ? (
          <div className="p-8 text-center rounded-xl hud-border text-emerald-500/70 text-xs">
            NO DEVICES REGISTERED MATCHING FILTER CRITERIA
          </div>
        ) : (
          devices.map((dev, idx) => {
            const isSelected = selectedDevice?.address === dev.address;
            const rssiMeta = getRssiColor(dev.rssi_smooth);

            return (
              <div
                key={dev.address}
                onClick={() => onSelectDevice(dev)}
                className={`p-3 rounded-xl cursor-pointer transition-all border flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-emerald-950/50 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-black/40 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/20'
                }`}
              >
                {/* Top Row: Icon, Name, Proximity */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/30">
                      {getDeviceIcon(dev.deviceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {idx + 1}. {dev.name}
                        </span>
                        {dev.isRelayNode && (
                          <span className="text-[9px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 px-1 rounded">
                            MESH RELAY
                          </span>
                        )}
                        {dev.throughWallProbability && dev.throughWallProbability > 0.4 && (
                          <span className="text-[9px] bg-red-950 border border-red-500/40 text-red-300 px-1 rounded flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" /> WALL
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-500/70 font-mono">
                        {dev.address} · {dev.vendor}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-emerald-300">
                      ~{formatDistance(dev.distance)}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: rssiMeta.hex }}>
                      {dev.rssi} dBm
                    </span>
                  </div>
                </div>

                {/* Bottom Row: UUID, Protocol, Confidence Tag */}
                <div className="flex items-center justify-between pt-1 border-t border-emerald-500/10 text-[10px]">
                  <div className="flex items-center gap-2 text-emerald-400/80 truncate max-w-[280px]">
                    <span className="text-emerald-500/60">UUID:</span>
                    <span className="font-mono truncate">{dev.uuid || '0000FD6F-...'}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20 text-[9px]">
                      {dev.protocol}
                    </span>
                    <span className="text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded text-[9px] font-bold">
                      {dev.confidence}% Prec.
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
