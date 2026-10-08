import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check common deployment headers (Vercel, Cloudflare, AWS CloudFront)
  const latHeader = request.headers.get('x-vercel-ip-latitude');
  const lngHeader = request.headers.get('x-vercel-ip-longitude');
  const countryHeader =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country');
  const cityHeader = request.headers.get('x-vercel-ip-city');

  if (latHeader && lngHeader) {
    const lat = parseFloat(latHeader);
    const lng = parseFloat(lngHeader);
    if (!isNaN(lat) && !isNaN(lng)) {
      return NextResponse.json({
        lat,
        lng,
        city: cityHeader || 'Your Location',
        country: countryHeader || '',
        isDefault: false,
      });
    }
  }

  // Default fallback: Italy (Center Rome approx 41.8719, 12.5674)
  return NextResponse.json({
    lat: 41.8719,
    lng: 12.5674,
    city: 'Italy',
    country: 'IT',
    isDefault: true,
  });
}
