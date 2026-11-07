'use client';

import React, { useEffect, useRef } from 'react';
import { DeviceInfo } from '@/lib/radar-types';
import { getRssiColor, formatDistance } from '@/lib/radar-math';

interface RadarCanvasProps {
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  onSelectDevice: (device: DeviceInfo) => void;
  isScanning: boolean;
  is3DMode: boolean;
  compassHeading: number;
  wifiCsiActive: boolean;
  meshAided: boolean;
  rangeMeters?: number;
}

export const RadarCanvas: React.FC<RadarCanvasProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  isScanning,
  is3DMode,
  compassHeading,
  wifiCsiActive,
  meshAided,
  rangeMeters = 30,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const sweepAngleRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const pitch = is3DMode ? 0.62 : 0; // Tilt angle for 3D perspective
    const cameraDist = 480;

    const project = (x: number, y: number, z: number, cx: number, cy: number) => {
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const y1 = y * cosP - z * sinP;
      const z1 = y * sinP + z * cosP;
      const factor = is3DMode ? cameraDist / (cameraDist + y1 * 0.75) : 1;
      return {
        px: cx + x * factor,
        py: cy + z1 * factor,
        scale: factor,
      };
    };

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (isScanning) {
        sweepAngleRef.current = (sweepAngleRef.current + delta * 2.4) % (Math.PI * 2);
      }

      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = is3DMode ? height * 0.54 : height / 2;
      const baseRadius = Math.min(width, height) * 0.40;

      // Radial background grid
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, baseRadius * 1.35);
      bgGrad.addColorStop(0, '#062016');
      bgGrad.addColorStop(0.7, '#03120c');
      bgGrad.addColorStop(1, '#020705');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Concentric distance rings
      const rings = [
        { ratio: 1.0, label: `${rangeMeters} m` },
        { ratio: 0.66, label: `${Math.round(rangeMeters * 0.66)} m` },
        { ratio: 0.33, label: `${Math.round(rangeMeters * 0.33)} m` },
        { ratio: 0.12, label: `${(rangeMeters * 0.12).toFixed(1)} m` },
      ];

      // Draw Rings
      rings.forEach((ring) => {
        ctx.strokeStyle = ring.ratio === 1.0 ? 'rgba(16, 185, 129, 0.45)' : 'rgba(16, 185, 129, 0.2)';
        ctx.lineWidth = ring.ratio === 1.0 ? 1.5 : 1;
        ctx.beginPath();

        const step = 0.08;
        for (let a = 0; a <= Math.PI * 2 + step; a += step) {
          const rx = Math.sin(a) * (baseRadius * ring.ratio);
          const ry = Math.cos(a) * (baseRadius * ring.ratio);
          const p = project(rx, ry, 0, cx, cy);
          if (a === 0) ctx.moveTo(p.px, p.py);
          else ctx.lineTo(p.px, p.py);
        }
        ctx.stroke();

        // Ring Labels
        const labelPoint = project(0, -(baseRadius * ring.ratio), 0, cx, cy);
        ctx.fillStyle = 'rgba(52, 211, 153, 0.75)';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(ring.label, labelPoint.px + 4, labelPoint.py - 2);
      });

      // Cardinal axes & compass lines
      const headingRad = (compassHeading * Math.PI) / 180;
      const axesAngles = [0, 45, 90, 135, 180, 225, 270, 315];
      axesAngles.forEach((deg) => {
        const rad = (deg * Math.PI) / 180 - headingRad;
        const ax = Math.sin(rad) * baseRadius;
        const ay = -Math.cos(rad) * baseRadius;
        const p1 = project(0, 0, 0, cx, cy);
        const p2 = project(ax, ay, 0, cx, cy);

        ctx.strokeStyle = deg % 90 === 0 ? 'rgba(16, 185, 129, 0.28)' : 'rgba(16, 185, 129, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      });

      // Cardinal Letters (N, E, S, W)
      const cardinals = [
        { label: 'N', deg: 0, color: '#ef4444' },
        { label: 'E', deg: 90, color: '#34d399' },
        { label: 'S', deg: 180, color: '#34d399' },
        { label: 'W', deg: 270, color: '#34d399' },
      ];
      cardinals.forEach(({ label, deg, color }) => {
        const rad = (deg * Math.PI) / 180 - headingRad;
        const lx = Math.sin(rad) * (baseRadius + 18);
        const ly = -Math.cos(rad) * (baseRadius + 18);
        const lp = project(lx, ly, 0, cx, cy);

        ctx.fillStyle = color;
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lp.px, lp.py);
      });

      // Radar Sweep Fan
      if (isScanning) {
        const sweepAngle = sweepAngleRef.current;
        ctx.save();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.beginPath();
        const centerP = project(0, 0, 0, cx, cy);
        ctx.moveTo(centerP.px, centerP.py);

        const sweepWidth = 0.5; // Fan spread
        for (let s = 0; s <= sweepWidth; s += 0.05) {
          const ang = sweepAngle - s;
          const sx = Math.sin(ang) * baseRadius;
          const sy = -Math.cos(ang) * baseRadius;
          const sp = project(sx, sy, 0, cx, cy);
          ctx.lineTo(sp.px, sp.py);
        }
        ctx.closePath();
        ctx.fill();

        // Main Sweep Line
        const leadingX = Math.sin(sweepAngle) * baseRadius;
        const leadingY = -Math.cos(sweepAngle) * baseRadius;
        const leadP = project(leadingX, leadingY, 0, cx, cy);
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(centerP.px, centerP.py);
        ctx.lineTo(leadP.px, leadP.py);
        ctx.stroke();
        ctx.restore();
      }

      // Center Node (Local User / Antenna)
      const origin = project(0, 0, 0, cx, cy);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(origin.px, origin.py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(origin.px, origin.py, 9, 0, Math.PI * 2);
      ctx.stroke();

      // Mesh Lines between nodes if Mesh is aided
      if (meshAided) {
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
        ctx.setLineDash([3, 4]);
        devices.forEach((devA, i) => {
          devices.slice(i + 1).forEach((devB) => {
            if (devA.distance < 12 && devB.distance < 12) {
              const radA = (devA.angle * Math.PI) / 180 - headingRad;
              const rDistA = Math.min(1.0, devA.distance / rangeMeters) * baseRadius;
              const pA = project(Math.sin(radA) * rDistA, -Math.cos(radA) * rDistA, (devA.elevation || 0) * 1.5, cx, cy);

              const radB = (devB.angle * Math.PI) / 180 - headingRad;
              const rDistB = Math.min(1.0, devB.distance / rangeMeters) * baseRadius;
              const pB = project(Math.sin(radB) * rDistB, -Math.cos(radB) * rDistB, (devB.elevation || 0) * 1.5, cx, cy);

              ctx.beginPath();
              ctx.moveTo(pA.px, pA.py);
              ctx.lineTo(pB.px, pB.py);
              ctx.stroke();
            }
          });
        });
        ctx.restore();
      }

      // Render Targets
      devices.forEach((dev) => {
        const isSelected = selectedDevice?.address === dev.address;
        const rad = (dev.angle * Math.PI) / 180 - headingRad;
        const rDist = Math.min(1.0, Math.max(0.04, dev.distance / rangeMeters)) * baseRadius;
        const worldX = Math.sin(rad) * rDist;
        const worldY = -Math.cos(rad) * rDist;
        const worldZ = (dev.elevation || 0) * (is3DMode ? 2.2 : 0);

        const groundPos = project(worldX, worldY, 0, cx, cy);
        const targetPos = project(worldX, worldY, worldZ, cx, cy);

        // Elevation stalk in 3D
        if (is3DMode && Math.abs(worldZ) > 1) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.28)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(groundPos.px, groundPos.py);
          ctx.lineTo(targetPos.px, targetPos.py);
          ctx.stroke();

          // Ground shadow ellipse
          ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
          ctx.beginPath();
          ctx.ellipse(groundPos.px, groundPos.py, 4 * targetPos.scale, 2 * targetPos.scale, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        const colorMeta = getRssiColor(dev.rssi_smooth);
        const pulse = 0.5 + 0.5 * Math.sin(time / 200 + dev.seen);

        // Through-wall halo effect
        if (dev.throughWallProbability && dev.throughWallProbability > 0.3) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.arc(targetPos.px, targetPos.py, (16 + pulse * 6) * targetPos.scale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Selection Ring
        if (isSelected) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(targetPos.px, targetPos.py, 14 * targetPos.scale, 0, Math.PI * 2);
          ctx.stroke();

          // Crosshairs
          ctx.beginPath();
          ctx.moveTo(targetPos.px - 18, targetPos.py);
          ctx.lineTo(targetPos.px + 18, targetPos.py);
          ctx.moveTo(targetPos.px, targetPos.py - 18);
          ctx.lineTo(targetPos.px, targetPos.py + 18);
          ctx.stroke();
        }

        // Target point
        ctx.fillStyle = colorMeta.hex;
        ctx.beginPath();
        const ptSize = (dev.isRelayNode ? 7 : 5) * targetPos.scale;
        ctx.arc(targetPos.px, targetPos.py, Math.max(3, ptSize), 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.max(9, Math.round(10 * targetPos.scale))}px "JetBrains Mono", monospace`;
        ctx.fillStyle = isSelected ? '#38bdf8' : '#ffffff';
        ctx.fillText(dev.name, targetPos.px + 10, targetPos.py - 4);

        ctx.font = `${Math.max(8, Math.round(8.5 * targetPos.scale))}px "JetBrains Mono", monospace`;
        ctx.fillStyle = dev.throughWallProbability && dev.throughWallProbability > 0.4 ? '#f87171' : '#34d399';
        const infoTag = `${formatDistance(dev.distance)} | ${dev.rssi}dBm`;
        ctx.fillText(infoTag, targetPos.px + 10, targetPos.py + 7);
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [devices, selectedDevice, isScanning, is3DMode, compassHeading, wifiCsiActive, meshAided, rangeMeters]);

  // Click on canvas to select device
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const cx = width / 2;
    const cy = is3DMode ? height * 0.54 : height / 2;
    const baseRadius = Math.min(width, height) * 0.40;
    const headingRad = (compassHeading * Math.PI) / 180;
    const pitch = is3DMode ? 0.62 : 0;
    const cameraDist = 480;

    let closestDev: DeviceInfo | null = null;
    let minDistance = 25; // hit threshold in px

    devices.forEach((dev) => {
      const rad = (dev.angle * Math.PI) / 180 - headingRad;
      const rDist = Math.min(1.0, Math.max(0.04, dev.distance / rangeMeters)) * baseRadius;
      const worldX = Math.sin(rad) * rDist;
      const worldY = -Math.cos(rad) * rDist;
      const worldZ = (dev.elevation || 0) * (is3DMode ? 2.2 : 0);

      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const y1 = worldY * cosP - worldZ * sinP;
      const z1 = worldY * sinP + worldZ * cosP;
      const factor = is3DMode ? cameraDist / (cameraDist + y1 * 0.75) : 1;
      const px = cx + worldX * factor;
      const py = cy + z1 * factor;

      const d = Math.hypot(clickX - px, clickY - py);
      if (d < minDistance) {
        minDistance = d;
        closestDev = dev;
      }
    });

    if (closestDev) {
      onSelectDevice(closestDev);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[440px] select-none rounded-xl overflow-hidden hud-border radar-glow">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Top Left HUD indicator */}
      <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-emerald-300 tracking-wider">
            {isScanning ? 'RADAR SWEEP ACTIVE' : 'RADAR STANDBY'}
          </span>
        </div>
        <div className="text-emerald-500/80 font-mono text-[10px]">
          HEADING: {Math.round(compassHeading)}° | VIEW: {is3DMode ? '3D ISOMETRIC' : '2D PLAN'}
        </div>
      </div>

      {/* Top Right Range & CSI Indicators */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1 pointer-events-none text-[10px]">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
          <span>MAX RANGE:</span>
          <span className="font-bold text-emerald-400">{rangeMeters}m</span>
        </div>
        {wifiCsiActive && (
          <div className="flex items-center gap-1 text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Wi-Fi 7 CSI Subcarrier Aided</span>
          </div>
        )}
        {meshAided && (
          <div className="flex items-center gap-1 text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>P2P Hotspot Relay Active</span>
          </div>
        )}
      </div>

      {/* Scanline CRT overlay effect */}
      <div className="absolute inset-0 crt-overlay opacity-40 pointer-events-none" />
    </div>
  );
};
