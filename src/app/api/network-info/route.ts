import { NextResponse } from 'next/server';
import os from 'os';
import QRCode from 'qrcode';

export async function GET() {
  try {
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        // Skip internal/loopback and non-IPv4
        if (iface.family === 'IPv4' && !iface.internal) {
          // Prefer 192.168.x or 10.x
          if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
            localIp = iface.address;
            break;
          } else if (localIp === 'localhost' && !iface.address.startsWith('169.254.')) {
            localIp = iface.address;
          }
        }
      }
      if (localIp.startsWith('192.168.') || localIp.startsWith('10.')) break;
    }

    const port = process.env.PORT || '3000';
    const localMobileUrl = `http://${localIp}:${port}`;
    const publicLiveUrl = 'https://suggested-resolutions-samba-delayed.trycloudflare.com';

    // Generate QR code for the public live URL (accessible anywhere in the world)
    const publicQrDataUrl = await QRCode.toDataURL(publicLiveUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0369a1',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    // Generate QR code for local Wi-Fi
    const localQrDataUrl = await QRCode.toDataURL(localMobileUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });

    return NextResponse.json({
      localIp,
      port,
      mobileUrl: localMobileUrl,
      publicUrl: publicLiveUrl,
      publicQrDataUrl,
      localQrDataUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
