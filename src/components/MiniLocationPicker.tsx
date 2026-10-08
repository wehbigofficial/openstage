'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMapStyle } from '@/lib/map/style';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';

interface MiniLocationPickerProps {
  initialLat: number;
  initialLng: number;
  approximateLocation: boolean;
  onLocationChange: (lat: number, lng: number) => void;
  onApproximateChange: (approx: boolean) => void;
}

export default function MiniLocationPicker({
  initialLat,
  initialLng,
  approximateLocation,
  onLocationChange,
  onApproximateChange,
}: MiniLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerInstance = useRef<maplibregl.Marker | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    const styleUrl = getMapStyle();
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [initialLng, initialLat],
      zoom: 14,
      pitch: 0,
      attributionControl: false,
    });

    const marker = new maplibregl.Marker({
      draggable: true,
      color: '#ec4899', // pink-500
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map);

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      const newLat = parseFloat(lngLat.lat.toFixed(6));
      const newLng = parseFloat(lngLat.lng.toFixed(6));
      setCoords({ lat: newLat, lng: newLng });
      onLocationChange(newLat, newLng);
    });

    mapInstance.current = map;
    markerInstance.current = marker;

    return () => {
      map.remove();
    };
  }, []);

  // Update map and marker if external initialLat/initialLng change
  useEffect(() => {
    if (
      mapInstance.current &&
      markerInstance.current &&
      (coords.lat !== initialLat || coords.lng !== initialLng)
    ) {
      setCoords({ lat: initialLat, lng: initialLng });
      markerInstance.current.setLngLat([initialLng, initialLat]);
      mapInstance.current.flyTo({
        center: [initialLng, initialLat],
        zoom: 14,
        essential: true,
      });
    }
  }, [initialLat, initialLng]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-pink-400" />
          <span>Posizione esatta sulla mappa (Pin Trascinabile)</span>
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </span>
      </div>

      <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-white/10 glass-panel">
        <div ref={mapContainer} className="w-full h-full" />
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-slate-300 flex items-center gap-1.5 border border-white/10 pointer-events-none">
          <Navigation className="w-3 h-3 text-cyan-400" />
          <span>Trascina il pin per correggere la posizione esatta</span>
        </div>
      </div>

      {/* Approximate Location Checkbox */}
      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
        <input
          type="checkbox"
          id="approxLoc"
          checked={approximateLocation}
          onChange={(e) => onApproximateChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-400 cursor-pointer"
        />
        <label htmlFor="approxLoc" className="text-xs text-slate-300 cursor-pointer select-none space-y-0.5">
          <div className="font-semibold text-white flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Mostra solo posizione approssimativa</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Ideale per feste private, loft o concerti segreti. Nella pagina pubblica e sulla mappa globale verrà mostrata solo la città o il quartiere, senza via né numero civico esatto.
          </p>
        </label>
      </div>
    </div>
  );
}
