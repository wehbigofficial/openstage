'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EventItem } from '@/lib/data/demoEvents';
import { getMapStyle } from '@/lib/map/style';
import { MapPin, Layers } from 'lucide-react';

interface Map2DSectionProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  userCoords?: { lat: number; lng: number } | null;
}

export function Map2DSection({
  events,
  onSelectEvent,
  userCoords,
}: Map2DSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (maplibregl.config) {
      maplibregl.config.WORKER_URL = '/maplibre-gl-worker.mjs';
    }

    // Initial center: user coords or Italy or first event
    const initialLng = userCoords ? userCoords.lng : events[0]?.lng ?? 12.5674;
    const initialLat = userCoords ? userCoords.lat : events[0]?.lat ?? 41.8719;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyle(),
      center: [initialLng, initialLat],
      zoom: userCoords ? 6 : 3,
      cooperativeGestures: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers on events change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (events.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    events.forEach((event) => {
      bounds.extend([event.lng, event.lat]);

      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer group';

      if (event.approximate_location) {
        el.className += ' map-approx-area';
        el.style.width = '42px';
        el.style.height = '42px';

        const centerDot = document.createElement('div');
        centerDot.className =
          'w-3 h-3 rounded-full bg-violet-400 shadow-md shadow-violet-500/50 border border-white/60';
        el.appendChild(centerDot);
      } else {
        el.style.width = '26px';
        el.style.height = '26px';

        const pulse = document.createElement('div');
        pulse.className = event.is_featured ? 'map-pin-pulse-featured' : 'map-pin-pulse';
        el.appendChild(pulse);

        const dot = document.createElement('div');
        dot.className = `relative w-5 h-5 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 ${
          event.is_featured
            ? 'bg-gradient-to-tr from-amber-400 to-violet-500 border-2 border-white'
            : 'bg-gradient-to-tr from-violet-600 to-cyan-400 border-2 border-white'
        }`;

        const inner = document.createElement('div');
        inner.className = 'w-1.5 h-1.5 rounded-full bg-white';
        dot.appendChild(inner);
        el.appendChild(dot);
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectEvent(event);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([event.lng, event.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Auto-fit to show filtered events comfortably
    if (events.length > 1 && !bounds.isEmpty()) {
      try {
        map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 1200 });
      } catch {
        // Ignore fit error
      }
    }
  }, [events, onSelectEvent]);

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl mt-6 animate-in fade-in duration-300">
      <div ref={containerRef} className="w-full h-full" />

      {/* 2D Overlay Badge */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs font-semibold text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-lg pointer-events-auto">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Navigable 2D Event Map</span>
          <span className="text-slate-400">({events.length} live pins)</span>
        </div>
      </div>
    </div>
  );
}
