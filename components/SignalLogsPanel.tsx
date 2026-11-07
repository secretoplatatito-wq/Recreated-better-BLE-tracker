'use client';

import React, { useState } from 'react';
import { RadarLog, DeviceInfo } from '@/lib/radar-types';
import { Download, Copy, Trash2, FileText, Check, Database } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SignalLogsPanelProps {
  logs: RadarLog[];
  devices: DeviceInfo[];
  onClearLogs: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export const SignalLogsPanel: React.FC<SignalLogsPanelProps> = ({
  logs,
  devices,
  onClearLogs,
  onExportCSV,
  onExportJSON,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerExportWithConfetti = (fn: () => void) => {
    fn();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#06b6d4', '#34d399'],
    });
  };

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      {/* Controls Bar */}
      <div className="p-3 rounded-xl hud-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-xs">SIGNAL LOGS & TELEMETRY ({logs.length} EVENTS)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerExportWithConfetti(onExportCSV)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            EXPORT CSV (v2.0)
          </button>

          <button
            onClick={() => triggerExportWithConfetti(onExportJSON)}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 hover:bg-cyan-900/40 text-cyan-300 font-bold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            JSON DUMP
          </button>

          <button
            onClick={handleCopyLogs}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 hover:bg-emerald-900/60 text-emerald-300 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'COPIED' : 'COPY'}
          </button>

          <button
            onClick={onClearLogs}
            className="px-2 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 text-red-400 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real-time terminal log viewer */}
      <div className="p-3.5 rounded-xl hud-border bg-black/60 max-h-[480px] overflow-y-auto flex flex-col gap-1.5 font-mono text-[11px]">
        {logs.length === 0 ? (
          <div className="text-emerald-500/60 p-6 text-center">NO LOG ENTRIES RECORDED</div>
        ) : (
          logs.map((log) => {
            let color = 'text-emerald-400/90';
            let mark = '•';
            if (log.level === 'success') {
              color = 'text-emerald-300 font-semibold';
              mark = '✔';
            } else if (log.level === 'warning') {
              color = 'text-amber-400';
              mark = '⚠';
            } else if (log.level === 'error') {
              color = 'text-red-400';
              mark = '✖';
            } else if (log.level === 'mesh') {
              color = 'text-cyan-300';
              mark = '⚡';
            }

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed border-b border-emerald-500/5 pb-1">
                <span className="text-emerald-500/50 shrink-0">[{log.timestamp}]</span>
                <span className="shrink-0">{mark}</span>
                <span className={color}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
