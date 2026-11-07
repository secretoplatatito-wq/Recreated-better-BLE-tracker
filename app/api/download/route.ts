import { generateDolphyPluginV2Code } from '@/lib/plugin-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'dolphyplugin';
  const code = generateDolphyPluginV2Code();

  const filename = format === 'txt' 
    ? 'BLE_Radar_Locator_v2.0.0.txt' 
    : 'BLE_Radar_Locator_v2.0.0.dolphyplugin';

  return new NextResponse(code, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}
