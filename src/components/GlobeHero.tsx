'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EventItem } from '@/lib/data/demoEvents';
import { getMapStyle } from '@/lib/map/style';
import { Maximize2, Minimize2, Navigation, Compass, Layers, RotateCcw } from 'lucide-react';

interface GlobeHeroProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  selectedEventId?: string | null;
  onNearMeClick?: () => void;
  userCoords?: { lat: number; lng: number } | null;
}

export function GlobeHero({
  events,
  onSelectEvent,
  selectedEventId,
  onNearMeClick,
  userCoords,
}: GlobeHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const rotateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize MapLibre with globe projection
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (maplibregl.config) {
      maplibregl.config.WORKER_URL = '/maplibre-gl-worker.mjs';
    }

    // Default center: Italy
    const defaultLng = 12.5674;
    const defaultLat = 41.8719;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyle(),
      center: [defaultLng, defaultLat],
      zoom: 2.2,
      minZoom: 1.5,
      maxZoom: 14,
      cooperativeGestures: true, // One-finger swipe scrolls page on mobile
    });

    mapRef.current = map;

    map.on('load', () => {
      // Set globe projection
      try {
        map.setProjection({ type: 'globe' });
      } catch (err) {
        console.warn('Globe projection fallback:', err);
      }

      setInitialLoaded(true);

      // Fetch approximate visitor location from server geo headers
      fetch('/api/geo')
        .then((res) => res.json())
        .then((geo) => {
          if (geo && typeof geo.lng === 'number' && typeof geo.lat === 'number') {
            map.flyTo({
              center: [geo.lng, geo.lat],
              zoom: geo.isDefault ? 2.5 : 3.5,
              duration: 2500,
              essential: true,
            });
          }
        })
        .catch(() => {
          // Keep Italy fallback
        });
    });

    // Handle user interaction pauses for idle rotation
    const pauseRotation = () => {
      setIsRotating(false);
      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
      rotateTimerRef.current = setTimeout(() => {
        setIsRotating(true);
      }, 7000);
    };

    map.on('mousedown', pauseRotation);
    map.on('touchstart', pauseRotation);
    map.on('wheel', pauseRotation);

    return () => {
      if (rotateTimerRef.current) clearTimeout(rotateTimerRef.current);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Idle smooth globe rotation loop
  useEffect(() => {
    if (!isRotating || !mapRef.current || !initialLoaded) return;

    const interval = setInterval(() => {
      if (!mapRef.current || !isRotating) return;
      const center = mapRef.current.getCenter();
      center.lng -= 0.15;
      mapRef.current.easeTo({
        center,
        duration: 900,
        easing: (n: number) => n,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRotating, initialLoaded]);

  // Handle fly to user coords if provided via "Near Me"
  useEffect(() => {
    if (userCoords && mapRef.current) {
      setIsRotating(false);
      mapRef.current.flyTo({
        center: [userCoords.lng, userCoords.lat],
        zoom: 6,
        duration: 2000,
        essential: true,
      });
    }
  }, [userCoords]);

  // Update event pins / markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !initialLoaded) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    events.forEach((event) => {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer group';

      if (event.approximate_location) {
        // Approximate location circle area
        el.className += ' map-approx-area';
        el.style.width = '44px';
        el.style.height = '44px';

        const centerDot = document.createElement('div');
        centerDot.className =
          'w-3 h-3 rounded-full bg-violet-400 shadow-md shadow-violet-500/50 border border-white/60';
        el.appendChild(centerDot);

        const tooltip = document.createElement('div');
        tooltip.className =
          'hidden group-hover:block absolute bottom-full mb-2 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-black/90 text-violet-300 border border-violet-500/40 whitespace-nowrap shadow-xl z-30 pointer-events-none';
        tooltip.textContent = `${event.title} (Area)`;
        el.appendChild(tooltip);
      } else {
        // Exact pin marker with pulse animation
        el.style.width = '28px';
        el.style.height = '28px';

        // Pulse ring
        const pulse = document.createElement('div');
        pulse.className = event.is_featured ? 'map-pin-pulse-featured' : 'map-pin-pulse';
        el.appendChild(pulse);

        // Core Pin Dot
        const dot = document.createElement('div');
        dot.className = `relative w-5 h-5 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 ${
          event.is_featured
            ? 'bg-gradient-to-tr from-amber-400 to-violet-500 border-2 border-white'
            : 'bg-gradient-to-tr from-violet-600 to-cyan-400 border-2 border-white/90'
        }`;

        // Center dot
        const inner = document.createElement('div');
        inner.className = 'w-1.5 h-1.5 rounded-full bg-white';
        dot.appendChild(inner);
        el.appendChild(dot);

        // Hover tooltip preview
        const tooltip = document.createElement('div');
        tooltip.className =
          'hidden group-hover:block absolute bottom-full mb-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0E0E1A]/95 text-white border border-white/20 whitespace-nowrap shadow-2xl z-30 pointer-events-none backdrop-blur-md';
        tooltip.innerHTML = `
          <div class="font-bold text-cyan-300">${event.artist_name}</div>
          <div class="text-[11px] text-slate-300">${event.venue_name} • ${event.city}</div>
        `;
        el.appendChild(tooltip);
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setIsRotating(false);
        onSelectEvent(event);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([event.lng, event.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [events, initialLoaded, onSelectEvent]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        mapRef.current?.resize();
      }, 250);
      return next;
    });
  };

  const handleResetOrientation = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [12.5674, 41.8719],
      zoom: 2.5,
      pitch: 0,
      bearing: 0,
      duration: 1500,
    });
  };

  return (
    <div
      className={`relative w-full transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen bg-[#07070D]'
          : 'h-[500px] sm:h-[620px] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Top Overlay Badges & Title */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel text-xs font-semibold text-cyan-400 border border-cyan-500/30 backdrop-blur-md shadow-lg pointer-events-auto">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Interactive 3D Live Globe</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <p className="text-xs text-slate-400 mt-2 hidden sm:block max-w-xs drop-shadow">
          Drag to spin worldwide • Click pins for tickets & live details • Two fingers to scroll on mobile
        </p>
      </div>

      {/* Floating Controls Overlay (Top Right) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-2">
        {onNearMeClick && (
          <button
            onClick={onNearMeClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel text-xs font-semibold text-slate-200 hover:text-white hover:border-cyan-400/50 transition-all shadow-lg active:scale-95"
            title="Locate events near you"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Near me</span>
          </button>
        )}

        <button
          onClick={handleResetOrientation}
          className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-violet-400/50 transition-all shadow-lg active:scale-95"
          title="Reset View"
          aria-label="Reset View"
        >
          <RotateCcw className="w-4 h-4 text-violet-400" />
        </button>

        {/* Explore Globe Fullscreen Button (Essential for Mobile 1-finger gesture requirement) */}
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all active:scale-95"
          title={isFullscreen ? 'Exit Fullscreen' : 'Explore Globe (Full Screen)'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-4 h-4" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4" />
              <span>Explore Globe</span>
            </>
          )}
        </button>
      </div>

      {/* Legend at bottom left */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10 hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl bg-[#0F0F1A]/85 backdrop-blur-md border border-white/10 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 inline-block shadow-sm" />
          <span>Live gig</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-sm" />
          <span>Featured</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border border-dashed border-cyan-400 bg-violet-500/30 inline-block" />
          <span>Approximate area</span>
        </div>
      </div>
    </div>
  );
}
