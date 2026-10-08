import { NextRequest, NextResponse } from 'next/server';

export interface GeocodeResult {
  name: string;
  city?: string;
  country?: string;
  lat: number;
  lng: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  // 1. Try MapTiler Geocoding if key is present and not dummy
  if (mapTilerKey && mapTilerKey !== 'your-maptile-key') {
    try {
      const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
        q
      )}.json?key=${mapTilerKey}&autocomplete=true&limit=5`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const results: GeocodeResult[] = (data.features || []).map((f: any) => ({
          name: f.place_name || f.text,
          city: f.text,
          country: f.context?.find((c: any) => c.id.startsWith('country'))?.text || '',
          lat: f.center[1],
          lng: f.center[0],
        }));
        return NextResponse.json({ results });
      }
    } catch {
      // Fall through to fallback
    }
  }

  // 2. Open fallback: Photon by Komoot (OpenStreetMap based, no API key needed, high rate limits)
  try {
    const fallbackUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      q
    )}&limit=5`;
    const res = await fetch(fallbackUrl, {
      headers: {
        'User-Agent': 'OpenStage/1.0 (https://openstage.live)',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const results: GeocodeResult[] = (data.features || []).map((f: any) => {
        const props = f.properties || {};
        const parts = [props.name, props.city, props.country].filter(Boolean);
        const name = parts.join(', ');
        return {
          name: name || props.name || 'Location',
          city: props.city || props.name,
          country: props.country || '',
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        };
      });
      return NextResponse.json({ results });
    }
  } catch {
    // If external call fails, return empty
  }

  return NextResponse.json({ results: [] });
}
