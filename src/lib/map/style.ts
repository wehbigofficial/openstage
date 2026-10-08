import type { StyleSpecification } from 'maplibre-gl';

export function getMapStyle(): StyleSpecification | string {
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

  if (mapTilerKey && mapTilerKey !== 'your-maptile-key' && mapTilerKey.length > 5) {
    return `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${mapTilerKey}`;
  }

  // High-performance, key-free Dark Canvas basemap (Esri Dark Gray Canvas + Labels)
  return {
    version: 8,
    name: 'OpenStage Dark Mode',
    sources: {
      'esri-dark-base': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.esri.com">Esri</a> &copy; OpenStreetMap contributors',
      },
      'esri-dark-reference': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#07070D',
        },
      },
      {
        id: 'esri-base-layer',
        type: 'raster',
        source: 'esri-dark-base',
        minzoom: 0,
        maxzoom: 18,
        paint: {
          'raster-opacity': 0.95,
          'raster-contrast': 0.1,
        },
      },
      {
        id: 'esri-reference-layer',
        type: 'raster',
        source: 'esri-dark-reference',
        minzoom: 0,
        maxzoom: 18,
        paint: {
          'raster-opacity': 0.85,
        },
      },
    ],
  };
}
