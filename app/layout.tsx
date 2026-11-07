import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BLE Radar Locator v2.0 - Hyper-Precision RF & Mesh Positioning',
  description: 'Tactical RF & Bluetooth Low Energy Radar v2.0 with Wi-Fi 7 CSI through-wall sensing, decentralized mesh triangulation, UUID/UID device inspection, 3D radar view, and exportable logs.',
  openGraph: {
    title: 'BLE Radar Locator v2.0 - Hyper-Precision RF & Mesh Positioning',
    description: 'Tactical RF & Bluetooth Low Energy Radar v2.0 with Wi-Fi 7 CSI through-wall sensing, decentralized mesh triangulation, UUID/UID device inspection, 3D radar view, and exportable logs.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BLE Radar Locator v2.0 - Tactical Radar',
    description: 'BLE, Wi-Fi 7, and Mesh multi-source triangulation radar with 3D tracking and DolphyPlugin v2.0.0 exporter.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark bg-[#030706] text-emerald-400 antialiased selection:bg-emerald-500 selection:text-black">
      <body suppressHydrationWarning className="min-h-screen bg-[#030706] font-mono text-emerald-400 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
