'use client';

import React, { useState } from 'react';
import { generateDolphyPluginV2Code } from '@/lib/plugin-generator';
import { Download, FileCode, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PluginDownloaderModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const pythonCode = generateDolphyPluginV2Code();

  if (!isOpen) return null;

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#6ee7b7'],
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-xl hud-border bg-[#030d08] p-5 flex flex-col gap-4 max-h-[90vh] overflow-hidden text-xs font-mono">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-emerald-500/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                BLE Radar Locator v2.0.0
                <span className="text-[10px] bg-emerald-500 text-black px-1.5 py-0.5 rounded font-bold">
                  DOLPHY PLUGIN
                </span>
              </h2>
              <p className="text-[11px] text-emerald-400/80">
                Upgraded from v1.7.0 / v1.5.3 to v2.0.0 (3D Projection, Wi-Fi 7 CSI, Hotspot Mesh & UUID/UID)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-500 hover:text-white px-2 py-1 rounded hover:bg-emerald-950"
          >
            ✕
          </button>
        </div>

        {/* Change log highlight */}
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 flex flex-col gap-1.5 text-[11px]">
          <div className="font-bold text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            What is upgraded in v2.0.0:
          </div>
          <ul className="list-disc list-inside text-emerald-400/80 space-y-0.5 text-[10.5px]">
            <li><strong>3D Perspective Radar Projection:</strong> Isometric rendering of targets with elevation azimuth.</li>
            <li><strong>Wi-Fi 7 CSI Subcarrier Aided Positioning:</strong> Through-wall detection and delay-spread compensation.</li>
            <li><strong>Public UUID & UID Decoders:</strong> Inspects public Service UUIDs (Exposure, Eddystone, FindMy) and device names.</li>
            <li><strong>Secondary Spoofer / Hotspot Mesh Relay:</strong> Decentralized triangulation using peer phones as anchors.</li>
            <li><strong>Offline Fallback:</strong> Retains dead-reckoning and cached signal maps without active connections.</li>
          </ul>
        </div>

        {/* Code Preview */}
        <div className="relative rounded-lg bg-black/80 border border-emerald-500/20 p-3 overflow-y-auto max-h-[300px] text-[10px] text-emerald-400/90 font-mono">
          <pre>{pythonCode}</pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-500/20">
          <div className="text-[11px] text-emerald-500/70">
            Export format compatible with Dolphy and Android Flipper ecosystem.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40 flex items-center gap-1.5 font-bold"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'COPIED TO CLIPBOARD' : 'COPY CODE'}
            </button>

            <button
              onClick={() => downloadFile('BLE_Radar_Locator_v2.0.0.dolphyplugin', pythonCode)}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD .dolphyplugin (v2.0.0)
            </button>

            <button
              onClick={() => downloadFile('BLE_Radar_Locator_v2.0.0.txt', pythonCode)}
              className="px-3 py-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 flex items-center gap-1.5 font-bold"
            >
              <FileCode className="w-4 h-4" />
              DOWNLOAD AS .TXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
